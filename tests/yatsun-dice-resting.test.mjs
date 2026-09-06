import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DiceSimulation,PHYSICS,simulateThrow,isStable,upperFace,faceQuaternion,sampleThrow} from '../public/yatsun/dice-physics.mjs';
import {between,rotate} from '../public/yatsun/dice-math.mjs';
const dice=(count=5)=>Array.from({length:count},(_,id)=>({id,held:false}));
const board={width:7,depth:8};
const zero=[0,0,0];
const pose=(position,quaternion=faceQuaternion(6))=>({position,quaternion});
let verifiedThrows=0;

function finish(options,inspect){
  const sim=new DiceSimulation({...board,...options});
  try{
    while(!sim.done){sim.step();inspect?.(sim);}
    for(const body of sim.bodies){
      if(body.held)continue;
      assert.ok(isStable(sim.state(body)),JSON.stringify({id:body.id,state:sim.state(body)}));
      assert.ok(body.stableFor>=PHYSICS.stableTime);
      for(const other of sim.bodies)if(body!==other){
        const contact=body.collider.contactCollider(other.collider,0);
        assert.ok(!contact||contact.distance>-.004,'No penetrating final colliders');
      }
    }
    verifiedThrows++;return sim.snapshot();
  }finally{sim.free();}
}

test('all six values follow actual model normals at any yaw',()=>{
  for(let value=1;value<=6;value++)for(let i=0;i<16;i++){
    const face=upperFace(faceQuaternion(value,i*.47));
    assert.equal(face.value,value);assert.ok(face.normal.y>.999999);
  }
});
test('completion rejects an edge, corner, airborne, stacked or still-moving die',()=>{
  const valid={speed:0,spin:0,alignment:1,grounded:true,height:.5,penetration:0};
  assert.equal(isStable(valid),true);
  for(const changed of [{alignment:Math.SQRT1_2},{alignment:1/Math.sqrt(3)},{grounded:false},{height:1.5},{speed:.1},{spin:.2},{penetration:.02},{speed:NaN}])
    assert.equal(isStable({...valid,...changed}),false);
});
test('collider encloses the visible glTF rounded body at its normalized scale',()=>{
  const gltf=JSON.parse(readFileSync(new URL('../public/yatsun/assets/3d/D6_A.gltf',import.meta.url)));
  const binary=readFileSync(new URL('../public/yatsun/assets/3d/D6_A.bin',import.meta.url)),accessor=gltf.accessors[0],view=gltf.bufferViews[accessor.bufferView];
  const size=Math.max(...accessor.max.map((v,i)=>v-accessor.min[i]));
  for(let i=0;i<accessor.count;i++){
    const p=[0,1,2].map(axis=>binary.readFloatLE((view.byteOffset||0)+(accessor.byteOffset||0)+i*(view.byteStride||12)+axis*4)/size);
    const distance=Math.hypot(...p.map(v=>Math.max(0,Math.abs(v)-(.5-PHYSICS.radius))));
    assert.ok(distance<=PHYSICS.radius+.001,'Visual vertex outside rounded collider');
  }
});
test('launches never overlap dice, held dice, walls or the button',()=>{
  for(const dimensions of [board,{width:5.5,depth:6.5},{width:11,depth:9}]){
    const sim=new DiceSimulation({...dimensions,dice:dice(),seed:42});
    try{
      for(const a of sim.bodies)for(const b of sim.bodies)if(a!==b)assert.equal(a.collider.contactCollider(b.collider,0),null);
      for(const b of sim.bodies){const p=b.rigid.translation();assert.ok(Math.abs(p.x)+.82<dimensions.width/2+.001);assert.ok(Math.abs(p.z)+.82<dimensions.depth/2+.001);}
    }finally{sim.free();}
  }
});
test('300 seeded five-dice throws settle on desktop, compact and obstructed trays',()=>{
  const configurations=[board,{width:5.5,depth:6.5},{width:8,depth:8,obstacle:{left:.2,right:4,top:2.6,bottom:4}}];
  for(const dimensions of configurations)for(let seed=1;seed<=100;seed++)finish({...dimensions,dice:dice(),seed});
});
test('200 rerolls preserve 1–4 held poses exactly, in every displayed frame',()=>{
  for(let seed=1;seed<=50;seed++){
    let state=dice();
    for(let heldCount=1;heldCount<=4;heldCount++){
      if(!state[0].pose){const first=simulateThrow({...board,dice:state,seed:seed*41});state=state.map((d,i)=>({...d,pose:first.frames.at(-1)[i]}));}
      state.forEach((d,i)=>d.held=i<heldCount);
      const saved=structuredClone(state),trace=simulateThrow({...board,dice:state,seed:seed*71+heldCount});
      for(const frame of trace.frames)for(let i=0;i<heldCount;i++)assert.deepEqual(frame[i],{id:i,...saved[i].pose});
      trace.frames.at(-1).forEach((p,i)=>state[i].pose=p);
      trace.frames.at(-1).forEach(p=>assert.ok(upperFace(p.quaternion).normal.y>=PHYSICS.alignment));
      verifiedThrows++;
    }
  }
});
test('edge and corner balances receive impulses and finish flat',()=>{
  const edge=[0,0,Math.sin(Math.PI/8),Math.cos(Math.PI/8)];
  const corner=between([1/Math.sqrt(3),1/Math.sqrt(3),1/Math.sqrt(3)],[0,1,0]);
  for(const q of [edge,corner]){
    const h=(.5-PHYSICS.radius)*(q===edge?Math.SQRT2:Math.sqrt(3))+PHYSICS.radius;
    finish({dice:dice(1),initial:[{id:0,pose:pose([0,h,0],q),velocity:zero,spin:zero}]});
  }
});
test('tilted piles and deep overlap resolve through contacts before success',()=>{
  for(let seed=1;seed<=10;seed++){
    const initial=[{id:0,pose:pose([0,.5,0]),velocity:zero,spin:zero},
      {id:1,pose:pose([.1,seed%2?1.4:.65,.1],[0,0,Math.sin(.2),Math.cos(.2)]),velocity:zero,spin:zero},
      {id:2,pose:pose([-.1,2.4,0],faceQuaternion(3,.3)),velocity:zero,spin:zero}];
    finish({dice:dice(3),initial,seed});
  }
});
test('a die on a held die gets off without moving the held body',()=>{
  const held=pose([0,.5,0],faceQuaternion(5,.3));
  const final=finish({dice:[{id:0,held:true,pose:held},{id:1,held:false}],initial:[{id:1,pose:pose([0,1.52,0],faceQuaternion(3,.3)),velocity:zero,spin:zero}]},
    sim=>assert.deepEqual(sim.snapshot()[0],{id:0,...held}));
  assert.deepEqual(final[0],{id:0,...held});
});
test('fast head-on and simultaneous collisions do not tunnel',()=>{
  for(const speed of [10,45,100]){
    let maxDepth=0;
    finish({dice:dice(2),width:16,depth:8,initial:[
      {id:0,pose:pose([-2,1.5,0]),velocity:[speed,0,0],spin:zero},
      {id:1,pose:pose([2,1.5,0]),velocity:[-speed,0,0],spin:zero}]},sim=>{
        const [a,b]=sim.bodies,contact=a.collider.contactCollider(b.collider,0);
        if(contact)maxDepth=Math.max(maxDepth,-contact.distance);
        assert.ok(a.rigid.translation().x<=b.rigid.translation().x+.02,'The dice must never pass through each other');
    });
    assert.ok(maxDepth<.03,'CCD penetration stays below 3% of an edge: '+maxDepth);
  }
});
test('30 multiplayer traces match the server from first frame to last with no result snap',()=>{
  for(let seed=1;seed<=30;seed++){
    const values=Array.from({length:5},(_,i)=>1+(seed+i)%6),trace=simulateThrow({...board,dice:dice(),seed,values});
    assert.deepEqual(trace.values,values);
    const last=trace.frames.at(-1),before=trace.frames.at(-2);
    for(let i=0;i<5;i++){
      assert.equal(upperFace(last[i].quaternion).value,values[i]);
      assert.ok(Math.hypot(...last[i].position.map((v,j)=>v-before[i].position[j]))<.001);
      assert.ok(Math.abs(last[i].quaternion.reduce((s,v,j)=>s+v*before[i].quaternion[j],0))>.99999);
    }
    verifiedThrows++;
  }
});
test('15, 30, 60, 144 fps and irregular display timing have identical results and stable tails',()=>{
  const trace=simulateThrow({...board,dice:dice(),seed:2026});
  for(const fps of [15,30,60,144]){
    let time=0;while(time<trace.duration)time+=1/fps;
    assert.deepEqual(sampleThrow(trace,time),trace.frames.at(-1));
    assert.deepEqual(sampleThrow(trace,time+10),trace.frames.at(-1));
  }
  for(const t of [.37,.891,1.123]){
    const p=sampleThrow(trace,t);p.forEach(d=>assert.ok([...d.position,...d.quaternion].every(Number.isFinite)));
  }
});
test('a completed simulation never writes another pose, and is physically stable if released',()=>{
  const sim=new DiceSimulation({...board,dice:dice(),seed:231});
  try{
    while(!sim.done)sim.step();const final=sim.snapshot();
    for(let i=0;i<240;i++)sim.step();assert.deepEqual(sim.snapshot(),final);
    for(let i=0;i<240;i++)sim.world.step();
    sim.snapshot().forEach((p,i)=>assert.ok(Math.hypot(...p.position.map((v,j)=>v-final[i].position[j]))<.004));
  }finally{sim.free();}
});
test('an all-held roll changes nothing and does not consume simulation time',()=>{
  const state=dice().map((d,i)=>({...d,held:true,pose:pose([(i-2)*1.4,.5,0],faceQuaternion(i+1))}));
  const trace=simulateThrow({...board,dice:state});assert.equal(trace.duration,0);
  assert.deepEqual(trace.frames[0],state.map(d=>({id:d.id,...d.pose})));
});
test('the safety deadline physically retries without teleporting or declaring success',()=>{
  const sim=new DiceSimulation({...board,dice:dice(),seed:42});
  try{
    sim.safetyDeadline=PHYSICS.step/2;const before=sim.snapshot();sim.step();
    assert.equal(sim.done,false);assert.equal(sim.stats.timeoutRetries,1);
    sim.snapshot().forEach((p,i)=>assert.ok(Math.hypot(...p.position.map((v,j)=>v-before[i].position[j]))<.1));
    while(!sim.done)sim.step();
    sim.bodies.forEach(b=>assert.ok(isStable(sim.state(b))));
  }finally{sim.free();}
});
test('unsafe or impossible boards fail without reporting a completed throw',()=>{
  assert.throws(()=>simulateThrow({width:1,depth:1,dice:dice()}),/liten/);
  assert.throws(()=>simulateThrow({width:3,depth:3,dice:dice()}),/plats/);
});
test('physics regression scenario count',()=>{assert.equal(verifiedThrows,546);});
