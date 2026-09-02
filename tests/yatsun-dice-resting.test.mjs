import test from 'node:test';
import assert from 'node:assert/strict';
import {planRestingLayout} from '../public/yatsun/dice-resting.mjs';

function verify(dice,options){
  const result=planRestingLayout(dice,options);assert.ok(result,'A safe layout must exist');
  for(const die of result){
    if(die.held){assert.deepEqual(die,dice.find(d=>d.id===die.id));continue;}
    assert.ok(Math.abs(die.x)+options.radius<=options.width/2);
    assert.ok(Math.abs(die.y)+options.radius<=options.height/2);
    for(const other of result)if(other.id!==die.id)assert.ok(Math.hypot(die.x-other.x,die.y-other.y)>=options.radius*2+4);
    const o=options.obstacle,r=options.radius;
    if(o)assert.ok(die.x+r<o.left||die.x-r>o.right||die.y+r<o.top||die.y-r>o.bottom);
  }
  return result;
}
test('separates a pile without moving held dice',()=>{
  verify([{id:0,x:-80,y:0,held:true},{id:1,x:80,y:0,held:true},{id:2,x:80,y:0},{id:3,x:80,y:1},{id:4,x:80,y:2}],{width:600,height:600,radius:60});
});
test('leaves an already clear layout unchanged',()=>{
  const dice=[{id:0,x:-150,y:0},{id:1,x:0,y:0},{id:2,x:150,y:0}];
  assert.deepEqual(verify(dice,{width:600,height:500,radius:60}),dice);
});
test('keeps five desktop dice clear of the roll button and walls',()=>{
  verify(Array.from({length:5},(_,id)=>({id,x:280,y:200})),{width:620,height:550,radius:60,obstacle:{left:20,right:300,top:140,bottom:265}});
});
test('handles compact boards',()=>{
  verify(Array.from({length:5},(_,id)=>({id,x:0,y:0})),{width:300,height:360,radius:38,obstacle:{left:-60,right:140,top:120,bottom:175}});
});
test('never reports success when the board has no safe space',()=>{
  assert.equal(planRestingLayout([{id:0,x:0,y:0}],{width:80,height:80,radius:60}),null);
});
