// Physical/model space is Y-up. Values match the supplied D6_A glTF mesh.
export const FACES=[[3,0,0,1],[4,0,0,-1],[2,1,0,0],[5,-1,0,0],[6,0,1,0],[1,0,-1,0]];
export const length=v=>Math.hypot(v.x,v.y,v.z);
export const vector=([x,y,z])=>({x,y,z});
export const rotation=([x,y,z,w])=>({x,y,z,w});
export const array=v=>v.w===undefined?[v.x,v.y,v.z]:[v.x,v.y,v.z,v.w];
export function multiply(a,b){
  const [x,y,z,w]=a,[X,Y,Z,W]=b;
  return [w*X+x*W+y*Z-z*Y,w*Y+y*W+z*X-x*Z,w*Z+z*W+x*Y-y*X,w*W-x*X-y*Y-z*Z];
}
export function rotate(q,[x,y,z]){
  const [qx,qy,qz,qw]=Array.isArray(q)?q:array(q);
  const tx=2*(qy*z-qz*y),ty=2*(qz*x-qx*z),tz=2*(qx*y-qy*x);
  return {x:x+qw*tx+qy*tz-qz*ty,y:y+qw*ty+qz*tx-qx*tz,z:z+qw*tz+qx*ty-qy*tx};
}
export function between(a,b){
  const dot=a.reduce((sum,v,i)=>sum+v*b[i],0);
  if(dot<-.99999)return Math.abs(a[0])>.5?[0,1,0,0]:[1,0,0,0];
  const q=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0],1+dot],n=Math.hypot(...q);
  return q.map(v=>v/n);
}
export function upperFace(q){return FACES.map(([value,...n])=>({value,normal:rotate(q,n)})).sort((a,b)=>b.normal.y-a.normal.y)[0];}
export function faceQuaternion(value,yaw=0){
  const face=FACES.find(f=>f[0]===value)||FACES[0];
  return multiply([0,Math.sin(yaw/2),0,Math.cos(yaw/2)],between(face.slice(1),[0,1,0]));
}
export function seededRandom(seed){
  let state=seed>>>0;
  return ()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
function slerp(a,b,t){
  let dot=a.reduce((s,v,i)=>s+v*b[i],0);if(dot<0){b=b.map(v=>-v);dot=-dot;}
  if(dot>.9995){const q=a.map((v,i)=>v+(b[i]-v)*t),n=Math.hypot(...q);return q.map(v=>v/n);}
  const angle=Math.acos(Math.min(1,dot)),den=Math.sin(angle),u=Math.sin((1-t)*angle)/den,v=Math.sin(t*angle)/den;
  return a.map((n,i)=>n*u+b[i]*v);
}
export function sampleThrow(trace,time){
  if(time>=trace.duration-1e-9)return trace.frames.at(-1);
  const index=Math.min(trace.frames.length-1,Math.max(0,time/trace.step)),a=Math.floor(index),b=Math.min(a+1,trace.frames.length-1),fraction=index-a;
  if(!fraction||a===b)return trace.frames[a];
  return trace.frames[a].map((pose,i)=>{
    const next=trace.frames[b][i];
    if(pose.position.every((v,j)=>v===next.position[j])&&pose.quaternion.every((v,j)=>v===next.quaternion[j]))return pose;
    return {id:pose.id,position:pose.position.map((v,j)=>v+(next.position[j]-v)*fraction),quaternion:slerp(pose.quaternion,next.quaternion,fraction)};
  });
}
