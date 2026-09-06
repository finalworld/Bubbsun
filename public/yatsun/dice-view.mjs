import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {paintDice,skinById} from './progression.mjs?v=materials18';
import {faceQuaternion,sampleThrow,upperFace} from './dice-math.mjs?v=physics32';

const modelSource=new GLTFLoader().loadAsync(new URL('./assets/3d/D6_A.gltf',import.meta.url).href);
const physicsToView=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,0,0));

export class DiceBoard {
  constructor(root,rollButton,onHold) {
    this.root=root;this.rollButton=rollButton;this.onHold=onHold;this.items=new Map();this.poses=[];this.playing=false;
    this.canvas=document.createElement('canvas');this.canvas.className='dice-scene';this.canvas.setAttribute('aria-hidden','true');root.replaceChildren(this.canvas);
    this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.22;
    this.scene=new THREE.Scene();this.world=new THREE.Group();this.world.quaternion.copy(physicsToView);this.scene.add(this.world);
    this.camera=new THREE.OrthographicCamera(-4,4,4,-4,.1,100);this.camera.position.set(.38,.45,3).multiplyScalar(10);this.camera.lookAt(0,0,0);
    // Keep the original material lighting and viewing angle, but share depth.
    this.scene.add(new THREE.HemisphereLight(0xfff9e8,0x365844,2.6));
    const key=new THREE.DirectionalLight(0xffffff,4.2);key.position.set(-3,4,5);this.scene.add(key);
    const rim=new THREE.DirectionalLight(0xffd97a,1.8);rim.position.set(4,-2,3);this.scene.add(rim);
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
    const context=shadowCanvas.getContext('2d'),gradient=context.createRadialGradient(32,32,4,32,32,32);
    gradient.addColorStop(0,'rgba(12,36,24,.42)');gradient.addColorStop(1,'rgba(12,36,24,0)');context.fillStyle=gradient;context.fillRect(0,0,64,64);
    this.shadowTexture=new THREE.CanvasTexture(shadowCanvas);
    this.resizeObserver=new ResizeObserver(()=>{if(root.clientWidth&&root.clientHeight){this.layout();this.draw();}});this.resizeObserver.observe(root);
    this.worker=new Worker(new URL('./dice-worker.mjs?v=physics32',import.meta.url),{type:'module'});
    this.requests=new Map();this.requestId=0;
    this.worker.onmessage=({data})=>{const request=this.requests.get(data.id);if(!request)return;this.requests.delete(data.id);if(data.error)request.reject(new Error(data.error));else request.resolve(data.trace);};
    this.worker.onerror=()=>{this.workerError=new Error('Tärningsfysiken kunde inte starta. Ladda om och försök igen.');for(const request of this.requests.values())request.reject(this.workerError);this.requests.clear();};
  }
  layout() {
    const width=this.root.clientWidth||600,height=this.root.clientHeight||500;
    if(width===this.width&&height===this.height)return {width:width/this.scale-.4,depth:height/this.scale-.4};
    this.width=width;this.height=height;
    const nominal=window.innerWidth<680?50:80;
    this.scale=Math.min(nominal,(this.width-18)/5.5,(this.height-18)/5.5);
    // A resize changes the camera, never saved world positions.
    if(!this.playing&&this.poses.length) {
      for(const p of this.poses) this.scale=Math.min(this.scale,(this.width-18)/(2*(Math.abs(p.position[0])+.9)),(this.height-18)/(2*(Math.abs(p.position[2])+.9)));
    }
    this.renderer.setSize(this.width,this.height,false);
    this.camera.left=-this.width/this.scale/2;this.camera.right=-this.camera.left;
    this.camera.top=this.height/this.scale/2;this.camera.bottom=-this.camera.top;this.camera.updateProjectionMatrix();
    return {width:this.width/this.scale-.4,depth:this.height/this.scale-.4};
  }
  obstacle() {
    // Reserve the same area on both turns, even when the AI hides the button.
    const rect=this.rollButton.getBoundingClientRect(),root=this.root.getBoundingClientRect();
    if(rect.width&&rect.height) {
      const o={left:(rect.left-root.left-this.width/2)/this.scale-.15,right:(rect.right-root.left-this.width/2)/this.scale+.15,
        top:(rect.top-root.top-this.height/2)/this.scale-.15,bottom:(rect.bottom-root.top-this.height/2)/this.scale+.15};
      this.lastObstacle=o.top<this.height/this.scale/2&&o.left<this.width/this.scale/2&&o.right>-this.width/this.scale/2?o:null;
    }
    return this.lastObstacle||null;
  }
  ensurePose(die,index) {
    if(die.pose?.position?.length===3&&die.pose?.quaternion?.length===4&&[...die.pose.position,...die.pose.quaternion].every(Number.isFinite)) return;
    const legacyScale=window.innerWidth<680?50:80;
    // Legacy saves stored screen pixels and an orientation only. Migration is
    // performed on restore, not at roll completion or when a die is held.
    const x=Number.isFinite(die.x)?die.x/legacyScale:(index%2?1:-1)*1.3;
    const z=Number.isFinite(die.y)?die.y/legacyScale:(Math.floor(index/2)-1)*1.7;
    die.pose={position:[x,.5,z],quaternion:die.q?.length===4?[...die.q]:faceQuaternion(die.value,(die.rot||0)*Math.PI/180)};
  }
  setDice(dice) {
    this.setting=(this.setting||Promise.resolve()).catch(()=>{}).then(()=>this.updateDice(dice));
    return this.setting;
  }
  async updateDice(dice) {
    const source=await modelSource;
    dice.forEach((die,i)=>this.ensurePose(die,i));
    this.poses=dice.map(d=>({id:d.id,...d.pose}));this.layout();
    await Promise.all(dice.map(async die=>{
      let item=this.items.get(die.id);
      if(!item) {
        const object=new THREE.Group(),model=source.scene.clone(true),box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=1/Math.max(size.x,size.y,size.z);
        model.scale.setScalar(scale);model.position.copy(center).multiplyScalar(-scale);object.add(model);this.world.add(object);
        const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.9),new THREE.MeshBasicMaterial({map:this.shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.renderOrder=-2;this.world.add(shadow);
        const ring=new THREE.Mesh(new THREE.RingGeometry(.67,.705,64),new THREE.MeshBasicMaterial({color:0xffd76a,transparent:true,opacity:.9,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;this.world.add(ring);
        const button=document.createElement('button');button.type='button';button.className='dice-hit-target';button.dataset.dieId=String(die.id);button.addEventListener('click',()=>this.onHold(die.id));this.root.append(button);
        item={object,model,shadow,ring,button,skin:null,materials:[]};this.items.set(die.id,item);
      }
      if(item.skin!==die.skin) {
        const materials=paintDice(item.model,skinById(die.skin),THREE);await materials.ready;
        item.materials.forEach(m=>m.dispose());item.materials=materials;item.skin=die.skin;
      }
      item.die=die;
    }));
    this.syncHeld(dice);this.draw(this.poses);
  }
  syncHeld(dice) {
    for(const die of dice) {
      const item=this.items.get(die.id);if(!item)continue;
      item.button.classList.toggle('held',die.held);item.ring.visible=die.held;
      item.button.setAttribute('aria-label',`Tärning ${die.id+1}: ${die.value}${die.held?', sparad':''}`);
      item.button.setAttribute('aria-pressed',String(die.held));
    }
    this.draw();
  }
  draw(poses=this.poses) {
    this.poses=poses;this.camera.updateMatrixWorld();
    for(const pose of poses) {
      const item=this.items.get(pose.id);if(!item)continue;
      item.object.position.fromArray(pose.position);item.object.quaternion.fromArray(pose.quaternion);
      item.shadow.position.set(pose.position[0],.002,pose.position[2]);item.shadow.material.opacity=1/(1+Math.max(0,pose.position[1]-.5)*.55);
      item.ring.position.set(pose.position[0],.006,pose.position[2]);
      const screen=item.object.position.clone().applyQuaternion(physicsToView).project(this.camera);
      item.button.style.left=`${(screen.x+1)*this.width/2}px`;item.button.style.top=`${(1-screen.y)*this.height/2}px`;
      item.button.style.width=`${this.scale*1.2}px`;item.button.style.height=`${this.scale*1.2}px`;
    }
    this.renderer.render(this.scene,this.camera);
  }
  plan(options) {
    if(this.workerError)return Promise.reject(this.workerError);
    const id=++this.requestId;
    return new Promise((resolve,reject)=>{this.requests.set(id,{resolve,reject});this.worker.postMessage({id,options});});
  }
  async roll(dice,values=null) {
    await this.setDice(dice);const board=this.layout(),obstacle=this.obstacle();
    const seed=crypto.getRandomValues(new Uint32Array(1))[0];
    const trace=await this.plan({...board,obstacle,dice:dice.map(d=>({id:d.id,held:d.held,pose:d.pose})),seed,values});
    this.playing=true;this.root.setAttribute('aria-busy','true');
    for(const die of dice) this.items.get(die.id).button.classList.toggle('rolling',!die.held);
    let elapsed=0,previous=null;
    const resetClock=()=>{previous=null;};document.addEventListener('visibilitychange',resetClock);
    await new Promise(resolve=>{
      const frame=now=>{
        if(previous!==null&&!document.hidden) elapsed+=Math.min(.1,(now-previous)/1000);
        previous=now;this.draw(sampleThrow(trace,elapsed));
        if(elapsed<trace.duration) requestAnimationFrame(frame);else resolve();
      };
      requestAnimationFrame(frame);
    });
    document.removeEventListener('visibilitychange',resetClock);
    const final=trace.frames.at(-1);
    dice.forEach((die,i)=>{
      if(!die.held) {
        die.pose={position:[...final[i].position],quaternion:[...final[i].quaternion]};
        die.q=[...die.pose.quaternion];die.rot=0;die.x=die.pose.position[0]*this.scale;die.y=die.pose.position[2]*this.scale;
        die.value=upperFace(die.pose.quaternion).value;
      }
      this.items.get(die.id).button.classList.remove('rolling');
    });
    this.playing=false;this.root.setAttribute('aria-busy','false');this.syncHeld(dice);
    // No simulation, layout pass or pose adjustment follows this event.
    this.root.dispatchEvent(new CustomEvent('dice-settled',{detail:{duration:trace.duration,stats:trace.stats,values:dice.map(d=>d.value)}}));
    return trace;
  }
}
