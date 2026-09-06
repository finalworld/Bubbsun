import RAPIER from './vendor/rapier.mjs';
import {FACES,upperFace,seededRandom,vector,rotation,array,length,multiply,between} from './dice-math.mjs?v=physics32';
export {FACES,upperFace,faceQuaternion,sampleThrow,seededRandom} from './dice-math.mjs?v=physics32';
await RAPIER.init();

// Units are die edge lengths and seconds. No DOM or display clock enters here.
export const PHYSICS=Object.freeze({step:1/120,substeps:2,maxPointTravel:.015,gravity:22,mass:1,radius:.065,
  linearDamping:.25,angularDamping:.3,floorFriction:.44,floorBounce:.24,
  diceFriction:.16,diceBounce:.38,solverIterations:12,ccdSubsteps:4,
  speedLimit:.035,spinLimit:.07,alignment:Math.cos(2.5*Math.PI/180),
  stableTime:.45,penetrationLimit:.006,maxDuration:30,maxRecoveryRounds:2});

export function isStable({speed,spin,alignment,grounded,height,penetration=0}){
  return [speed,spin,alignment,height,penetration].every(Number.isFinite)
    && grounded&&Math.abs(height-.5)<.012&&alignment>=PHYSICS.alignment
    && speed<PHYSICS.speedLimit&&spin<PHYSICS.spinLimit&&penetration<PHYSICS.penetrationLimit;
}
export class DiceSimulation{
  constructor({dice,width,depth,obstacle=null,seed=1,initial=null,recover=true}){
    if(width<2||depth<2)throw new Error('Tärningsbrickan är för liten.');
    this.random=seededRandom(seed);this.width=width;this.depth=depth;this.obstacle=obstacle;
    this.recover=recover;this.time=0;this.done=false;this.safetyDeadline=PHYSICS.maxDuration;
    this.stats={nudges:0,steps:0,maxPenetration:0,diceContacts:0,timeoutRetries:0};
    const launches=this.launchPoints(dice.filter(d=>!d.held).length);
    this.world=new RAPIER.World({x:0,y:-PHYSICS.gravity,z:0});
    this.world.timestep=PHYSICS.step/PHYSICS.substeps;
    const integration=this.world.integrationParameters;
    integration.numSolverIterations=PHYSICS.solverIterations;integration.numInternalPgsIterations=2;
    integration.maxCcdSubsteps=PHYSICS.ccdSubsteps;integration.normalizedAllowedLinearError=.00015;
    integration.normalizedPredictionDistance=.003;
    this.floor=this.world.createCollider(RAPIER.ColliderDesc.cuboid(width+2,.2,depth+2).setTranslation(0,-.2,0)
      .setFriction(PHYSICS.floorFriction).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Max)
      .setRestitution(PHYSICS.floorBounce).setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min));
    this.walls=new Set();
    for(const [x,z,hx,hz] of [[-width/2-.15,0,.15,depth/2+.3],[width/2+.15,0,.15,depth/2+.3],[0,-depth/2-.15,width/2+.3,.15],[0,depth/2+.15,width/2+.3,.15]]){
      const wall=this.world.createCollider(RAPIER.ColliderDesc.cuboid(hx,5,hz).setTranslation(x,5,z).setFriction(.12).setRestitution(.32));this.walls.add(wall.handle);
    }
    if(obstacle){const wall=this.world.createCollider(RAPIER.ColliderDesc.cuboid((obstacle.right-obstacle.left)/2,5,(obstacle.bottom-obstacle.top)/2)
      .setTranslation((obstacle.left+obstacle.right)/2,5,(obstacle.top+obstacle.bottom)/2).setFriction(.12).setRestitution(.32));this.walls.add(wall.handle);}
    let launchIndex=0;
    this.bodies=dice.map(die=>{
      const fixture=initial?.find(p=>p.id===die.id),launch=die.held?null:launches[launchIndex++],pose=fixture?.pose||(die.held?die.pose:null);
      const desc=(die.held?RAPIER.RigidBodyDesc.fixed():RAPIER.RigidBodyDesc.dynamic())
        .setTranslation(...(pose?.position||launch)).setRotation(rotation(pose?.quaternion||this.randomOrientation()))
        .setLinearDamping(PHYSICS.linearDamping).setAngularDamping(PHYSICS.angularDamping).setCanSleep(false).setCcdEnabled(!die.held).setSoftCcdPrediction(.15);
      const rigid=this.world.createRigidBody(desc),h=.5-PHYSICS.radius;
      // Rounded solid collider, including its own mass and local inertia. The
      // rendered model has the same outer edge length; pips are surface detail.
      const collider=this.world.createCollider(RAPIER.ColliderDesc.roundCuboid(h,h,h,PHYSICS.radius)
        .setMass(PHYSICS.mass).setFriction(PHYSICS.diceFriction).setRestitution(PHYSICS.diceBounce),rigid);
      if(!die.held){rigid.setLinvel(vector(fixture?.velocity||[-3.5-this.random()*2,1.5+this.random()*1.5,(this.random()-.5)*3]),true);
        rigid.setAngvel(vector(fixture?.spin||[(this.random()-.5)*16,(this.random()-.5)*18,(this.random()-.5)*16]),true);}
      return {rigid,collider,id:die.id,held:Boolean(die.held),heldPose:die.held?structuredClone(die.pose):null,stableFor:0,stuckFor:0,lastNudge:-2,nudges:0};
    });
    this.done=this.bodies.every(b=>b.held);
  }
  randomOrientation(){
    const u=this.random(),v=this.random()*Math.PI*2,w=this.random()*Math.PI*2;
    return [Math.sqrt(1-u)*Math.sin(v),Math.sqrt(1-u)*Math.cos(v),Math.sqrt(u)*Math.sin(w),Math.sqrt(u)*Math.cos(w)];
  }
  launchPoints(count){
    const radius=.82,points=[],gap=1.75;
    for(let x=this.width/2-radius-.08;x>=-this.width/2+radius;x-=gap)for(let z=-this.depth/2+radius+.08;z<=this.depth/2-radius;z+=gap){
      const o=this.obstacle;if(o&&x+radius>o.left&&x-radius<o.right&&z+radius>o.top&&z-radius<o.bottom)continue;
      points.push([x,2.5+this.random()*.3,z]);
    }
    points.sort((a,b)=>(b[0]-Math.abs(b[2])*.15)-(a[0]-Math.abs(a[2])*.15));
    if(points.length<count)throw new Error('Det finns inte plats för kastet.');
    return points.slice(0,count);
  }
  state(body){
    let grounded=false,penetration=0;const wallNormal={x:0,z:0};
    this.world.contactPairsWith(body.collider,other=>{
      this.world.contactPair(body.collider,other,(manifold,flipped)=>{
        if(!manifold.numSolverContacts())return;
        let distance=Infinity;for(let i=0;i<manifold.numContacts();i++)distance=Math.min(distance,manifold.contactDist(i));
        penetration=Math.max(penetration,-distance);
        if(other.handle===this.floor.handle&&distance<.002)grounded=true;
        if(this.walls.has(other.handle)&&distance<.002){const n=manifold.normal(),sign=flipped?1:-1;wallNormal.x+=n.x*sign;wallNormal.z+=n.z*sign;}
        if(other.parent()?.isDynamic())this.stats.diceContacts++;
      });
    });
    return {speed:length(body.rigid.linvel()),spin:length(body.rigid.angvel()),alignment:upperFace(body.rigid.rotation()).normal.y,
      grounded,height:body.rigid.translation().y,penetration,wallNormal};
  }
  nudge(body,state){
    const p=body.rigid.translation(),top=upperFace(body.rigid.rotation()).normal;
    let dx=-top.x,dz=-top.z;
    const elevated=p.y>.85;
    if(elevated){
      // A die wedged between several held bodies needs a free escape direction,
      // not alternating pushes away from whichever neighbour is closest.
      let best=-Infinity;
      for(let i=0;i<24;i++){
        const angle=i*Math.PI/12,x=p.x+Math.cos(angle)*1.8,z=p.z+Math.sin(angle)*1.8,o=this.obstacle;
        let clearance=Math.min(this.width/2-Math.abs(x),this.depth/2-Math.abs(z));
        if(o&&x>o.left-.7&&x<o.right+.7&&z>o.top-.7&&z<o.bottom+.7)continue;
        for(const other of this.bodies)if(other!==body){const point=other.rigid.translation();clearance=Math.min(clearance,Math.hypot(point.x-x,point.z-z)-.7);}
        if(clearance>best){best=clearance;dx=Math.cos(angle);dz=Math.sin(angle);}
      }
    }
    const atWall=Math.hypot(state.wallNormal.x,state.wallNormal.z)>.1;
    if(atWall){dx=state.wallNormal.x;dz=state.wallNormal.z;}
    if(Math.hypot(dx,dz)<.05){const angle=this.random()*Math.PI*2;dx=Math.cos(angle);dz=Math.sin(angle);}
    const n=Math.hypot(dx,dz),strength=(elevated?3.2:atWall?1.2:.65)+Math.min(body.nudges,3)*.3;
    const offset=atWall||elevated?{x:0,z:0}:top.y<.99?{x:top.x*.4,z:top.z*.4}:{x:-dx/n*.25,z:-dz/n*.25};
    // A genuine wedge between fixed dice needs enough upward speed to clear
    // their tops: a small physical rethrow, with continuous position/rotation.
    const lift=elevated?Math.sqrt(2*PHYSICS.gravity*Math.max(.25,2.1-p.y))+.4:1.2;
    body.rigid.applyImpulseAtPoint({x:dx/n*strength,y:lift,z:dz/n*strength},{x:p.x+offset.x,y:p.y,z:p.z+offset.z},true);
    body.stableFor=0;body.stuckFor=0;body.lastNudge=this.time;body.nudges++;this.stats.nudges++;
  }
  step(){
    if(this.done)return true;
    // CCD plus motion-limited integration: even at extreme relative speeds,
    // neither a centre nor a rotating corner skips a visible part of a die.
    const fastest=Math.max(...this.bodies.filter(b=>!b.held).map(b=>length(b.rigid.linvel())+.82*length(b.rigid.angvel())));
    const substeps=Math.max(PHYSICS.substeps,Math.ceil(fastest*PHYSICS.step/PHYSICS.maxPointTravel));
    this.world.timestep=PHYSICS.step/substeps;
    for(let i=0;i<substeps;i++)this.world.step();
    this.time=(++this.stats.steps)*PHYSICS.step;
    for(const body of this.bodies){
      if(body.held)continue;
      const state=this.state(body),stable=isStable(state);
      this.stats.maxPenetration=Math.max(this.stats.maxPenetration,state.penetration);
      body.stableFor=stable?body.stableFor+PHYSICS.step:0;
      body.stuckFor=!stable&&state.speed<.3&&state.spin<.4?body.stuckFor+PHYSICS.step:0;
      // Physical recovery happens while still rolling, never after success.
      if(this.recover&&body.stuckFor>.6&&this.time-body.lastNudge>1)this.nudge(body,state);
    }
    this.done=this.bodies.every(b=>b.held||b.stableFor>=PHYSICS.stableTime);
    if(this.time>this.safetyDeadline&&!this.done){
      if(!this.recover||this.stats.timeoutRetries>=PHYSICS.maxRecoveryRounds)throw new Error('Kastet blev inte stabilt. Försök kasta igen.');
      // The safety timer also uses physical recovery in the same trajectory.
      // It can never end a throw or reset a body's position/orientation.
      for(const body of this.bodies)if(!body.held){const state=this.state(body);if(!isStable(state))this.nudge(body,state);}
      this.stats.timeoutRetries++;this.safetyDeadline=this.time+PHYSICS.maxDuration;
    }
    return this.done;
  }
  snapshot(){return this.bodies.map(b=>b.held?{id:b.id,...structuredClone(b.heldPose)}:{id:b.id,position:array(b.rigid.translation()),quaternion:array(b.rigid.rotation())});}
  free(){this.world.free();}
}
// Server-authoritative MP results use a cube symmetry applied to EVERY frame
// before playback starts. A rounded cube is invariant under this rotation,
// including inertia; the visible top face therefore agrees without a final snap.
export function matchAuthoritativeFaces(frames,dice,values){
  if(!values)return frames;
  const last=frames.at(-1),rotations=dice.map((d,i)=>{
    if(d.held)return null;
    const natural=FACES.find(f=>f[0]===upperFace(last[i].quaternion).value),desired=FACES.find(f=>f[0]===values[i]);
    if(!desired)throw new Error('Ogiltigt tärningsresultat.');
    return between(desired.slice(1),natural.slice(1));
  });
  for(const frame of frames)frame.forEach((pose,i)=>{if(rotations[i])pose.quaternion=multiply(pose.quaternion,rotations[i]);});
  return frames;
}
export function simulateThrow(options){
  const simulation=new DiceSimulation(options);
  try{
    const frames=[simulation.snapshot()];while(!simulation.done){simulation.step();frames.push(simulation.snapshot());}
    matchAuthoritativeFaces(frames,options.dice,options.values);
    return {frames,step:PHYSICS.step,duration:simulation.time,stats:simulation.stats,values:frames.at(-1).map(p=>upperFace(p.quaternion).value)};
  }finally{simulation.free();}
}
