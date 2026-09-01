import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseApp = initializeApp({apiKey:"AIzaSyBuJP3imBBQZ7CWJzUhosSbyEhi_Z0lgj8",authDomain:"bubbsan-c3ec7.firebaseapp.com",projectId:"bubbsan-c3ec7",storageBucket:"bubbsan-c3ec7.firebasestorage.app",messagingSenderId:"999127046153",appId:"1:999127046153:web:4ddd2814db25f691d800d8"});
const auth = getAuth(firebaseApp), firestore = getFirestore(firebaseApp);
let authUser = null, authDisplayName = "Gästspelare";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const diceRoot = $("#dice");
const rollButton = $("#roll-button");
const rollNumber = $("#roll-number");
const rollHint = $("#roll-hint");
const diceSound = new Audio("./assets/dice-roll.wav");
diceSound.preload = "auto";
const dice = Array.from({ length: 5 }, (_, id) => ({ id, value: id + 1, held: false, x:(id-2)*72, y:id%2?22:-24, rot:(id-2)*4 }));
const upper = ["Ettor", "Tvåor", "Treor", "Fyror", "Femmor", "Sexor"];
const lower = ["Ett par", "Två par", "Tretal", "Fyrtal", "Liten stege", "Stor stege", "Kåk", "Chans", "Yatzy"];
const categories = [...upper.map((label, index) => ({ id: `u${index + 1}`, label, upper: true })), ...lower.map((label, index) => ({ id: `l${index}`, label, upper: false }))];
const firstNames = ["Maj-Britt", "Bertil", "Gunilla", "Stig", "Agneta", "Kent", "Birgitta", "Lennart", "Monica", "Rolf", "Inger", "Göran", "Ulla", "Kenneth", "Ann-Katrin", "Sven", "Yvonne", "Leif", "Barbro", "Mats"];
const lastNames = ["Blixt", "Kastrull", "Gurka", "Fjäder", "Bång", "Plommon", "Vims", "Sjöbris", "Kotte", "Rullgardin", "Nypon", "Dunder", "Fluff", "Krans", "Månskensson", "Sprätt", "Tjoff", "Hallon", "Virvel", "Socker"];
const pipPositions = { 1:[[50,50]],2:[[27,27],[73,73]],3:[[27,27],[50,50],[73,73]],4:[[27,27],[73,27],[27,73],[73,73]],5:[[27,27],[73,27],[50,50],[27,73],[73,73]],6:[[27,23],[73,23],[27,50],[73,50],[27,77],[73,77]] };
const cubeLanding={1:"rotateX(0deg) rotateY(0deg)",2:"rotateY(-90deg)",3:"rotateX(-90deg)",4:"rotateX(90deg)",5:"rotateY(90deg)",6:"rotateY(180deg)"};
let rolls = 0, busy = false, playerScores = {}, aiScores = {}, profile = loadProfile(), remoteMatch = null, aiYatsunCelebrated = false;

function profileKey() { return `yatsun-profile-${authUser?.uid||"guest"}`; }
function loadProfile() { try { return { soloXp:0, unlocked:1, ...JSON.parse(localStorage.getItem(profileKey())||"{}") }; } catch { return { soloXp:0, unlocked:1 }; } }
function saveProfile() { localStorage.setItem(profileKey(), JSON.stringify(profile)); }
function matchKey(){return `yatsun-active-solo-${authUser?.uid||"guest"}`;}
function loadMatch(){try{return JSON.parse(localStorage.getItem(matchKey())||"null")||remoteMatch;}catch{return remoteMatch;}}
async function matchApi(action,state){if(!authUser)return null;const token=await authUser.getIdToken(),response=await fetch("./api/",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({action,state})});if(!response.ok)throw new Error("Matchservern svarade inte.");return response.json();}
async function loadRemoteMatch(){if(!authUser){remoteMatch=null;return;}try{const data=await matchApi("load_match");remoteMatch=data?.match||null;if(remoteMatch&&!localStorage.getItem(matchKey()))localStorage.setItem(matchKey(),JSON.stringify(remoteMatch));updateContinueUi();}catch(error){console.warn("Kunde inte hämta sparad Yatsun-match",error);}}
function saveMatch(){if(Object.keys(playerScores).length>=categories.length)return;const state={rolls,playerScores,aiScores,dice:dice.map(({value,held,x,y,rot})=>({value,held,x,y,rot})),opponentLevel:profile.unlocked,updatedAt:Date.now()};remoteMatch=state;localStorage.setItem(matchKey(),JSON.stringify(state));updateContinueUi();void matchApi("save_match",state).catch((error)=>console.warn("Matchen sparades lokalt men inte på servern",error));}
function clearMatch(){remoteMatch=null;localStorage.removeItem(matchKey());updateContinueUi();void matchApi("delete_match").catch((error)=>console.warn("Kunde inte ta bort servermatchen",error));}
function updateContinueUi(){const saved=loadMatch(),button=$("#start-solo");if(!button)return;button.textContent=saved?`FORTSÄTT MOT ${opponentName(saved.opponentLevel||profile.unlocked).toLocaleUpperCase("sv-SE")} →`:`SPELA MOT ${opponentName().toLocaleUpperCase("sv-SE")} →`;}
function opponentName(level=profile.unlocked) { return `${firstNames[(level-1)%firstNames.length]} ${lastNames[(Math.floor((level-1)/firstNames.length)+level-1)%lastNames.length]}`; }
function updateProfileUi() { const level=Math.min(100,profile.unlocked), xp=profile.soloXp%100, card=$(".solo-card"); card.querySelector(".xp-preview b").textContent=`Singelnivå ${level}`; card.querySelector(".xp-preview small").textContent=`${xp} / 100 XP`; card.querySelector(".xp-preview em").style.width=`${xp}%`; updateContinueUi(); }
function showScreen(id) { ["#mode-screen","#lobby-screen","#game-screen"].forEach((selector)=>$(selector).classList.toggle("hidden",selector!==id)); document.body.classList.toggle("playing",id==="#game-screen"); window.scrollTo({top:0,behavior:"smooth"}); }

function renderDice(animate=false) {
  diceRoot.innerHTML="";
  dice.forEach((die,index)=>{
    const button=document.createElement("button"),shadow=document.createElement("span"),travel=document.createElement("span"),cube=document.createElement("span");
    button.type="button";
    button.className=`die die-3d${die.held?" held":""}${animate&&!die.held?" rolling":""}`;
    shadow.className="die-shadow";travel.className="die-travel";cube.className="die-cube";
    button.style.setProperty("--x",`${die.x}px`);button.style.setProperty("--y",`${die.y}px`);button.style.setProperty("--rot",`${die.rot}deg`);
    button.style.setProperty("--enter-x",`${index%2?-620:620}px`);button.style.setProperty("--enter-y",`${[-72,68,-48,78,-30][index]}px`);button.style.setProperty("--cross-x",`${index%2?190:-190}px`);button.style.setProperty("--cross-y",`${[-42,39,-29,47,-18][index]}px`);button.style.setProperty("--bounce-x",`${index%2?24:-24}px`);button.style.setProperty("--bounce-y",`${[-20,19,-14,22,-9][index]}px`);button.style.setProperty("--spin-x",`${(index%2?-1:1)*(900+index*210)}deg`);button.style.setProperty("--spin-y",`${(index%2?-1:1)*(1080+index*150)}deg`);button.style.setProperty("--landing","rotateX(0deg) rotateY(0deg)");button.style.setProperty("--roll-delay",`${index*52}ms`);
    button.setAttribute("aria-label",`Tärning ${index+1}: ${die.value}${die.held?", sparad":""}`);
    for(let faceIndex=1;faceIndex<=6;faceIndex++){const face=document.createElement("span"),faceValue=faceIndex===1?die.value:((die.value+faceIndex-2)%6)+1;face.className=`cube-face face-${faceIndex}`;pipPositions[faceValue].forEach(([x,y])=>{const pip=document.createElement("i");pip.className="pip";pip.style.left=`calc(${x}% - 5px)`;pip.style.top=`calc(${y}% - 5px)`;face.appendChild(pip);});cube.appendChild(face);}
    travel.appendChild(cube);button.append(shadow,travel);
    if(animate&&!die.held)setTimeout(()=>button.classList.remove("rolling"),1600);
    button.addEventListener("click",()=>{if(!rolls||busy)return;die.held=!die.held;renderDice();saveMatch();rollHint.textContent=die.held?"Tärningen är sparad.":"Tärningen kastas igen nästa gång.";});
    diceRoot.appendChild(button);
  });
  updateSuggestions();
}
function scatterDice(){
  const compact=window.innerWidth<680,candidates=compact?[[-112,-48],[-56,-48],[0,-48],[56,-48],[112,-48],[-112,32],[-56,32],[0,32],[56,32],[112,32]]:[[-210,-92],[-105,-92],[0,-92],[105,-92],[210,-92],[-210,44],[-105,44],[0,44],[105,44],[210,44]],minimum=compact?66:112,occupied=dice.filter((die)=>die.held).map((die)=>[die.x,die.y]);
  dice.filter((die)=>!die.held).forEach((die)=>{const choices=candidates.filter(([x,y])=>occupied.every(([ox,oy])=>Math.hypot(x-ox,y-oy)>=minimum)),pool=choices.length?choices:candidates,best=pool.map((point)=>({point,distance:occupied.length?Math.min(...occupied.map(([ox,oy])=>Math.hypot(point[0]-ox,point[1]-oy))):Math.random()*500})).sort((a,b)=>b.distance-a.distance)[0].point;die.x=best[0]+Math.round(Math.random()*12-6);die.y=best[1]+Math.round(Math.random()*12-6);die.rot=Math.round(Math.random()*24-12);occupied.push([die.x,die.y]);});
}
function playDiceSound(){diceSound.currentTime=0;void diceSound.play().catch(()=>{});}
function counts(values){const result=Array(7).fill(0);values.forEach((value)=>result[value]++);return result;}
function scoreCategory(id,values){const c=counts(values),sum=values.reduce((a,b)=>a+b,0),groups=c.slice(1).map((amount,value)=>({amount,value:value+1})).filter((g)=>g.amount);if(id[0]==="u"){const value=Number(id[1]);return c[value]*value;}if(id==="l0"){const pairs=groups.filter((g)=>g.amount>=2).map((g)=>g.value);return pairs.length?Math.max(...pairs)*2:0;}if(id==="l1"){const pairs=groups.filter((g)=>g.amount>=2).map((g)=>g.value).sort((a,b)=>b-a);return pairs.length>=2?(pairs[0]+pairs[1])*2:0;}if(id==="l2"){const group=groups.filter((g)=>g.amount>=3).sort((a,b)=>b.value-a.value)[0];return group?group.value*3:0;}if(id==="l3"){const group=groups.filter((g)=>g.amount>=4).sort((a,b)=>b.value-a.value)[0];return group?group.value*4:0;}if(id==="l4")return[1,2,3,4,5].every((value)=>c[value]===1)?15:0;if(id==="l5")return[2,3,4,5,6].every((value)=>c[value]===1)?20:0;if(id==="l6"){const pair=groups.find((g)=>g.amount===2),three=groups.find((g)=>g.amount===3);return pair&&three?pair.value*2+three.value*3:0;}if(id==="l7")return sum;if(id==="l8")return groups.some((g)=>g.amount===5)?50:0;return 0;}
function totals(scores){const upperTotal=upper.reduce((sum,_,index)=>sum+(scores[`u${index+1}`]??0),0),bonus=upperTotal>=63?50:0,lowerTotal=lower.reduce((sum,_,index)=>sum+(scores[`l${index}`]??0),0);return{upperTotal,bonus,total:upperTotal+bonus+lowerTotal};}

function buildScorecard(){$("#upper-score").innerHTML="";$("#lower-score").innerHTML="";const symbols=["⚀","⚁","⚂","⚃","⚄","⚅","◉","❖","◆","▦","⌁","⌁","⌂","?","★"];categories.forEach((category,index)=>{const tr=document.createElement("tr");tr.innerHTML=`<th><i>${symbols[index]}</i><span>${category.label}</span>${category.id==="u6"?"<small>Bonus vid 63: +50</small>":""}</th><td><button class="score-choice" data-id="${category.id}" disabled>—</button></td><td class="ai-score" data-ai-id="${category.id}">—</td>`;(category.upper?$("#upper-score"):$("#lower-score")).appendChild(tr);const button=tr.querySelector("button");button.addEventListener("click",()=>chooseScore(category.id));tr.addEventListener("click",(event)=>{if(event.target!==button&&!button.disabled)button.click();});});}
function displayScore(category,score){if(score===null||score===undefined)return"—";if(!category.upper)return String(score);const base=3*Number(category.id[1]),delta=score-base;return delta===0?"✓":`${delta>0?"+":""}${delta}`;}
function updateSuggestions(){
  const values=dice.map((d)=>d.value),previews=[];
  categories.forEach((category)=>{
    const button=$(`[data-id="${category.id}"]`),aiCell=$(`[data-ai-id="${category.id}"]`),row=button?.closest("tr");
    if(!button)return;
    row.classList.remove("scored","preview","best-preview","zero-preview");button.removeAttribute("title");
    if(category.id in playerScores){const actual=playerScores[category.id];button.textContent=displayScore(category,actual);button.title=category.upper?`${actual} poäng · ${button.textContent} mot riktvärdet`: `${actual} poäng`;button.disabled=true;row.classList.add("scored");}
    else{const preview=rolls?scoreCategory(category.id,values):null;button.textContent=preview===null?"—":String(preview);button.disabled=!rolls||busy;if(preview!==null){button.title=`Välj ${category.label}: ${preview} poäng`;row.classList.add("preview");if(preview===0)row.classList.add("zero-preview");previews.push({row,score:preview});}}
    const aiFilled=category.id in aiScores,aiText=displayScore(category,aiScores[category.id]);aiCell.innerHTML=aiFilled?`<span>${aiText}</span>`:"—";aiCell.classList.toggle("filled",aiFilled);
  });
  if(previews.length){const best=Math.max(...previews.map((item)=>item.score));if(best>0)previews.filter((item)=>item.score===best).forEach((item)=>item.row.classList.add("best-preview"));}
  const total=totals(playerScores),aiTotal=totals(aiScores);$("#upper-total").textContent=total.upperTotal;$("#ai-upper-total").textContent=aiTotal.upperTotal;$("#bonus").textContent=total.bonus||"—";$("#ai-bonus").textContent=aiTotal.bonus||"—";$("#player-total-small").textContent=total.total;$("#ai-total").textContent=aiTotal.total;setRollButtonState();if(aiScores.l8===50&&!aiYatsunCelebrated){aiYatsunCelebrated=true;triggerYatsun();}
}
function setRollButtonState(){const finished=rolls>=3;rollButton.disabled=finished;rollButton.classList.toggle("finished",finished);rollButton.querySelector("b").textContent=finished?"VÄLJ POÄNG I PROTOKOLLET":"KASTA TÄRNINGARNA";rollButton.querySelector("small").textContent=finished?"Kastet är klart":`${3-rolls} kast kvar`;}
function roll(){if(rolls>=3||busy)return;playDiceSound();dice.forEach((die)=>{if(!die.held)die.value=1+Math.floor(Math.random()*6);});scatterDice();rolls++;renderDice(true);saveMatch();rollNumber.textContent=String(rolls);rollHint.textContent=rolls===3?"Välj en rad i protokollet.":"Spara tärningar eller kasta igen.";setRollButtonState();}
function resetTurn(){rolls=0;dice.forEach((d)=>{d.held=false;});rollNumber.textContent="1";setRollButtonState();rollHint.textContent="Kasta alla fem tärningarna.";$(".turn-heading h2").textContent="Din tur!";renderDice();}
const delay=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
const humanPause=(minimum,maximum)=>delay(minimum+Math.random()*(maximum-minimum));
const reactionPositions=[[0,0],[33.333,0],[66.667,0],[100,0],[0,100],[33.333,100],[66.667,100],[100,100]];
function reactionStyle(element,id){const [x,y]=reactionPositions[id];element.style.backgroundPosition=`${x}% ${y}%`;}
function showReaction(who,id){const bubble=$(who==="ai"?"#reaction-bubble-ai":"#reaction-bubble-player"),icon=bubble.querySelector("i");reactionStyle(icon,id);bubble.classList.remove("hidden");clearTimeout(bubble.hideTimer);bubble.hideTimer=setTimeout(()=>bubble.classList.add("hidden"),2600);}
function triggerYatsun(){
  const layer=$("#yatsun-celebration"),canvas=layer.querySelector("canvas"),context=canvas.getContext("2d"),ratio=Math.min(2,devicePixelRatio||1),colors=["#ffd84a","#f07c46","#eb4f78","#4fc49a","#59aaf4","#9b6de3","#fff4c7"],particles=[];
  const run=(layer.celebrationRun||0)+1;layer.celebrationRun=run;layer.classList.add("hidden");void layer.offsetWidth;layer.classList.remove("hidden");canvas.width=innerWidth*ratio;canvas.height=innerHeight*ratio;context.setTransform(ratio,0,0,ratio,0,0);
  for(let i=0;i<230;i++){const side=i%3,x=side===0?innerWidth*.5:side===1?-20:innerWidth+20,angle=side===0?Math.PI*(1.1+Math.random()*.8):side===1?(-.65+Math.random()*.55):Math.PI+(.1+Math.random()*.55),speed=8+Math.random()*15;particles.push({x,y:side===0?innerHeight+25:innerHeight*(.25+Math.random()*.65),vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-(side===0?8:0),gravity:.18+Math.random()*.13,drag:.985,rotation:Math.random()*Math.PI,spin:(Math.random()-.5)*.35,width:5+Math.random()*10,height:8+Math.random()*22,color:colors[i%colors.length],ribbon:i%7===0});}
  const start=performance.now();function frame(now){if(layer.celebrationRun!==run)return;context.clearRect(0,0,innerWidth,innerHeight);particles.forEach((p)=>{p.vx*=p.drag;p.vy=p.vy*p.drag+p.gravity;p.x+=p.vx;p.y+=p.vy;p.rotation+=p.spin;context.save();context.translate(p.x,p.y);context.rotate(p.rotation);context.fillStyle=p.color;if(p.ribbon){context.beginPath();context.moveTo(-p.width,0);context.bezierCurveTo(-p.width/2,-p.height,p.width/2,p.height,p.width,0);context.lineWidth=3;context.strokeStyle=p.color;context.stroke();}else context.fillRect(-p.width/2,-p.height/2,p.width,p.height);context.restore();});if(now-start<5600)requestAnimationFrame(frame);else layer.classList.add("hidden");}requestAnimationFrame(frame);
}
async function chooseScore(id){if(!rolls||busy||id in playerScores)return;const chosen=scoreCategory(id,dice.map((d)=>d.value));playerScores[id]=chosen;if(id==="l8"&&chosen===50)triggerYatsun();busy=true;updateSuggestions();saveMatch();await aiTurn();if(Object.keys(playerScores).length===categories.length){finishMatch();return;}busy=false;resetTurn();saveMatch();}
async function aiTurn(){
  const name=opponentName();
  rollButton.disabled=true;
  rollHint.textContent="Motståndaren spelar sin tur…";
  dice.forEach((d)=>d.held=false);
  await humanPause(650,1100);
  for(let round=1;round<=3;round++){
    $(".turn-heading h2").textContent=`${name} kastar…`;
    await humanPause(round===1?450:750,round===1?850:1350);
    playDiceSound();
    dice.forEach((die)=>{if(!die.held)die.value=1+Math.floor(Math.random()*6);});
    scatterDice();
    rollNumber.textContent=String(round);
    renderDice(true);
    await delay(1650);
    $(".turn-heading h2").textContent=`${name} funderar…`;
    await humanPause(850,1550);
    const target=[1,2,3,4,5,6].map((value)=>({value,count:dice.filter((d)=>d.value===value).length,weight:value/15})).sort((a,b)=>(b.count+b.weight)-(a.count+a.weight))[0].value;
    dice.forEach((die)=>die.held=die.value===target);
    renderDice();
    await humanPause(450,800);
    if(dice.every((die)=>die.held))break;
  }
  $(".turn-heading h2").textContent=`${name} väljer…`;
  await humanPause(950,1650);
  const open=categories.filter((c)=>!(c.id in aiScores)),values=dice.map((d)=>d.value),ranked=open.map((category)=>({category,score:scoreCategory(category.id,values)})).sort((a,b)=>b.score-a.score),difficulty=Math.min(1,.32+profile.unlocked*.0068),mistake=Math.random()>difficulty,pick=mistake&&ranked.length>2?ranked[Math.floor(Math.random()*Math.min(4,ranked.length))]:ranked[0];
  aiScores[pick.category.id]=pick.score;
  updateSuggestions();
  showReaction("ai",pick.score>=25?[0,1,2,6][Math.floor(Math.random()*4)]:pick.score===0?[4,5,7][Math.floor(Math.random()*3)]:Math.random()<.5?3:6);
  await humanPause(900,1300);
}
function restoreDice(saved){saved?.forEach((value,index)=>Object.assign(dice[index],value));}
function startGame(){const saved=loadMatch();playerScores=saved?.playerScores||{};aiScores=saved?.aiScores||{};rolls=saved?.rolls||0;busy=false;restoreDice(saved?.dice);buildScorecard();if(!saved)resetTurn();else{renderDice();rollNumber.textContent=String(Math.max(1,rolls));rollButton.disabled=rolls>=3;rollButton.querySelector("small").textContent=`${3-rolls} kast kvar`;rollHint.textContent=rolls?"Fortsätt där du slutade.":"Kasta alla fem tärningarna.";}const name=opponentName(saved?.opponentLevel||profile.unlocked);$$(".player-card")[0].querySelector("strong").textContent=authDisplayName;$$(".player-card")[0].querySelector("span").textContent=`Nivå ${profile.unlocked} · ${profile.soloXp} XP`;$(".score-panel h2").textContent=authDisplayName;$$('.ai-name').forEach((cell)=>cell.textContent=name.split(" ")[0]);$$(".player-card")[1].querySelector("strong").textContent=name;$$(".player-card")[1].querySelector("small").textContent=`MOTSTÅNDARE ${saved?.opponentLevel||profile.unlocked}/100`;$("#result-modal").classList.add("hidden");$(".turn-heading h2").textContent="Din tur!";showScreen("#game-screen");updateSuggestions();saveMatch();}
function finishMatch(){const player=totals(playerScores).total,ai=totals(aiScores).total,won=player>ai,draw=player===ai,reward=won?100:draw?75:0;clearMatch();profile.soloXp+=reward;if(won&&profile.unlocked<100)profile.unlocked++;saveProfile();updateProfileUi();$("#result-icon").textContent=won?"🏆":draw?"🤝":"🎲";$("#result-title").textContent=won?"Du vann!":draw?"Oavgjort!":"Nästa gång tar du det!";$("#result-copy").textContent=won?`+100 Singel-XP. Nästa motståndare är ${opponentName()}.`:draw?"+75 Singel-XP.":"Ingen XP den här gången.";$("#result-player").textContent=player;$("#result-ai").textContent=ai;$("#result-modal").classList.remove("hidden");busy=false;}

function setAuthUi(user,name=authDisplayName){authUser=user;authDisplayName=name||user?.displayName||"Gästspelare";profile=loadProfile();updateProfileUi();const avatar=$("#profile-avatar"),profileName=$("#profile-name");profileName.textContent=user?authDisplayName:"Logga in";avatar.textContent=user?(authDisplayName.match(/\p{L}/u)?.[0]||"Y").toLocaleUpperCase("sv-SE"):"GS";if(user?.photoURL){const image=document.createElement("img");image.src=user.photoURL;image.alt="";avatar.replaceWith(image);image.id="profile-avatar";}else if(avatar.tagName==="IMG"){const span=document.createElement("span");span.id="profile-avatar";span.textContent=user?(authDisplayName[0]||"Y").toLocaleUpperCase("sv-SE"):"GS";avatar.replaceWith(span);}$("#google-login").classList.toggle("hidden",Boolean(user));$("#logout-button").classList.toggle("hidden",!user);$("#login-title").textContent=user?authDisplayName:"Spara ditt spel";$("#login-copy").textContent=user?`Du är inloggad med ${user.email||"ditt Google-konto"}. Din Yatsun-identitet är kopplad till samma konto som Bubbsun.`:"Logga in med samma Google-konto som på Bubbsun. Är du redan inloggad där känns du igen automatiskt.";$("#login-copy").classList.toggle("auth-user-copy",Boolean(user));}
onAuthStateChanged(auth,async(user)=>{if(!user){setAuthUi(null,"Gästspelare");remoteMatch=null;return;}let name=user.displayName||"Yatsunspelare";try{const snapshot=await getDoc(doc(firestore,"users",user.uid));if(snapshot.exists())name=snapshot.data().displayName||name;}catch(error){console.warn("Kunde inte läsa Bubbsun-namnet",error);}setAuthUi(user,name);await loadRemoteMatch();});
$("#profile-button").addEventListener("click",()=>{$("#login-error").textContent="";$("#login-modal").classList.remove("hidden");});
$("#close-login").addEventListener("click",()=>$("#login-modal").classList.add("hidden"));
$("#login-modal").addEventListener("pointerdown",(event)=>{if(event.target===event.currentTarget)$("#login-modal").classList.add("hidden");});
$("#google-login").addEventListener("click",async()=>{const button=$("#google-login");button.disabled=true;button.lastChild.textContent=" LOGGAR IN…";$("#login-error").textContent="";try{await signInWithPopup(auth,new GoogleAuthProvider());$("#login-modal").classList.add("hidden");}catch(error){$("#login-error").textContent=error?.code==="auth/popup-closed-by-user"?"Inloggningen avbröts.":"Google-inloggningen misslyckades. Försök igen.";}finally{button.disabled=false;button.lastChild.textContent=" FORTSÄTT MED GOOGLE";}});
$("#logout-button").addEventListener("click",async()=>{await signOut(auth);$("#login-modal").classList.add("hidden");});
reactionPositions.forEach((_,id)=>{const button=document.createElement("button");button.type="button";button.className="reaction-option";button.setAttribute("aria-label",`Skicka reaktion ${id+1}`);reactionStyle(button,id);button.addEventListener("click",()=>{showReaction("player",id);$("#reaction-picker").classList.add("hidden");});$("#reaction-options").appendChild(button);});
$("#chat-button").addEventListener("click",()=>$("#reaction-picker").classList.toggle("hidden"));
$("#close-chat").addEventListener("click",()=>$("#reaction-picker").classList.add("hidden"));
$("#test-yatsun").addEventListener("click",triggerYatsun);
$("#restart-match").addEventListener("click",()=>{if(!confirm("Starta om matchen mot samma motståndare? Alla poäng i den här matchen försvinner."))return;clearMatch();playerScores={};aiScores={};rolls=0;dice.forEach((die)=>Object.assign(die,{held:false,value:1+Math.floor(Math.random()*6)}));startGame();});
$("#end-match").addEventListener("click",()=>{if(!confirm("Avsluta matchen? Den sparade matchen och alla poäng i den tas bort."))return;clearMatch();playerScores={};aiScores={};$("#result-modal").classList.add("hidden");showScreen("#mode-screen");});
$("#start-solo").addEventListener("click",startGame);$("#open-multi").addEventListener("click",()=>showScreen("#lobby-screen"));$("#refresh-games").addEventListener("click",(event)=>{event.currentTarget.textContent="↻ UPPDATERAR…";setTimeout(()=>event.currentTarget.textContent="↻ UPPDATERA",700);});$$('.back-to-modes').forEach((button)=>button.addEventListener("click",()=>{$("#result-modal").classList.add("hidden");showScreen("#mode-screen");}));$("#play-again").addEventListener("click",startGame);rollButton.addEventListener("click",roll);buildScorecard();renderDice();updateProfileUi();
