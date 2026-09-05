const atlasUrl=new URL('./assets/dice-materials.png',import.meta.url).href;
export const skins=[
  ['classic','Original',0,'#fff8e7','#153b2d',0,.5,[99,20,310,294]],
  ['forest','Skog',10,'#b96f2c','#302015',0,.65,[449,29,291,284]],
  ['ocean','Hav',20,'#079de2','#f5fcff',.05,.22,[790,29,291,285]],
  ['cherry','Körsbär',30,'#e30628','#ffd049',.1,.28,[1137,30,291,278]],
  ['amber','Bärnsten',40,'#eaa01c','#572d12',.15,.24,[96,352,308,283]],
  ['violet','Ametist',50,'#7b2fc4','#fff0e0',.15,.23,[456,355,287,289]],
  ['ice','Isblå',60,'#bce5e5','#174d79',.08,.18,[788,354,296,288]],
  ['copper','Koppar',70,'#b96937','#fff4d1',.68,.3,[1137,354,298,290]],
  ['midnight','Midnatt',80,'#0a2854','#edc36c',.18,.28,[256,681,292,313]],
  ['pearl','Pärlemor',90,'#eedaf3','#694381',.42,.18,[624,682,296,310]],
  ['champion','Mästarguld',100,'#eebc36','#342914',.8,.22,[1002,681,290,311]]
].map(([id,name,level,body,pips,metalness,roughness,atlas])=>({id,name,level,body,pips,metalness,roughness,atlas}));
export function completedLevels(p){return Math.min(100,Math.max(0,Math.trunc(Number(p.completed)||0),Math.trunc(Number(p.unlocked)||1)-1));}
export function activeSkin(p){return skins.find(s=>s.id===p.activeSkin&&(p.admin||s.level<=completedLevels(p)))||skins[0];}
export function awardVictory(p,level){const previous=completedLevels(p),completed=Math.max(previous,Math.min(100,level));return {...p,completed,unlocked:Math.min(100,completed+1),newSkin:skins.find(s=>s.level===level&&level>previous)?.name||null};}
export function skinById(id){return skins.find(s=>s.id===id)||skins[0];}
export function paintDice(model,skin,THREE){
  const materials=[],canvas=document.createElement('canvas'),context=canvas.getContext('2d');canvas.width=canvas.height=256;context.fillStyle=skin.body;context.fillRect(0,0,256,256);const skinTexture=new THREE.CanvasTexture(canvas);skinTexture.colorSpace=THREE.SRGBColorSpace;skinTexture.flipY=false;let readyResolve;materials.ready=new Promise(resolve=>readyResolve=resolve);materials.texture=skinTexture;
  new THREE.TextureLoader().load(atlasUrl,image=>{const [x,y,w,h]=skin.atlas,inset=.2;context.fillStyle=skin.body;context.fillRect(0,0,256,256);context.drawImage(image,x+w*inset,y+h*inset,w*(1-inset*2),h*(1-inset*2),0,0,256,256);skinTexture.needsUpdate=true;readyResolve();},undefined,()=>readyResolve());
  model.traverse(node=>{if(!node.isMesh)return;const tint=original=>{const material=original.clone();material.metalness=skin.metalness;material.roughness=skin.roughness;material.onBeforeCompile=shader=>{shader.uniforms.skinPips={value:new THREE.Color(skin.pips)};shader.uniforms.skinTexture={value:skinTexture};shader.vertexShader='varying vec3 skinObjectPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nskinObjectPosition=position;');shader.fragmentShader='uniform vec3 skinPips; uniform sampler2D skinTexture; varying vec3 skinObjectPosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat faceInk=smoothstep(0.12,0.65,dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722))); vec3 p=skinObjectPosition,ap=abs(p); vec2 cubeUv=ap.x>ap.y&&ap.x>ap.z?p.zy:ap.y>ap.z?p.xz:p.xy; vec2 materialUv=clamp(vec2(.06)+((cubeUv/.75)+.5)*.88,0.0,1.0); vec3 surface=texture2D(skinTexture,materialUv).rgb; diffuseColor.rgb=mix(skinPips,surface,faceInk);');};material.customProgramCacheKey=()=>skin.id+'-canvas-atlas1';materials.push(material);return material;};node.material=Array.isArray(node.material)?node.material.map(tint):tint(node.material);});
  return materials;
}

export function enableDragScroll(board,viewport=window){
  let drag=null,suppressClick=false;
  board.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='mouse'||event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:false};
    board.setPointerCapture(event.pointerId);board.classList.add('dragging');
  });
  board.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const distance=Math.hypot(event.clientX-drag.x,event.clientY-drag.y);
    if(distance>5)drag.moved=true;
    if(drag.moved){event.preventDefault();viewport.scrollBy({left:drag.lastX-event.clientX,top:drag.lastY-event.clientY,behavior:'instant'});}
    drag.lastX=event.clientX;drag.lastY=event.clientY;
  });
  const finish=event=>{if(!drag||event.pointerId!==drag.id)return;suppressClick=drag.moved;drag=null;board.classList.remove('dragging');};
  board.addEventListener('pointerup',finish);board.addEventListener('pointercancel',finish);
  board.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopPropagation();suppressClick=false;}},true);
}

export function createProgression({profile,select,start,name,avatar,show}){
  const map=document.createElement('section'),collection=document.createElement('section');map.id='campaign-screen';collection.id='collection-screen';map.className=collection.className='journey-page hidden';document.querySelector('main').append(map,collection);
  function el(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;}
  function btn(text,fn){const b=el('button',text);b.type='button';b.onclick=fn;return b;}
  function header(root,title){root.replaceChildren();root.append(btn('← Till spellägen',()=>show('#mode-screen')),el('h1',title));}
  function openMap(){
    header(map,'Din väg till 100');const p=profile(),done=completedLevels(p),current=Math.min(100,done+1);
    map.append(el('p','Besegra motståndarna längs vägen. Var tionde seger låser upp ett nytt tärningsset.'));
    const board=el('div','','campaign-board');map.append(board);enableDragScroll(board);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 600 8100');svg.setAttribute('preserveAspectRatio','none');svg.classList.add('campaign-road');
    const points=Array.from({length:100},(_,i)=>({x:300+Math.sin(i*Math.PI/6)*185,y:8000-i*80}));
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' '));svg.append(path);board.append(svg);
    points.forEach((point,i)=>{const level=i+1,earned=level<=done,milestone=level%10===0,node=btn(earned?'✓ '+level:String(level),()=>start());node.disabled=level!==current;node.className=`campaign-node ${earned?'complete':''} ${level===current?'current':''} ${milestone?'milestone':''}`;node.style.left=`${point.x/6}%`;node.style.top=`${point.y}px`;node.setAttribute('aria-label',`Motståndare ${level}: ${name(level)}${earned?', besegrad':level===current?', spela nu':', låst'}`);
      if(milestone){const skin=skins[level/10];node.append(el('span',`${earned?'🏅':'⚑'} ${skin.name}`,'checkpoint-label'));}
      if(level===current){const marker=el('span',done===100?'MÅLET KLARAT!':'DU ÄR HÄR',`current-marker ${point.x>=300?'marker-left':'marker-right'}`);const image=avatar()?.cloneNode(true);if(image){image.removeAttribute('id');marker.prepend(image);}node.append(marker);node.id='campaign-current';}
      board.append(node);
    });show('#campaign-screen');requestAnimationFrame(()=>map.querySelector('#campaign-current').scrollIntoView({block:'center'}));
  }
  function openCollection(){
    header(collection,'Mina tärningar');collection.append(el('p','Samma fysik och chanser – välj din stil. Nya set efter var tionde besegrad motståndare.'));
    const grid=el('div','','skin-grid');collection.append(grid);const p=profile(),selected=activeSkin(p);
    for(const skin of skins){const available=p.admin||skin.level<=completedLevels(p),card=el('article','','skin-card');const preview=el('div','','skin-preview'),[ax,ay,aw,ah]=skin.atlas;preview.style.backgroundColor=skin.body;preview.style.backgroundImage=`url('${atlasUrl}')`;preview.style.backgroundSize=`${1536*100/aw}px ${1024*100/ah}px`;preview.style.backgroundPosition=`-${ax*100/aw}px -${ay*100/ah}px`;preview.style.color=skin.pips;for(const [x,y] of [[27,27],[73,27],[50,50],[27,73],[73,73]]){const dot=el('i','','skin-dot');dot.style.left=x+'%';dot.style.top=y+'%';preview.append(dot);}card.append(preview,el('h2',skin.name),el('p',p.admin&&!skin.level?'Administratör · startset':p.admin?'Administratör · tillgänglig':skin.level?`Besegra motståndare ${skin.level}`:'Ditt startset'));
      const b=btn(!available?'🔒 Låst':skin.id===selected.id?'✓ Aktiv':'Använd',async()=>{b.disabled=true;try{await select(skin.id);openCollection();}catch(e){b.disabled=false;card.append(el('p',e.message));}});b.disabled=!available||skin.id===selected.id;card.append(b);grid.append(card);
    }show('#collection-screen');
  }
  return {openMap,openCollection};
}
