import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/yatsun/app.js',import.meta.url),'utf8');
function setup(){
  const elements=new Map();
  function element(key){if(!elements.has(key))elements.set(key,{textContent:'',hidden:false,classList:{toggle(){},remove(){}},replaceChildren(...v){this.textContent=v.map(x=>x.textContent).join('');},querySelector:s=>element(key+s)});return elements.get(key);}
  const context={console,Date,Promise,document:{createElement:()=>({textContent:''}),createTextNode:textContent=>({textContent})},$:element,$$:s=>s==='.player-card'?[element('me'),element('them')]:[element(s)],authUser:{uid:'me'},authDisplayName:'Mitt namn',online:{active:true},onlineRevision:-1,dice:Array.from({length:5},(_,id)=>({id})),rollButton:element('roll'),rollNumber:element('rolls'),rollHint:element('hint'),busy:false,boardSkin:'classic',playerScores:{},aiScores:{},rolls:0,lastScore:null,showScreen(){},buildScorecard(){},showReaction(){},triggerYatsun(){},playDiceSound(){},totals:()=>({total:0}),renders:[],updateSuggestions(){},dicePhysicsPromise:Promise.resolve()};
  context.renderDice=animate=>{context.renders.push(animate);if(animate)context.dicePhysicsPromise=new Promise(resolve=>context.settle=resolve);};
  vm.createContext(context);vm.runInContext(source.slice(source.indexOf('let lastOnlineReaction='),source.indexOf('online=createSocial')),context);
  return {c:context,e:element};
}
const room=(rolls=0,revision=0,turn='me')=>({id:'room',revision,otherName:'Min vän',state:{players:['me','them'],turn,rolls,dice:[6,5,4,3,2],held:[false,false,false,false,false],scores:{me:{},them:{}},done:false}});
test('MP replaces solo panel and restores solo label',()=>{const {c,e}=setup();c.applyOnlineRoom(room(),true);assert.equal(e('.match-label').textContent,' MULTIPLAYER');assert.equal(e('me strong'.replace(' ','' )).textContent,'Mitt namn');assert.equal(e('themstrong').textContent,'Min vän');assert.equal(e('them.avatar').textContent,'M');c.updateMatchPlayers(false);assert.equal(e('.match-label').textContent,' SINGELMATCH');assert.equal(e('them.avatar').textContent,'AI');});
test('new roll animates once; pending updates cannot interrupt it',async()=>{const {c}=setup();c.applyOnlineRoom(room(),true);c.applyOnlineRoom(room(1,1),false,false,true);assert.equal(c.renders.filter(Boolean).length,1);assert.equal(c.busy,true);c.applyOnlineRoom(room(1,1),false,false,true);assert.equal(c.renders.length,2);c.settle();await c.dicePhysicsPromise;await Promise.resolve();assert.equal(c.busy,false);assert.equal(c.renders.filter(Boolean).length,1);assert.deepEqual(c.dice.map(d=>d.value),[6,5,4,3,2]);});
test('opponent casts animate, restored rooms and holds do not',async()=>{const {c}=setup();c.applyOnlineRoom(room(2,2,'them'),true);assert.equal(c.renders.filter(Boolean).length,0);c.applyOnlineRoom(room(2,3,'them'));assert.equal(c.renders.filter(Boolean).length,0);c.applyOnlineRoom(room(3,4,'them'));assert.equal(c.renders.filter(Boolean).length,1);c.settle();await c.dicePhysicsPromise;await Promise.resolve();assert.equal(c.busy,true);});
