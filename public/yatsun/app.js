import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js";
import { createSocial } from "./social.mjs?v=lounge2";
import { activeSkin,skinById,completedLevels,awardVictory,createProgression,paintDice } from './progression.mjs?v=materials18';
let boardSkin='classic';
let online = null;
let onlineRevision = -1;

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
let rolls = 0, busy = false, playerScores = {}, aiScores = {}, lastScore = null, profile = loadProfile(), remoteMatch = null, suggestionTimer = 0, dicePhysicsPromise = Promise.resolve();
const dieOrientations={1:[-Math.PI/2,0,0],2:[0,-Math.PI/2,0],3:[0,0,0],4:[0,Math.PI,0],5:[0,Math.PI/2,0],6:[Math.PI/2,0,0]};
const dieModelPromise=new GLTFLoader().loadAsync("./assets/3d/D6_A.gltf");
let activeDieViews=[];

function disposeDieViews(){diceRoot.querySelectorAll('canvas').forEach(canvas=>{canvas.ownedMaterials?.forEach(m=>m.dispose());canvas.ownedMaterials?.texture?.dispose();});activeDieViews.forEach((view)=>{view.stopped=true;view.renderer.dispose();});activeDieViews=[];}
async function mountDieModel(canvas,fallback,die,rolling,index){
  try{
    const value=die.value,skin=skinById(die.skin||'classic');
    const source=await dieModelPromise;if(!canvas.isConnected)return;
    const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-.96,.96,.96,-.96,.1,10),model=source.scene.clone(true),renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance"});
    renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.setSize(144,144,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
    const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),settledScale=1.06/Math.max(size.x,size.y,size.z);model.position.sub(center);model.scale.setScalar(settledScale);scene.add(model);
    canvas.ownedMaterials=paintDice(model,skin,THREE);
    scene.add(new THREE.HemisphereLight(0xfff9e8,0x365844,2.6));const key=new THREE.DirectionalLight(0xffffff,4.2);key.position.set(-3,4,5);scene.add(key);const rim=new THREE.DirectionalLight(0xffd97a,1.8);rim.position.set(4,-2,3);scene.add(rim);camera.position.set(.38,.45,3);camera.lookAt(0,0,0);
    const target=dieOrientations[value],physicsToView=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,0,0)),view={renderer,model,stopped:false,render:()=>renderer.render(scene,camera),finishPhysics(){this.render();},sync(quaternion){model.quaternion.set(quaternion.x,quaternion.y,quaternion.z,quaternion.w).premultiply(physicsToView);this.render();}};activeDieViews.push(view);canvas.dieView=view;canvas.ownedMaterials.ready?.then(()=>{if(!canvas.isConnected||view.stopped)return;view.render();canvas.classList.add("ready");fallback.classList.add("model-ready");});
    const render=()=>renderer.render(scene,camera);
    if(!rolling){if(die.q){model.quaternion.set(die.q[0],die.q[1],die.q[2],die.q[3]).premultiply(physicsToView);}else model.rotation.set(...target);render();return;}
    render();
  }catch(error){console.warn("3D-tärningen kunde inte laddas",error);}
}

function profileKey() { return `yatsun-profile-${authUser?.uid||"guest"}`; }
function loadProfile() { try { return { soloXp:0, unlocked:1, winStreak:0, ...JSON.parse(localStorage.getItem(profileKey())||"{}") }; } catch { return { soloXp:0, unlocked:1, winStreak:0 }; } }
function saveProfile() { localStorage.setItem(profileKey(), JSON.stringify(profile));void syncCosmetics(true).catch(console.warn); }
let cosmeticQueue=Promise.resolve();
function syncCosmetics(selection=false){
  const account=authUser;if(!account)return Promise.resolve();const data={action:'social_cosmetics',completed:completedLevels(profile)};if(selection)data.active=activeSkin(profile).id;
  const request=cosmeticQueue.catch(()=>{}).then(async()=>{const token=await account.getIdToken(),response=await fetch('./api/',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(data)}),result=await response.json();if(!response.ok)throw new Error(result.error||'Kunde inte spara tärningsvalet.');if(authUser?.uid!==account.uid)return;profile.completed=Math.max(completedLevels(profile),result.completed);profile.unlocked=Math.min(100,profile.completed+1);profile.activeSkin=result.active;profile.admin=Boolean(result.admin);localStorage.setItem(profileKey(),JSON.stringify(profile));updateProfileUi();});cosmeticQueue=request;return request;
}
function xpForLevel(level){return 100+(level-1)*25;}
function playerProgress(totalXp=profile.soloXp){let level=1,xp=Math.max(0,totalXp||0),needed=xpForLevel(level);while(xp>=needed){xp-=needed;level++;needed=xpForLevel(level);}return{level,xp,needed};}
function matchKey(){return `yatsun-active-solo-${authUser?.uid||"guest"}`;}
function loadMatch(){try{return JSON.parse(localStorage.getItem(matchKey())||"null")||remoteMatch;}catch{return remoteMatch;}}
async function matchApi(action,state){if(!authUser)return null;const token=await authUser.getIdToken(),response=await fetch("./api/",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({action,state})});if(!response.ok)throw new Error("Matchservern svarade inte.");return response.json();}
async function loadRemoteMatch(){if(!authUser){remoteMatch=null;return;}try{const data=await matchApi("load_match");remoteMatch=data?.match||null;if(remoteMatch&&!localStorage.getItem(matchKey()))localStorage.setItem(matchKey(),JSON.stringify(remoteMatch));updateContinueUi();}catch(error){console.warn("Kunde inte hämta sparad Yatsun-match",error);}}
function saveMatch(){if(online?.active||matchComplete())return;const state={rolls,playerScores,aiScores,lastScore,dice:dice.map(({value,held,x,y,rot,q})=>({value,held,x,y,rot,q})),opponentLevel:profile.unlocked,updatedAt:Date.now()};remoteMatch=state;localStorage.setItem(matchKey(),JSON.stringify(state));updateContinueUi();void matchApi("save_match",state).catch((error)=>console.warn("Matchen sparades lokalt men inte på servern",error));}
function clearMatch(){remoteMatch=null;localStorage.removeItem(matchKey());updateContinueUi();void matchApi("delete_match").catch((error)=>console.warn("Kunde inte ta bort servermatchen",error));}
function updateContinueUi(){const saved=loadMatch(),button=$("#start-solo");if(!button)return;button.textContent=saved?`FORTSÄTT MOT ${opponentName(saved.opponentLevel||profile.unlocked).toLocaleUpperCase("sv-SE")} →`:`SPELA MOT ${opponentName().toLocaleUpperCase("sv-SE")} →`;}
function opponentName(level=profile.unlocked) { return `${firstNames[(level-1)%firstNames.length]} ${lastNames[(Math.floor((level-1)/firstNames.length)+level-1)%lastNames.length]}`; }
function updateProfileUi() { const {level,xp,needed}=playerProgress(),card=$(".solo-card"); card.querySelector(".xp-preview b").textContent=`Spelarnivå ${level}`; card.querySelector(".xp-preview small").textContent=`${xp} / ${needed} XP`; card.querySelector(".xp-preview em").style.width=`${xp/needed*100}%`; updateContinueUi(); }
function showScreen(id) { ["#mode-screen","#lobby-screen","#game-screen","#campaign-screen","#collection-screen","#mp-home-screen","#mp-join-screen"].forEach((selector)=>$(selector)?.classList.toggle("hidden",selector!==id));$('.welcome-strip')?.classList.toggle('hidden',['#lobby-screen','#mp-home-screen','#mp-join-screen'].includes(id)); document.body.classList.toggle("playing",id==="#game-screen");if(id==='#game-screen'&&!online?.active)updateMatchPlayers(false); window.scrollTo({top:0,behavior:"smooth"}); }

function renderDice(animate=false) {
  disposeDieViews();
  diceRoot.innerHTML="";
  const trayBox=diceRoot.getBoundingClientRect(),trayWidth=trayBox.width||800,trayHeight=trayBox.height||500,rollingButtons=[];
  dice.forEach((die,index)=>{
    die.skin=online?.active?boardSkin:activeSkin(profile).id;
    const button=document.createElement("button"),shadow=document.createElement("span"),travel=document.createElement("span"),cube=document.createElement("span"),canvas=document.createElement("canvas");
    button.type="button";
    button.dataset.dieId=String(die.id);
    const appearance=skinById(die.skin);button.style.setProperty('--skin-body',appearance.body);button.style.setProperty('--skin-pips',appearance.pips);
    button.className=`die die-3d${die.held?" held":""}${animate&&!die.held?" rolling":""}`;
    shadow.className="die-shadow";travel.className="die-travel";cube.className="die-cube";canvas.className="die-model";
    const restAngle=die.rot||0,visualRadius=window.innerWidth<680?34:54,x=Math.min(trayWidth-visualRadius,Math.max(visualRadius,trayWidth/2+die.x)),y=Math.min(trayHeight-visualRadius,Math.max(visualRadius,trayHeight/2+die.y));
    die.x=Math.round(x-trayWidth/2);die.y=Math.round(y-trayHeight/2);
    button.style.left=`${x}px`;button.style.top=`${y}px`;button.style.setProperty("--rest-angle",`${restAngle}deg`);button.style.setProperty("--landing","rotateX(0deg) rotateY(0deg)");
    button.setAttribute("aria-label",`Tärning ${index+1}: ${die.value}${die.held?", sparad":""}`);
    for(let faceIndex=1;faceIndex<=6;faceIndex++){const face=document.createElement("span"),faceValue=faceIndex===1?die.value:((die.value+faceIndex-2)%6)+1;face.className=`cube-face face-${faceIndex}`;pipPositions[faceValue].forEach(([x,y])=>{const pip=document.createElement("i");pip.className="pip";pip.style.left=`calc(${x}% - 5px)`;pip.style.top=`calc(${y}% - 5px)`;face.appendChild(pip);});cube.appendChild(face);}
    travel.append(cube,canvas);button.append(shadow,travel);
    if(animate&&!die.held)rollingButtons.push({button,die,index});
    button.addEventListener("click",()=>{if(!rolls||busy||diceRoot.querySelector(".rolling"))return;die.held=!die.held;syncHeldDiceUi();updateSuggestions();if(online?.active)void online.hold(dice.map(d=>d.held));else saveMatch();rollHint.textContent=die.held?"Tärningen är sparad.":"Tärningen kastas igen nästa gång.";});
    diceRoot.appendChild(button);mountDieModel(canvas,cube,die,animate&&!die.held,index);
  });
  clearTimeout(suggestionTimer);
  if(animate){hideSuggestions();rollButton.disabled=true;dicePhysicsPromise=runDicePhysics(rollingButtons,trayWidth,trayHeight,online?.active?dice.map(d=>d.value):null);}else updateSuggestions();
}
function syncHeldDiceUi(){dice.forEach((die,index)=>{const button=diceRoot.querySelector(`button[data-die-id="${die.id}"]`);if(!button)return;button.classList.toggle("held",die.held);button.setAttribute("aria-label",`Tärning ${index+1}: ${die.value}${die.held?", sparad":""}`);});}
function runDicePhysics(entries,width,height,authoritativeValues=null){
  return new Promise((resolve)=>{
  const compact=window.innerWidth<680,pixelsPerUnit=compact?72:92,dieSize=compact?.72:.88,half=dieSize/2,boundary=compact?8:12,boardHalfWidth=(width-boundary*2)/pixelsPerUnit/2,boardHalfDepth=(height-boundary*2)/pixelsPerUnit/2,halfWidth=boardHalfWidth-half,halfDepth=boardHalfDepth-half,world=new CANNON.World({gravity:new CANNON.Vec3(0,-24,0),allowSleep:true}),diceMaterial=new CANNON.Material("dice"),trayMaterial=new CANNON.Material("tray");
  world.broadphase=new CANNON.SAPBroadphase(world);world.solver.iterations=24;world.defaultContactMaterial.friction=.16;world.defaultContactMaterial.restitution=.32;world.addContactMaterial(new CANNON.ContactMaterial(diceMaterial,trayMaterial,{friction:.28,restitution:.34,contactEquationStiffness:1e7,contactEquationRelaxation:4}));world.addContactMaterial(new CANNON.ContactMaterial(diceMaterial,diceMaterial,{friction:.07,restitution:.48,contactEquationStiffness:5e7,contactEquationRelaxation:3}));
  const floor=new CANNON.Body({mass:0,material:trayMaterial,shape:new CANNON.Plane()});floor.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(floor);
  [[-boardHalfWidth-.16,1.2,0,.16,1.6,boardHalfDepth+1],[boardHalfWidth+.16,1.2,0,.16,1.6,boardHalfDepth+1],[0,1.2,-boardHalfDepth-.16,boardHalfWidth+1,1.6,.16],[0,1.2,boardHalfDepth+.16,boardHalfWidth+1,1.6,.16]].forEach(([x,y,z,hx,hy,hz])=>world.addBody(new CANNON.Body({mass:0,material:trayMaterial,position:new CANNON.Vec3(x,y,z),shape:new CANNON.Box(new CANNON.Vec3(hx,hy,hz))})));
  const trayRect=diceRoot.getBoundingClientRect(),buttonRect=rollButton.getBoundingClientRect(),buttonCenterX=buttonRect.left+buttonRect.width/2-trayRect.left,buttonCenterZ=buttonRect.top+buttonRect.height/2-trayRect.top;
  if(buttonRect.width&&buttonRect.height&&buttonCenterX>-buttonRect.width/2&&buttonCenterX<width+buttonRect.width/2&&buttonCenterZ>-buttonRect.height/2&&buttonCenterZ<height+buttonRect.height/2){const obstacle=new CANNON.Body({mass:0,material:trayMaterial,position:new CANNON.Vec3((buttonCenterX-width/2)/pixelsPerUnit,2,(buttonCenterZ-height/2)/pixelsPerUnit),shape:new CANNON.Box(new CANNON.Vec3(buttonRect.width/2/pixelsPerUnit+half*.35,2,buttonRect.height/2/pixelsPerUnit+half*.35))});world.addBody(obstacle);}
  const activeIds=new Set(entries.map(({die})=>die.id)),bodies=[];
  dice.forEach((die,index)=>{
    const active=activeIds.has(die.id),handOffsets=[[0,-1.05],[-.92,-.53],[0,0],[-.92,.53],[0,1.05]],startX=active?halfWidth+handOffsets[index][0]:die.x/pixelsPerUnit,startZ=active?handOffsets[index][1]:die.y/pixelsPerUnit,body=new CANNON.Body({mass:active?1.15:0,material:diceMaterial,position:new CANNON.Vec3(startX,active?1.05+index*.08:half,startZ),shape:new CANNON.Box(new CANNON.Vec3(half,half,half)),linearDamping:.09,angularDamping:.18,allowSleep:true,sleepSpeedLimit:.075,sleepTimeLimit:.55});
    body.die=die;body.button=diceRoot.querySelector(`[aria-label^="Tärning ${index+1}:"]`);body.canvas=body.button?.querySelector("canvas");bodies.push(body);world.addBody(body);
    if(active){const strength=[3.9,5.5,4.5,6.2,5][index]*(.9+Math.random()*.2);body.velocity.set(-strength,2.1+Math.random()*1.1,(index-2)*.72+(Math.random()-.5)*.65);body.angularVelocity.set((Math.random()-.5)*8,(Math.random()-.5)*9,(Math.random()-.5)*8);body.quaternion.setFromEuler(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);}
  });
  const faceNormals=[[3,0,0,1],[4,0,0,-1],[2,1,0,0],[5,-1,0,0],[6,0,1,0],[1,0,-1,0]],up=new CANNON.Vec3(0,1,0),alignment=(body)=>Math.max(...faceNormals.map(([,x,y,z])=>body.quaternion.vmult(new CANNON.Vec3(x,y,z)).y)),start=performance.now(),fixedStep=1/60,normalDuration=3300,hardLimit=4800;
  function frame(now){
    world.step(fixedStep);
    if(now-start>650)bodies.forEach((body)=>{
      const elapsed=now-start;if(body.mass===0||body.settleNudgeUsed||elapsed>1400||(elapsed<850&&(body.velocity.length()>.3||body.angularVelocity.length()>.42)))return;
      if(body.position.y>half+.07&&body.position.y<half*2.5&&Math.abs(body.velocity.y)<.7){const neighbour=bodies.filter((other)=>other!==body).sort((a,b)=>Math.hypot(body.position.x-a.position.x,body.position.z-a.position.z)-Math.hypot(body.position.x-b.position.x,body.position.z-b.position.z))[0],dx=body.position.x-(neighbour?.position.x||0),dz=body.position.z-(neighbour?.position.z||0),length=Math.hypot(dx,dz)||1;body.settleNudgeUsed=true;body.wakeUp();body.velocity.set(dx/length*1.75,.25,dz/length*1.75);body.angularVelocity.set(dz/length*2.4,.04,-dx/length*2.4);return;}
      const top=faceNormals.map(([,x,y,z])=>body.quaternion.vmult(new CANNON.Vec3(x,y,z))).sort((a,b)=>b.y-a.y)[0];
      if(top.y>=.965)return;
      const axis=top.cross(up);if(axis.lengthSquared()<.001)return;axis.normalize();body.settleNudgeUsed=true;body.wakeUp();body.angularVelocity.set(axis.x*2.2,.02,axis.z*2.2);body.velocity.y=Math.max(body.velocity.y,.1);
    });
    bodies.forEach((body)=>{if(body.mass===0||!body.button)return;const left=width/2+body.position.x*pixelsPerUnit,top=height/2+body.position.z*pixelsPerUnit-(body.position.y-half)*pixelsPerUnit*.7;body.button.style.left=`${left}px`;body.button.style.top=`${top}px`;body.button.style.transform="translate(-50%,-50%)";body.canvas?.dieView?.sync(body.quaternion,body.velocity.length()+body.angularVelocity.length()*.2);});
    const elapsed=now-start,moving=bodies.some((body)=>body.mass>0&&(body.velocity.length()>.13||body.angularVelocity.length()>.16)),invalid=bodies.some((body)=>body.mass>0&&(body.position.y>half+.075||alignment(body)<.985));
    if(elapsed<1200||(elapsed<normalDuration&&moving)||(elapsed<hardLimit&&invalid)){requestAnimationFrame(frame);return;}
    const landings=bodies.filter(b=>b.mass>0).map(body=>{
      const topFace=faceNormals.map(([value,x,y,z])=>({value,normal:body.quaternion.vmult(new CANNON.Vec3(x,y,z))})).sort((a,b)=>b.normal.y-a.normal.y)[0];
      const resultValue=authoritativeValues?.[body.die.id]??topFace.value;
      const desiredFace=faceNormals.find(([value])=>value===resultValue);
      const resultNormal=authoritativeValues?body.quaternion.vmult(new CANNON.Vec3(...desiredFace.slice(1))):topFace.normal;
      const correction=new CANNON.Quaternion();correction.setFromVectors(resultNormal,up);
      const target=authoritativeValues?correction.mult(body.quaternion):body.quaternion.clone(),point={id:body.die.id,x:body.position.x*pixelsPerUnit,y:body.position.z*pixelsPerUnit};
      return {body,value:resultValue,from:body.position.clone(),rotation:body.quaternion.clone(),target,point};
    });
    const settleStart=now;
    function settle(time){
      const progress=Math.min(1,(time-settleStart)/120),ease=progress*progress*(3-2*progress);
      landings.forEach(({body,from,rotation,target,point})=>{
        body.position.set(from.x+(point.x/pixelsPerUnit-from.x)*ease,from.y+(half-from.y)*ease,from.z+(point.y/pixelsPerUnit-from.z)*ease);
        rotation.slerp(target,ease,body.quaternion);
        if(body.button){body.button.style.left=`${width/2+body.position.x*pixelsPerUnit}px`;body.button.style.top=`${height/2+body.position.z*pixelsPerUnit-(body.position.y-half)*pixelsPerUnit*.7}px`;body.canvas?.dieView?.sync(body.quaternion);}
      });
      if(progress<1){requestAnimationFrame(settle);return;}
      landings.forEach(({body,value,point})=>{body.type=CANNON.Body.STATIC;body.velocity.setZero();body.angularVelocity.setZero();body.sleep();body.die.value=value;body.die.x=point.x;body.die.y=point.y;body.die.rot=0;body.die.q=[body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w];if(body.button){body.canvas?.dieView?.finishPhysics();body.button.setAttribute("aria-label",`Tärning ${body.die.id+1}: ${value}`);body.button.style.transform="";body.button.classList.remove("rolling");}});
      world.bodies.slice().forEach(body=>world.removeBody(body));saveMatch();updateSuggestions();resolve();
    }
    requestAnimationFrame(settle);
  }
  requestAnimationFrame(frame);
  });
}
function scatterDice(){
  const compact=window.innerWidth<680,candidates=compact?[[-112,-48],[-56,-48],[0,-48],[56,-48],[112,-48],[-112,32],[-56,32],[0,32],[56,32],[112,32]]:[[-210,-92],[-105,-92],[0,-92],[105,-92],[210,-92],[-210,44],[-105,44],[0,44],[105,44],[210,44]],minimum=compact?66:112,occupied=dice.filter((die)=>die.held).map((die)=>[die.x,die.y]);
  dice.filter((die)=>!die.held).forEach((die)=>{const choices=candidates.filter(([x,y])=>occupied.every(([ox,oy])=>Math.hypot(x-ox,y-oy)>=minimum)),pool=choices.length?choices:candidates,best=pool.map((point)=>({point,distance:occupied.length?Math.min(...occupied.map(([ox,oy])=>Math.hypot(point[0]-ox,point[1]-oy))):Math.random()*500})).sort((a,b)=>b.distance-a.distance)[0].point;die.x=best[0]+Math.round(Math.random()*12-6);die.y=best[1]+Math.round(Math.random()*12-6);die.rot=Math.round(Math.random()*24-12);occupied.push([die.x,die.y]);});
}
function playDiceSound(){diceSound.currentTime=0;void diceSound.play().catch(()=>{});}
function counts(values){const result=Array(7).fill(0);values.forEach((value)=>result[value]++);return result;}
function scoreCategory(id,values){const c=counts(values),sum=values.reduce((a,b)=>a+b,0),groups=c.slice(1).map((amount,value)=>({amount,value:value+1})).filter((g)=>g.amount);if(id[0]==="u"){const value=Number(id[1]);return c[value]*value;}if(id==="l0"){const pairs=groups.filter((g)=>g.amount>=2).map((g)=>g.value);return pairs.length?Math.max(...pairs)*2:0;}if(id==="l1"){const pairs=groups.filter((g)=>g.amount>=2).map((g)=>g.value).sort((a,b)=>b-a);return pairs.length>=2?(pairs[0]+pairs[1])*2:0;}if(id==="l2"){const group=groups.filter((g)=>g.amount>=3).sort((a,b)=>b.value-a.value)[0];return group?group.value*3:0;}if(id==="l3"){const group=groups.filter((g)=>g.amount>=4).sort((a,b)=>b.value-a.value)[0];return group?group.value*4:0;}if(id==="l4")return[1,2,3,4,5].every((value)=>c[value]===1)?15:0;if(id==="l5")return[2,3,4,5,6].every((value)=>c[value]===1)?20:0;if(id==="l6"){const pair=groups.find((g)=>g.amount===2),three=groups.find((g)=>g.amount===3);return pair&&three?pair.value*2+three.value*3:0;}if(id==="l7")return sum;if(id==="l8")return groups.some((g)=>g.amount===5)?50:0;return 0;}
function aiCategoryValue(category,score,values){
  const id=category.id,c=counts(values),sum=values.reduce((total,value)=>total+value,0);
  if(score===0){const scratchCost={l8:34,l5:24,l4:22,l6:20,l3:18,l1:15,l2:12,l0:8,l7:26};return-(scratchCost[id]??Number(id[1])*3);}
  if(id==="l8")return 140;if(id==="l3")return 92+score;if(id==="l6")return 82+score;if(id==="l5"||id==="l4")return 76+score;if(id==="l1")return 48+score;if(id==="l2")return 38+score;if(id==="l0")return 25+score;if(id==="l7")return sum-8;
  const face=Number(id[1]),amount=c[face],target=face*3,bonusPressure=totals(aiScores).upperTotal<63?1:0;
  return score-(target-score)*1.15+(amount>=3?24:0)+(amount>=4?16:0)+bonusPressure*face*.7;
}
function totals(scores){const upperTotal=upper.reduce((sum,_,index)=>sum+(scores[`u${index+1}`]??0),0),bonus=upperTotal>=63?50:0,lowerTotal=lower.reduce((sum,_,index)=>sum+(scores[`l${index}`]??0),0);return{upperTotal,bonus,total:upperTotal+bonus+lowerTotal};}
function scoreCount(scores){return categories.reduce((count,{id})=>count+(id in scores?1:0),0);}
function scorecardComplete(scores){return scoreCount(scores)===categories.length;}
function matchComplete(){return scorecardComplete(playerScores)&&scorecardComplete(aiScores);}

function buildScorecard(){$("#upper-score").innerHTML="";$("#lower-score").innerHTML="";const symbols=["⚀","⚁","⚂","⚃","⚄","⚅","◉","❖","◆","▦","⌁","⌁","⌂","?","★"];categories.forEach((category,index)=>{const tr=document.createElement("tr"),label=["l4","l5"].includes(category.id)?category.label.replace(" ","<br>"):category.label;tr.dataset.category=category.id;tr.innerHTML=`<th><i>${symbols[index]}</i><span>${label}</span></th><td><button class="score-choice" data-id="${category.id}" disabled>—</button></td><td class="ai-score" data-ai-id="${category.id}">—</td>`;(category.upper?$("#upper-score"):$("#lower-score")).appendChild(tr);const button=tr.querySelector("button");button.addEventListener("click",()=>chooseScore(category.id));tr.addEventListener("click",(event)=>{if(event.target!==button&&!button.disabled)button.click();});});}
function displayScore(category,score){if(score===null||score===undefined)return"—";if(!category.upper)return String(score);const base=3*Number(category.id[1]),delta=score-base;return delta===0?"✓":`${delta>0?"+":""}${delta}`;}
function hideSuggestions(){categories.forEach((category)=>{if(category.id in playerScores)return;const button=$(`[data-id="${category.id}"]`),row=button?.closest("tr");if(!button)return;button.textContent="—";button.disabled=true;button.removeAttribute("title");row.classList.remove("preview","best-preview","zero-preview");});}
function updateSuggestions(){
  const values=dice.map((d)=>d.value),previews=[];
  categories.forEach((category)=>{
    const button=$(`[data-id="${category.id}"]`),aiCell=$(`[data-ai-id="${category.id}"]`),row=button?.closest("tr");
    if(!button)return;
    row.classList.remove("scored","preview","best-preview","zero-preview");button.classList.remove("scratched","latest-score");button.removeAttribute("title");
    if(category.id in playerScores){const actual=playerScores[category.id];button.textContent=actual===0?"":displayScore(category,actual);button.classList.toggle("scratched",actual===0);button.classList.toggle("latest-score",lastScore?.who==="player"&&lastScore.id===category.id);button.title=actual===0?`${category.label} struken`:category.upper?`${actual} poäng · ${button.textContent} mot riktvärdet`: `${actual} poäng`;button.disabled=true;row.classList.add("scored");}
    else{const preview=rolls&&!busy?scoreCategory(category.id,values):null;button.textContent=preview===null?"—":String(preview);button.disabled=!rolls||busy;if(preview!==null){button.title=`Välj ${category.label}: ${preview} poäng`;row.classList.add("preview");if(preview===0)row.classList.add("zero-preview");previews.push({row,score:preview});}}
    const aiFilled=category.id in aiScores,aiActual=aiScores[category.id],aiText=displayScore(category,aiActual),aiClasses=[aiActual===0?"scratched":"",lastScore?.who==="ai"&&lastScore.id===category.id?"latest-score":""].filter(Boolean).join(" ");aiCell.innerHTML=aiFilled?`<span class="${aiClasses}">${aiActual===0?"":aiText}</span>`:"—";aiCell.classList.toggle("filled",aiFilled);
  });
  const total=totals(playerScores),aiTotal=totals(aiScores);$("#upper-total").textContent=total.upperTotal;$("#ai-upper-total").textContent=aiTotal.upperTotal;$("#bonus").textContent=total.bonus||"—";$("#ai-bonus").textContent=aiTotal.bonus||"—";$("#player-total-small").textContent=total.total;$("#ai-total").textContent=aiTotal.total;setRollButtonState();
}
function setRollButtonState(){const finished=rolls>=3;rollButton.disabled=finished||busy;rollButton.classList.toggle("finished",finished);rollButton.querySelector("b").textContent=finished?"VÄLJ POÄNG I PROTOKOLLET":"KASTA TÄRNINGARNA";rollButton.querySelector("small").textContent=finished?"Kastet är klart":`${3-rolls} kast kvar`;}
function roll(){if(rolls>=3||busy)return;if(online?.active){void online.roll(dice.map(d=>d.held));return;}playDiceSound();dice.forEach((die)=>{if(!die.held)die.value=1+Math.floor(Math.random()*6);});rolls++;setRollButtonState();renderDice(true);saveMatch();rollNumber.textContent=String(rolls);rollHint.textContent=rolls===3?"Välj en rad i protokollet.":"Spara tärningar eller kasta igen.";}
function resetTurn(){rolls=0;dice.forEach((d)=>{d.held=false;});rollButton.classList.remove("hidden");rollNumber.textContent="1";setRollButtonState();rollHint.textContent="Kasta alla fem tärningarna.";$(".turn-heading h2").textContent="Din tur!";renderDice();}
const delay=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
const humanPause=(minimum,maximum)=>delay(minimum+Math.random()*(maximum-minimum));
const reactionPositions=[[0,0],[33.333,0],[66.667,0],[100,0],[0,100],[33.333,100],[66.667,100],[100,100]];
function reactionStyle(element,id){const [x,y]=reactionPositions[id];element.style.backgroundPosition=`${x}% ${y}%`;}
function showReaction(who,id){const bubble=$(who==="ai"?"#reaction-bubble-ai":"#reaction-bubble-player"),icon=bubble.querySelector("i");reactionStyle(icon,id);bubble.classList.remove("hidden");clearTimeout(bubble.hideTimer);bubble.hideTimer=setTimeout(()=>bubble.classList.add("hidden"),2600);}
function triggerYatsun(rewardName){
  const layer=$("#yatsun-celebration"),canvas=layer.querySelector("canvas"),context=canvas.getContext("2d"),ratio=Math.min(2,devicePixelRatio||1),colors=["#ffd84a","#f07c46","#eb4f78","#4fc49a","#59aaf4","#9b6de3","#fff4c7"],particles=[];
  layer.querySelector('small').textContent=typeof rewardName==='string'?'MILSTOLPE AVKLARAD!':'FEM LIKA!';layer.querySelector('strong').textContent=typeof rewardName==='string'?rewardName:'YATSUN!';
  const run=(layer.celebrationRun||0)+1;layer.celebrationRun=run;layer.classList.add("hidden");void layer.offsetWidth;layer.classList.remove("hidden");canvas.width=innerWidth*ratio;canvas.height=innerHeight*ratio;context.setTransform(ratio,0,0,ratio,0,0);
  for(let i=0;i<230;i++){const side=i%3,x=side===0?innerWidth*.5:side===1?-20:innerWidth+20,angle=side===0?Math.PI*(1.1+Math.random()*.8):side===1?(-.65+Math.random()*.55):Math.PI+(.1+Math.random()*.55),speed=8+Math.random()*15;particles.push({x,y:side===0?innerHeight+25:innerHeight*(.25+Math.random()*.65),vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-(side===0?8:0),gravity:.18+Math.random()*.13,drag:.985,rotation:Math.random()*Math.PI,spin:(Math.random()-.5)*.35,width:5+Math.random()*10,height:8+Math.random()*22,color:colors[i%colors.length],ribbon:i%7===0});}
  const start=performance.now();function frame(now){if(layer.celebrationRun!==run)return;context.clearRect(0,0,innerWidth,innerHeight);particles.forEach((p)=>{p.vx*=p.drag;p.vy=p.vy*p.drag+p.gravity;p.x+=p.vx;p.y+=p.vy;p.rotation+=p.spin;context.save();context.translate(p.x,p.y);context.rotate(p.rotation);context.fillStyle=p.color;if(p.ribbon){context.beginPath();context.moveTo(-p.width,0);context.bezierCurveTo(-p.width/2,-p.height,p.width/2,p.height,p.width,0);context.lineWidth=3;context.strokeStyle=p.color;context.stroke();}else context.fillRect(-p.width/2,-p.height/2,p.width,p.height);context.restore();});if(now-start<5600)requestAnimationFrame(frame);else layer.classList.add("hidden");}requestAnimationFrame(frame);
}
async function chooseScore(id){if(!rolls||busy||id in playerScores)return;if(online?.active){await online.score(id);return;}const chosen=scoreCategory(id,dice.map((d)=>d.value));playerScores[id]=chosen;lastScore={who:"player",id};if(id==="l8"&&chosen===50)triggerYatsun();busy=true;updateSuggestions();saveMatch();await catchUpAiScores();if(matchComplete()){finishMatch();return;}busy=false;resetTurn();saveMatch();}
async function aiTurn(){
  if(scorecardComplete(aiScores))return;
  const name=opponentName();
  rollButton.classList.add("hidden");
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
    await dicePhysicsPromise;
    $(".turn-heading h2").textContent=`${name} funderar…`;
    await humanPause(850,1550);
    const target=[1,2,3,4,5,6].map((value)=>({value,count:dice.filter((d)=>d.value===value).length,weight:value/15})).sort((a,b)=>(b.count+b.weight)-(a.count+a.weight))[0].value;
    dice.forEach((die)=>die.held=die.value===target);
    syncHeldDiceUi();
    await humanPause(450,800);
    if(dice.every((die)=>die.held))break;
  }
  $(".turn-heading h2").textContent=`${name} väljer…`;
  await humanPause(950,1650);
  const open=categories.filter((c)=>!(c.id in aiScores)),values=dice.map((d)=>d.value),valueCounts=counts(values),difficulty=Math.min(1,.45+profile.unlocked*.0055),ranked=open.map((category)=>{const score=scoreCategory(category.id,values);return{category,score,value:aiCategoryValue(category,score,values)+(Math.random()-.5)*(1-difficulty)*7};}).sort((a,b)=>b.value-a.value),strongMade=ranked.filter(({category,score})=>score>0&&["l8","l3","l6","l5","l4"].includes(category.id)).sort((a,b)=>b.value-a.value)[0],madeUpper=ranked.filter(({category})=>category.upper&&valueCounts[Number(category.id[1])]>=3).sort((a,b)=>b.score-a.score)[0],pick=strongMade||madeUpper||ranked[0];
  aiScores[pick.category.id]=pick.score;
  lastScore={who:"ai",id:pick.category.id};
  // Celebrate the scoring event, never a restored or re-rendered scorecard.
  if(pick.category.id==="l8"&&pick.score===50)triggerYatsun();
  updateSuggestions();
  showReaction("ai",pick.score>=25?[0,1,2,6][Math.floor(Math.random()*4)]:pick.score===0?[4,5,7][Math.floor(Math.random()*3)]:Math.random()<.5?3:6);
  await humanPause(900,1300);
}
async function catchUpAiScores(){while(scoreCount(aiScores)<scoreCount(playerScores))await aiTurn();}
function restoreDice(saved){saved?.forEach((value,index)=>Object.assign(dice[index],value));}
function startGame(){const saved=loadMatch();playerScores=saved?.playerScores||{};aiScores=saved?.aiScores||{};lastScore=saved?.lastScore||null;rolls=saved?.rolls||0;busy=false;restoreDice(saved?.dice);buildScorecard();if(!saved)resetTurn();else{renderDice();rollNumber.textContent=String(Math.max(1,rolls));rollButton.disabled=rolls>=3;rollButton.querySelector("small").textContent=`${3-rolls} kast kvar`;rollHint.textContent=rolls?"Fortsätt där du slutade.":"Kasta alla fem tärningarna.";}const name=opponentName(saved?.opponentLevel||profile.unlocked),progress=playerProgress();$$(".player-card")[0].querySelector("strong").textContent=authDisplayName;$$(".player-card")[0].querySelector("span").textContent=`Spelarnivå ${progress.level} · ${progress.xp}/${progress.needed} XP`;$(".score-panel h2").textContent=authDisplayName;$$('.ai-name').forEach((cell)=>cell.textContent=name.split(" ")[0]);$$(".player-card")[1].querySelector("strong").textContent=name;$$(".player-card")[1].querySelector("small").textContent=`MOTSTÅNDARE ${saved?.opponentLevel||profile.unlocked}/100`;$("#result-modal").classList.add("hidden");$(".turn-heading h2").textContent="Din tur!";showScreen("#game-screen");updateSuggestions();saveMatch();if(saved&&scoreCount(aiScores)<scoreCount(playerScores)){busy=true;void catchUpAiScores().then(()=>{if(matchComplete())finishMatch();else{busy=false;resetTurn();saveMatch();}}).catch((error)=>{busy=false;console.warn("Kunde inte återuppta motståndarens tur",error);});}}
function finishMatch(){
  const opponentLevel=loadMatch()?.opponentLevel||profile.unlocked,playerTotal=totals(playerScores),player=playerTotal.total,ai=totals(aiScores).total,won=player>ai,draw=player===ai,parts=[{label:won?'Vinst':draw?'Oavgjort':'Genomförd match',xp:won?60:draw?35:20}];
  profile.winStreak=won?(profile.winStreak||0)+1:0;
  if(playerScores.l8===50)parts.push({label:'Yatzy',xp:25});if(playerTotal.bonus)parts.push({label:'Övre bonus',xp:15});if(categories.every(({id})=>(playerScores[id]??0)>0))parts.push({label:'Inga strykningar',xp:20});if(profile.winStreak>=3)parts.push({label:`${profile.winStreak} vinster i rad`,xp:15});
  const oldLevel=playerProgress().level;let unlockedSet=null;
  if(won){const reward=awardVictory(profile,opponentLevel);unlockedSet=reward.newSkin;delete reward.newSkin;profile=reward;}
  const reward=parts.reduce((sum,p)=>sum+p.xp,0);clearMatch();profile.soloXp+=reward;saveProfile();updateProfileUi();
  $('#result-icon').textContent=unlockedSet?'🎁':won?'🏆':draw?'🤝':'🎲';$('#result-title').textContent=unlockedSet?`Nytt tärningsset: ${unlockedSet}!`:won?'Du vann!':draw?'Oavgjort!':'Nästa gång tar du det!';
  $('#result-copy').textContent=`+${reward} XP (${parts.map(p=>`${p.label} +${p.xp}`).join(', ')})${playerProgress().level>oldLevel?` · Spelarnivå ${playerProgress().level}!`:''}${won&&opponentLevel===100?' · Hela kartan avklarad!':won?` · Nästa: ${opponentName()}`:''}${unlockedSet?' · Välj ditt nya set under Mina tärningar.':''}`;
  $('#result-player').textContent=player;$('#result-ai').textContent=ai;$('#result-modal').classList.remove('hidden');busy=false;
  if(unlockedSet)triggerYatsun(unlockedSet);
}

function setAuthUi(user,name=authDisplayName){authUser=user;authDisplayName=name||user?.displayName||"Gästspelare";profile=loadProfile();updateProfileUi();const avatar=$("#profile-avatar"),profileName=$("#profile-name");profileName.textContent=user?authDisplayName:"Logga in";avatar.textContent=user?(authDisplayName.match(/\p{L}/u)?.[0]||"Y").toLocaleUpperCase("sv-SE"):"GS";if(user?.photoURL){const image=document.createElement("img");image.src=user.photoURL;image.alt="";avatar.replaceWith(image);image.id="profile-avatar";}else if(avatar.tagName==="IMG"){const span=document.createElement("span");span.id="profile-avatar";span.textContent=user?(authDisplayName[0]||"Y").toLocaleUpperCase("sv-SE"):"GS";avatar.replaceWith(span);}$("#google-login").classList.toggle("hidden",Boolean(user));$("#logout-button").classList.toggle("hidden",!user);$("#login-title").textContent=user?authDisplayName:"Spara ditt spel";$("#login-copy").textContent=user?`Du är inloggad med ${user.email||"ditt Google-konto"}. Din Yatsun-identitet är kopplad till samma konto som Bubbsun.`:"Logga in med samma Google-konto som på Bubbsun. Är du redan inloggad där känns du igen automatiskt.";$("#login-copy").classList.toggle("auth-user-copy",Boolean(user));}
onAuthStateChanged(auth,async(user)=>{if(!user){setAuthUi(null,"Gästspelare");remoteMatch=null;return;}let name=user.displayName||"Yatsunspelare";try{const snapshot=await getDoc(doc(firestore,"users",user.uid));if(snapshot.exists())name=snapshot.data().displayName||name;}catch(error){console.warn("Kunde inte läsa Bubbsun-namnet",error);}setAuthUi(user,name);await loadRemoteMatch();await syncCosmetics().catch(console.warn);});
$("#profile-button").addEventListener("click",()=>{$("#login-error").textContent="";$("#login-modal").classList.remove("hidden");});
$("#close-login").addEventListener("click",()=>$("#login-modal").classList.add("hidden"));
$("#login-modal").addEventListener("pointerdown",(event)=>{if(event.target===event.currentTarget)$("#login-modal").classList.add("hidden");});
$("#google-login").addEventListener("click",async()=>{const button=$("#google-login");button.disabled=true;button.lastChild.textContent=" LOGGAR IN…";$("#login-error").textContent="";try{await signInWithPopup(auth,new GoogleAuthProvider());$("#login-modal").classList.add("hidden");}catch(error){$("#login-error").textContent=error?.code==="auth/popup-closed-by-user"?"Inloggningen avbröts.":"Google-inloggningen misslyckades. Försök igen.";}finally{button.disabled=false;button.lastChild.textContent=" FORTSÄTT MED GOOGLE";}});
$("#logout-button").addEventListener("click",async()=>{await signOut(auth);$("#login-modal").classList.add("hidden");});
reactionPositions.forEach((_,id)=>{const button=document.createElement("button");button.type="button";button.className="reaction-option";button.setAttribute("aria-label",`Skicka reaktion ${id+1}`);reactionStyle(button,id);button.addEventListener("click",()=>{if(online?.active)void online.reaction(id);showReaction("player",id);$("#reaction-picker").classList.add("hidden");});$("#reaction-options").appendChild(button);});
$("#chat-button").addEventListener("click",()=>$("#reaction-picker").classList.toggle("hidden"));
$("#close-chat").addEventListener("click",()=>$("#reaction-picker").classList.add("hidden"));
document.addEventListener("pointerdown",(event)=>{const picker=$("#reaction-picker");if(!picker.classList.contains("hidden")&&!picker.contains(event.target)&&!$("#chat-button").contains(event.target))picker.classList.add("hidden");});
document.addEventListener("keydown",(event)=>{if(event.key==="Escape")$("#reaction-picker").classList.add("hidden");});
$("#test-yatsun").addEventListener("click",triggerYatsun);
let lastOnlineReaction=0,onlineSnapshot=null,onlineAnimating=false,queuedOnlineRoom=null;
function updateMatchPlayers(multiplayer,room=null){
  const cards=$$('.player-card'),mine=!multiplayer||room.state.turn===authUser.uid,done=multiplayer&&room.state.done;
  $('.match-label').replaceChildren(document.createElement('span'),document.createTextNode(multiplayer?' MULTIPLAYER':' SINGELMATCH'));
  cards[0].querySelector('strong').textContent=authDisplayName;
  cards[0].querySelector('small').textContent=done?'MATCHEN KLAR':mine?'DIN TUR':'DU';
  cards[0].classList.toggle('current',!done&&mine);cards[1].classList.toggle('current',!done&&!mine);
  cards[1].querySelector('.avatar').textContent=multiplayer?(room.otherName||'V').slice(0,1).toLocaleUpperCase('sv-SE'):'AI';
  if(multiplayer){cards[0].querySelector('span').textContent='Spela nu eller fortsätt senare';cards[1].querySelector('strong').textContent=room.otherName||'Vän';cards[1].querySelector('small').textContent=done?'MATCHEN KLAR':mine?'MOTSTÅNDARE':'MOTSTÅNDARENS TUR';cards[1].querySelector('span').textContent='Multiplayer · matchen sparas';}
  else cards[1].querySelector('span').textContent='Datormotståndare';
}
function applyOnlineRoom(room,initial=false,sending=false,force=false){
  if(onlineAnimating){queuedOnlineRoom={room,initial,sending,force};return;}
  const state=room.state,uid=authUser.uid,other=state.players.find(id=>id!==uid),changed=initial||force||onlineRevision!==room.revision;
  const rolled=!initial&&onlineSnapshot?.id===room.id&&state.rolls>0&&(state.turn!==onlineSnapshot.turn||state.rolls>onlineSnapshot.rolls);
  busy=sending||state.done||state.turn!==uid||rolled;
  boardSkin=state.diceSkin||'classic';
  if(initial)lastOnlineReaction=state.reaction?.at||0;
  if(state.reaction&&state.reaction.at>lastOnlineReaction){lastOnlineReaction=state.reaction.at;if(state.reaction.uid!==uid&&Date.now()-state.reaction.at<10000)showReaction('ai',state.reaction.id);}
  if(initial){showScreen('#game-screen');buildScorecard();dice.forEach((d,i)=>{d.x=(i%2?1:-1)*100;d.y=(Math.floor(i/2)-1)*145;d.rot=(i-2)*7;delete d.q;});}
  if(changed){const previous=lastScore;playerScores=state.scores[uid];aiScores=state.scores[other];rolls=state.rolls;lastScore=state.last?{who:state.last.uid===uid?'player':'ai',id:state.last.id}:null;dice.forEach((d,i)=>{if(initial||d.value!==state.dice[i])delete d.q;d.value=state.dice[i];d.held=state.held[i];});if(rolled){onlineAnimating=true;playDiceSound();}renderDice(rolled);if(!initial&&state.last?.id==='l8'&&state.last.score===50&&(previous?.id!==lastScore.id||previous?.who!==lastScore.who))triggerYatsun();onlineRevision=room.revision;onlineSnapshot={id:room.id,turn:state.turn,rolls:state.rolls};}
  updateMatchPlayers(true,room);
  $$('.ai-name').forEach(cell=>cell.textContent=room.otherName||'Vän');
  $('.turn-heading h2').textContent=state.done?`Klart! ${totals(playerScores).total} – ${totals(aiScores).total}`:sending?'Sparar drag…':state.turn===uid?'Din tur!':`${room.otherName||'Vännen'}s tur`;
  rollNumber.textContent=String(Math.max(1,rolls));rollHint.textContent='Matchen sparas efter varje kast och drag.';
  $('#restart-match').hidden=true;$('#end-match').textContent='Lämna rummet (sparas)';rollButton.classList.toggle('hidden',state.done||state.turn!==uid);updateSuggestions();
  if(rolled){dicePhysicsPromise.finally(()=>{onlineAnimating=false;const next=queuedOnlineRoom;queuedOnlineRoom=null;if(online?.active)applyOnlineRoom(next?.room||room,false,next?.sending||false,next?.force||false);});}
}
online=createSocial({show:showScreen,user:()=>authUser,name:()=>authDisplayName,canEnter:()=>!onlineAnimating&&(online.active||(!busy&&!diceRoot.querySelector('.rolling'))),applyRoom:applyOnlineRoom,login:()=>$('#login-modal').classList.remove('hidden'),leaveRoom:()=>{onlineRevision=-1;onlineSnapshot=null;queuedOnlineRoom=null;busy=false;rollButton.classList.remove('hidden');$('#restart-match').hidden=false;$('#end-match').textContent='Avsluta match';showScreen('#mode-screen');}});
const journey=createProgression({profile:()=>profile,name:opponentName,avatar:()=>$('#profile-avatar'),show:showScreen,start:()=>{if(online.active)online.leave();startGame();},select:async id=>{const previous=profile.activeSkin,key=profileKey();profile.activeSkin=id;localStorage.setItem(key,JSON.stringify(profile));try{await syncCosmetics(true);}catch(error){if(profileKey()===key){profile.activeSkin=previous;localStorage.setItem(key,JSON.stringify(profile));}throw error;}}});
const extras=document.createElement('div');extras.className='solo-extras';for(const [label,kind,action] of [['Kartan','map',journey.openMap],['Mina tärningar','dice',journey.openCollection]]){const b=document.createElement('button');b.type='button';b.className=`solo-extra ${kind}`;b.innerHTML=kind==='map'?'<span class="solo-extra-icon" aria-hidden="true"><i></i><i></i><i></i></span><b>Kartan</b><em>Se din resa</em><strong>→</strong>':'<span class="solo-extra-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>Mina tärningar</b><em>Välj utseende</em><strong>→</strong>';b.setAttribute('aria-label',label);b.onclick=action;extras.append(b);}$('.solo-card').append(extras);
for(const [id,label,path,view] of [
  ['friends-button','Vänner och matcher','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0','friends'],
  ['add-friend-button','Lägg till vänner','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M20 6v6 M17 9h6','add']
]){const b=document.createElement('button');b.id=id;b.className='social-icon';b.title=label;b.setAttribute('aria-label',label);b.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;b.onclick=()=>online.open(view);$('#profile-button').before(b);}
onAuthStateChanged(auth,()=>{setTimeout(()=>online.authChanged(),0);});
$('#open-multi').addEventListener('click',e=>{e.stopImmediatePropagation();online.lobby();},true);
for(const element of [$('#end-match'),$('#restart-match'),...$$('.back-to-modes'),$('#start-solo'),$('#play-again')])element.addEventListener('click',e=>{if(!online.active)return;if(onlineAnimating){e.stopImmediatePropagation();return;}online.leave();if(element.id==='end-match'||element.id==='restart-match'){e.stopImmediatePropagation();}},true);
$("#restart-match").addEventListener("click",()=>{if(!confirm("Starta om matchen mot samma motståndare? Alla poäng i den här matchen försvinner."))return;clearMatch();playerScores={};aiScores={};lastScore=null;rolls=0;dice.forEach((die)=>Object.assign(die,{held:false,value:1+Math.floor(Math.random()*6)}));startGame();});
$("#end-match").addEventListener("click",()=>{if(!confirm("Avsluta matchen? Den sparade matchen och alla poäng i den tas bort."))return;clearMatch();playerScores={};aiScores={};lastScore=null;$("#result-modal").classList.add("hidden");showScreen("#mode-screen");});
$("#start-solo").addEventListener("click",startGame);$("#open-multi").addEventListener("click",()=>showScreen("#lobby-screen"));$("#refresh-games").addEventListener("click",(event)=>{event.currentTarget.textContent="↻ UPPDATERAR…";setTimeout(()=>event.currentTarget.textContent="↻ UPPDATERA",700);});$$('.back-to-modes').forEach((button)=>button.addEventListener("click",()=>{$("#result-modal").classList.add("hidden");showScreen("#mode-screen");}));$("#play-again").addEventListener("click",startGame);rollButton.addEventListener("click",roll);buildScorecard();renderDice();updateProfileUi();
