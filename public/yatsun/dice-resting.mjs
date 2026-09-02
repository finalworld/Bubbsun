// Conservative screen-space footprints: physics alone does not prevent two
// separately rendered WebGL canvases from visually covering one another.
export function planRestingLayout(dice, {width, height, radius, obstacle=null}) {
  const minX=-width/2+radius, maxX=width/2-radius;
  const minY=-height/2+radius, maxY=height/2-radius;
  const distance=radius*2+4, placed=dice.filter(d=>d.held).map(d=>({...d}));
  const active=dice.filter(d=>!d.held), result=new Map(placed.map(d=>[d.id,d]));
  const inBoard=p=>p.x>=minX&&p.x<=maxX&&p.y>=minY&&p.y<=maxY;
  const outsideButton=p=>!obstacle || p.x+radius<obstacle.left || p.x-radius>obstacle.right || p.y+radius<obstacle.top || p.y-radius>obstacle.bottom;
  const grid=[];
  for(let y=minY;y<=maxY;y+=radius/2)for(let x=minX;x<=maxX;x+=radius/2)grid.push({x,y});
  const choices=active.map(d=>[...dice.filter(p=>!p.held).map(p=>({x:p.x,y:p.y})),...grid]
    .filter(p=>inBoard(p)&&outsideButton(p))
    .sort((a,b)=>Math.hypot(a.x-d.x,a.y-d.y)-Math.hypot(b.x-d.x,b.y-d.y)));
  let attempts=0;
  function place(index){
    if(index===active.length)return true;
    const die=active[index];
    for(const point of choices[index]){
      if(++attempts>50000)return false;
      if(placed.some(p=>Math.hypot(point.x-p.x,point.y-p.y)<distance))continue;
      const next={...die,...point};placed.push(next);result.set(die.id,next);
      if(place(index+1))return true;
      placed.pop();result.delete(die.id);
    }
    return false;
  }
  return place(0)?dice.map(d=>result.get(d.id)):null;
}
