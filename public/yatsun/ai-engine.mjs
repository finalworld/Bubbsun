const ALL_IDS=['u1','u2','u3','u4','u5','u6','l0','l1','l2','l3','l4','l5','l6','l7','l8'];
const FACT=[1,1,2,6,24,120];
const outcomeCache=new Map();

function counts(values){const result=Array(7).fill(0);for(const value of values)result[value]++;return result;}
export function aiScoreCategory(id,values){
  const c=counts(values),sum=values.reduce((a,b)=>a+b,0),groups=c.slice(1).map((amount,index)=>({amount,value:index+1})).filter(group=>group.amount);
  if(id[0]==='u'){const face=Number(id[1]);return c[face]*face;}
  if(id==='l0'){const pairs=groups.filter(group=>group.amount>=2);return pairs.length?Math.max(...pairs.map(group=>group.value))*2:0;}
  if(id==='l1'){const pairs=groups.filter(group=>group.amount>=2).map(group=>group.value).sort((a,b)=>b-a);return pairs.length>=2?(pairs[0]+pairs[1])*2:0;}
  if(id==='l2'){const group=groups.filter(group=>group.amount>=3).sort((a,b)=>b.value-a.value)[0];return group?group.value*3:0;}
  if(id==='l3'){const group=groups.filter(group=>group.amount>=4).sort((a,b)=>b.value-a.value)[0];return group?group.value*4:0;}
  if(id==='l4')return[1,2,3,4,5].every(value=>c[value]===1)?15:0;
  if(id==='l5')return[2,3,4,5,6].every(value=>c[value]===1)?20:0;
  if(id==='l6'){const pair=groups.find(group=>group.amount===2),three=groups.find(group=>group.amount===3);return pair&&three?pair.value*2+three.value*3:0;}
  if(id==='l7')return sum;
  if(id==='l8')return groups.some(group=>group.amount===5)?50:0;
  return 0;
}

function upperTotal(scores){return [1,2,3,4,5,6].reduce((sum,face)=>sum+(scores[`u${face}`]||0),0);}
function utility(id,score,values,scores){
  const scratch={l8:38,l5:28,l4:25,l6:23,l3:18,l1:14,l2:11,l0:7,l7:30};
  if(score===0)return-(scratch[id]??Number(id[1])*2.8);
  if(id==='l8')return 105;if(id==='l3')return 56+score;if(id==='l6')return 48+score;if(id==='l5'||id==='l4')return 43+score;
  if(id==='l1')return 22+score;if(id==='l2')return 15+score;if(id==='l0')return 9+score;if(id==='l7')return score-4;
  const face=Number(id[1]),amount=counts(values)[face],before=upperTotal(scores),bonusGain=before<63&&before+score>=63?50:0,target=face*3;
  return score+bonusGain-(target-score)*.7+(amount>=3?8:0)+(amount>=4?7:0);
}
function openIds(open){return (open?.length?open:ALL_IDS).map(value=>typeof value==='string'?value:value.id);}
function scoreChoices(values,open,scores){return openIds(open).map(id=>({id,score:aiScoreCategory(id,values),value:utility(id,aiScoreCategory(id,values),values,scores)})).sort((a,b)=>b.value-a.value);}
function outcomes(count){
  if(outcomeCache.has(count))return outcomeCache.get(count);
  const result=[],parts=Array(6).fill(0);function visit(face,left){if(face===5){parts[face]=left;const combinations=FACT[count]/parts.reduce((product,n)=>product*FACT[n],1);result.push({counts:[...parts],probability:combinations/6**count});return;}for(let n=0;n<=left;n++){parts[face]=n;visit(face+1,left-n);}}visit(0,count);outcomeCache.set(count,result);return result;
}
function heldOptions(values){
  const available=counts(values),held=Array(6).fill(0),result=[];function visit(face){if(face===6){result.push([...held]);return;}for(let n=0;n<=available[face+1];n++){held[face]=n;visit(face+1);}}visit(0);return result;
}
function valuesFromCounts(faceCounts){const result=[];faceCounts.forEach((amount,index)=>{for(let n=0;n<amount;n++)result.push(index+1);});return result;}
function rankHolds(values,open,scores,depth){
  const ids=openIds(open),memo=new Map();
  const best=(state,remaining)=>{const key=`${remaining}:${state.join('')}`;if(memo.has(key))return memo.get(key);if(!remaining){const value=scoreChoices(state,ids,scores)[0].value;memo.set(key,value);return value;}let value=-Infinity;for(const held of heldOptions(state)){const kept=held.reduce((sum,n)=>sum+n,0);if(kept===5){value=Math.max(value,best(state,0));continue;}let expected=0;for(const outcome of outcomes(5-kept)){const merged=held.map((n,index)=>n+outcome.counts[index]);expected+=outcome.probability*best(valuesFromCounts(merged),remaining-1);}value=Math.max(value,expected);}memo.set(key,value);return value;};
  return heldOptions(values).map(held=>{const kept=held.reduce((sum,n)=>sum+n,0);let value;if(kept===5||depth===0)value=best(valuesFromCounts(held.concat()),0);else{value=0;for(const outcome of outcomes(5-kept)){const merged=held.map((n,index)=>n+outcome.counts[index]);value+=outcome.probability*best(valuesFromCounts(merged),depth-1);}}return{held,value};}).sort((a,b)=>b.value-a.value);
}
function chooseByLevel(ranked,level,random){const skill=Math.max(.01,Math.min(1,level/100)),competence=.16+.84*skill**1.35;if(level>=100||random()<competence)return ranked[0];const range=Math.min(ranked.length,2+Math.floor((1-skill)*10));return ranked[1+Math.floor(random()*Math.max(1,range-1))]||ranked.at(-1);}

export function chooseAiHolds({values,open,scores={},rerolls=0,level=1,random=Math.random}){
  if(rerolls<=0)return{hold:Array(5).fill(false),value:0};
  const depth=level>=65?Math.min(2,rerolls):1,choice=chooseByLevel(rankHolds(values,open,scores,depth),level,random),remaining=[...choice.held];
  return{hold:values.map(value=>{const keep=remaining[value-1]>0;if(keep)remaining[value-1]--;return keep;}),value:choice.value};
}
export function chooseAiScore({values,open,scores={},level=1,random=Math.random}){return chooseByLevel(scoreChoices(values,open,scores),level,random);}
