import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseAiHolds,chooseAiScore} from '../public/yatsun/ai-engine.mjs';

test('level 100 pursues the only remaining small straight without seeing future dice',()=>{
  const decision=chooseAiHolds({values:[1,2,3,4,6],open:['l4'],rerolls:2,level:100,random:()=>.5});
  assert.deepEqual(decision.hold,[true,true,true,true,false]);
});

test('level 100 pursues the only remaining large straight',()=>{
  const decision=chooseAiHolds({values:[1,2,3,4,5],open:['l5'],rerolls:1,level:100,random:()=>.5});
  assert.deepEqual(decision.hold,[false,true,true,true,true]);
});

test('level 100 protects a made Yatzy and scores it',()=>{
  const values=[6,6,6,6,6],open=['u6','l7','l8'];
  assert.deepEqual(chooseAiHolds({values,open,rerolls:2,level:100}).hold,[true,true,true,true,true]);
  assert.deepEqual(chooseAiScore({values,open,level:100}),{id:'l8',score:50,value:105});
});

test('low levels can make a deliberate non-optimal decision',()=>{
  const values=[1,2,3,4,6],open=['l4'];
  const expert=chooseAiHolds({values,open,rerolls:1,level:100,random:()=>.99});
  const novice=chooseAiHolds({values,open,rerolls:1,level:1,random:()=>.99});
  assert.notDeepEqual(novice.hold,expert.hold);
});

test('planning never changes or predicts the supplied random dice',()=>{
  const values=[2,3,4,5,5],before=[...values];
  const decision=chooseAiHolds({values,open:['l5','u5'],rerolls:2,level:100});
  assert.deepEqual(values,before);
  assert.equal(decision.hold.length,5);
  assert.ok(decision.hold.every(value=>typeof value==='boolean'));
});
