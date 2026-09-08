const installButton=document.querySelector('#install-app');
const installHelp=document.querySelector('#install-help');
const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const appleMobile=/iphone|ipad|ipod/i.test(navigator.userAgent);
let installPrompt=null;

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(error=>console.warn('Yatsun kunde inte aktivera offlineläget',error)));
}

function hideInstaller(){
  installButton?.classList.add('hidden');
  installHelp?.classList.add('hidden');
}

if(!standalone&&appleMobile&&installButton){
  installButton.classList.remove('hidden');
  installButton.textContent='＋ LÄGG TILL PÅ HEMSKÄRMEN';
}

window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  installPrompt=event;
  installButton?.classList.remove('hidden');
});

installButton?.addEventListener('click',async()=>{
  if(installPrompt){
    await installPrompt.prompt();
    const choice=await installPrompt.userChoice;
    if(choice.outcome==='accepted')hideInstaller();
    installPrompt=null;
    return;
  }
  if(appleMobile&&installHelp){
    installHelp.textContent='Tryck på Dela-knappen i Safari och välj ”Lägg till på hemskärmen”.';
    installHelp.classList.remove('hidden');
  }
});

window.addEventListener('appinstalled',hideInstaller);
