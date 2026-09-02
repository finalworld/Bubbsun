export function createSocial({user, name, applyRoom, leaveRoom, login, canEnter=()=>true,show=()=>{}}) {
  let member=null, current=null, rooms=[], pending=false, epoch=0, refreshing=null;
  const dialog=document.createElement('dialog');dialog.className='social-dialog';document.body.append(dialog);
  const title=document.createElement('h2'),error=document.createElement('p');let content=document.createElement('div');error.setAttribute('role','status');
  const mpHome=document.createElement('section'),mpJoin=document.createElement('section');mpHome.id='mp-home-screen';mpJoin.id='mp-join-screen';mpHome.className=mpJoin.className='mp-page hidden';(document.querySelector('main')||document.body).append(mpHome,mpJoin);
  function renderInto(root,fn){const previous=content;content=root;try{fn();}finally{content=previous;}}
  function pageHeading(root,label){root.replaceChildren();root.append(button('← Tillbaka',()=>show('#mode-screen')));const h=document.createElement('h1');h.textContent=label;root.append(h);const status=document.createElement('p');status.setAttribute('role','status');root.append(status);}
  const close=document.createElement('button');close.textContent='×';close.className='social-close';close.setAttribute('aria-label','Stäng');close.onclick=()=>dialog.close();dialog.append(close,title,content,error);
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  let view='friends';
  dialog.addEventListener('close',()=>{if(view==='friends'||view==='add'){if(!mpHome.classList.contains('hidden'))view='mpHome';else if(!mpJoin.classList.contains('hidden'))view='lobby';}});
  async function api(action,data={}){const account=user();if(!account)throw new Error('Logga in för att spela med vänner.');const token=await account.getIdToken();const response=await fetch('./api/',{method:'POST',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action,...data})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Servern svarar inte. Försök igen.');return result;}
  function message(text){error.textContent=text;for(const page of [mpHome,mpJoin]){const status=page.querySelector('[role=status]');if(status)status.textContent=text;}}
  function button(text,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=async()=>{b.disabled=true;message('');try{await action();}catch(e){message(e.message);}finally{b.disabled=false;}};return b;}
  function line(label,actions=[]){const row=document.createElement('div');row.className='social-row';const text=document.createElement('span');text.textContent=label;row.append(text,...actions);content.append(row);}
  function heading(text){const h=document.createElement('h3');h.textContent=text;content.append(h);if(text==='Matcher'&&current)content.append(button('Lämna rummet – matchen sparas',()=>{leave();dialog.close();}));}
  function enter(room){if(!canEnter())throw new Error('Vänta tills det pågående kastet eller datordraget är klart.');current=room;dialog.close();applyRoom(room,true);}
  async function refresh(){
    if(refreshing)return refreshing;if(!user())return;
    const generation=epoch;
    refreshing=(async()=>{
      if(!member){const result=await api('social_register',{name:name()});if(generation!==epoch)return;member=result.member;}
      const data=await api('social_list');if(generation!==epoch)return;rooms=data.rooms;
      if(current){const id=current.id,latest=rooms.find(r=>r.id===id)||(await api('room_get',{id})).room;
        if(generation!==epoch)return;
        if(current?.id===id&&latest.revision>current.revision){current={...current,...latest};applyRoom(current,false,pending);}
      }
      if(dialog.open&&view==='friends')renderFriends(data.friends);
      if(view==='mpHome'&&!mpHome.classList.contains('hidden'))renderHome(data.openTables||[]);
      if(view==='lobby'&&!mpJoin.classList.contains('hidden')){
        const lobby=await api('room_lobby');
        if(generation!==epoch)return;
        if(view==='lobby'&&!mpJoin.classList.contains('hidden'))renderInto(mpJoin,()=>renderLobby(lobby.tables));
      }
      if(error.textContent==='Hämtar…')message('');
      document.querySelector('#friends-button').classList.toggle('has-updates',data.friends.some(f=>f.status==='pending'&&f.sender!==user().uid)||rooms.some(r=>r.status==='pending'&&r.b===user().uid||r.status==='active'&&r.state.turn===user().uid));
    })();
    try{return await refreshing;}finally{refreshing=null;}
  }
  function renderFriends(friends){content.replaceChildren();heading('Matcher');if(!rooms.length)line('Utmana en vän för att starta en match.');for(const room of rooms){const incoming=room.status==='pending'&&room.b===user().uid;const status=room.status==='done'?'Klar':room.status==='pending'?'Väntar på svar':room.state.turn===user().uid?'Din tur':'Vännens tur';const actions=incoming?[button('Acceptera',async()=>{const r=(await api('room_accept',{id:room.id,revision:room.revision})).room;enter({...r,otherName:room.otherName});}),button('Avböj',async()=>{await api('room_decline',{id:room.id,revision:room.revision});await refresh();})]:room.status==='pending'?[]:[button('Öppna',()=>enter(room))];line(`${room.otherName} · ${status}`,actions);}heading('Vänner');if(!friends.length)line('Inga vänner ännu. Lägg till med namn eller medlemskod.');for(const friend of friends){const accepted=friend.status==='accepted';const actions=accepted?[button('Utmana',async()=>{const r=(await api('room_invite',{uid:friend.uid})).room;if(r.status==='active')enter({...r,otherName:friend.name});else await refresh();})]:friend.sender!==user().uid?[button('Godkänn',async()=>{await api('friend_accept',{uid:friend.uid});await refresh();})]:[];actions.push(button(accepted?'Ta bort':'Avböj / ångra',async()=>{await api('friend_remove',{uid:friend.uid});await refresh();}));line(`${friend.name} · ${accepted?(Date.now()-Number(friend.seen_at)<20000?'Online':'Offline'):'Förfrågan'}`,actions);}content.append(button('Lägg till vänner',()=>open('add')));}
  async function open(next='friends'){if(!user()){login();return;}view=next;title.textContent=next==='friends'?'Vänner & matcher':'Lägg till vänner';content.replaceChildren();message('Hämtar…');if(!dialog.open)dialog.showModal();try{await refresh();if(next==='add'&&view==='add'){content.replaceChildren();line(`Din medlemskod: ${member.code}`,[button('Kopiera',()=>navigator.clipboard.writeText(member.code))]);const form=document.createElement('form'),input=document.createElement('input'),submit=document.createElement('button');input.placeholder='Namn eller medlemskod';input.setAttribute('aria-label','Sök medlem');input.required=true;input.minLength=2;submit.textContent='Sök';form.append(input,submit);content.append(form);const results=document.createElement('div');content.append(results);form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;try{const data=await api('social_search',{query:input.value});results.replaceChildren();for(const m of data.members){const row=document.createElement('div');row.className='social-row';const label=document.createElement('span');label.textContent=m.name;row.append(label,button('Lägg till',async()=>{await api('friend_request',{uid:m.uid});message('Vänförfrågan skickad.');}));results.append(row);}if(!data.members.length)results.textContent='Ingen träff. Medlemmen behöver ha öppnat Yatsun inloggad först.';}catch(e){message(e.message);}finally{submit.disabled=false;}};}}catch(e){message(e.message);}}
  async function move(action,data){
    if(pending||!current)return;
    pending=true;const id=current.id,generation=epoch;applyRoom(current,false,true);
    try{
      const room=(await api(action,{id,revision:current.revision,...data})).room;
      if(current?.id!==id||epoch!==generation)return;
      if(room.revision>=current.revision)current={...current,...room};
    }catch(e){
      if(current?.id!==id||epoch!==generation)return;
      message(e.name==='TimeoutError'?'Anslutningen tog för lång tid. Hämta matchen igen innan du fortsätter.':e.message);
      if(!dialog.open){view='error';title.textContent='Draget kunde inte bekräftas';content.replaceChildren(button('Försök hämta matchen igen',async()=>{await refresh();dialog.close();}));dialog.showModal();}
      await refresh().catch(()=>{});
    }finally{
      pending=false;
      // Reconcile local hold selections even when the server rejected a move.
      if(current?.id===id&&epoch===generation)applyRoom(current,false,false,true);
    }
  }
  function leave(){current=null;leaveRoom();}
  async function openLobby(){
    if(!user()){login();return;}
    view='mpHome';dialog.close();pageHeading(mpHome,'Multiplayer');show('#mp-home-screen');message('Hämtar…');
    try{await refresh();}catch(e){message(e.message);}
  }
  async function openJoin(){view='lobby';pageHeading(mpJoin,'Join – lediga bord');show('#mp-join-screen');message('Hämtar…');try{await refresh();}catch(e){message(e.message);}}
  function renderHome(openTables){renderInto(mpHome,()=>{
    pageHeading(mpHome,'Multiplayer');const actions=document.createElement('div');actions.className='mp-actions';actions.append(button('Host – skapa spel',async()=>{await api('room_host');await refresh();}),button('Join – hitta spel',openJoin));mpHome.append(actions);
    heading('Dina pågående spel');
    for(const table of openTables)line('Ditt öppna bord · väntar på spelare',[button('Stäng bord',async()=>{await api('room_cancel_open',{id:table.id});await refresh();})]);
    const active=rooms.filter(r=>r.status==='active');if(!active.length&&!openTables.length)line('Inga pågående spel ännu. Välj Host eller Join.');
    for(const room of active)line(`${room.otherName} · ${room.state.turn===user().uid?'Din tur':'Motståndarens tur'}`,[button('Fortsätt',()=>enter(room))]);
    mpHome.append(button('Vänner & inbjudningar',()=>open()));
  });}
  function renderLobby(tables){
    pageHeading(mpJoin,'Join – lediga bord');mpJoin.append(button('← Multiplayer',openLobby));
    heading('Lediga bord');
    if(!tables.length)line('Inga lediga bord just nu. Skapa det första!');
    for(const table of tables){
      const mine=table.hostUid===user().uid;
      line(`${table.hostName} · 1 av 2 spelare`,[mine?button('Stäng bord',async()=>{await api('room_cancel_open',{id:table.id});await refresh();}):button('Anslut',async()=>{
        if(!canEnter())throw new Error('Vänta tills ditt pågående kast eller datordrag är klart.');
        try{const result=await api('room_join',{id:table.id});enter(result.room);}catch(e){await refresh();throw e;}
      })]);
    }
    content.append(button('Uppdatera listan',refresh));
  }
  setInterval(()=>{if(!document.hidden)refresh().catch(e=>message(e.message));},3000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh().catch(e=>message(e.message));});
  return {get active(){return Boolean(current);},open,lobby:openLobby,leave,hold:held=>move('room_hold',{held}),reaction:reaction=>move('room_reaction',{reaction}),roll:held=>move('room_roll',{held}),score:category=>move('room_score',{category}),authChanged(){epoch++;member=null;if(current)leave();refresh().catch(e=>message(e.message));}};
}
