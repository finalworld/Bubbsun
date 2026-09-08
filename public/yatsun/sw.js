const CACHE='yatsun-app-v3';
const SHELL=[
  '/yatsun/',
  '/yatsun/index.html',
  '/yatsun/styles.css?v=mobile-layout76',
  '/yatsun/social.css?v=20260903a',
  '/yatsun/progression.css?v=mp-spacing18',
  '/yatsun/app.js?v=mobile-layout62',
  '/yatsun/pwa.mjs?v=1',
  '/yatsun/manifest.webmanifest?v=1',
  '/yatsun/yatsun-logo.png?v=2',
  '/yatsun/app-icon-192.png?v=1',
  '/yatsun/app-icon-512.png?v=1'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.all(SHELL.map(async url=>{
      try{
        const response=await fetch(url,{cache:'reload'});
        if(response.ok)await cache.put(url,response);
      }catch{}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('yatsun-app-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin===self.location.origin&&url.pathname.startsWith('/yatsun/api/'))return;

  event.respondWith((async()=>{
    try{
      const response=await fetch(request);
      if(response.ok||response.type==='opaque'){
        const cache=await caches.open(CACHE);
        await cache.put(request,response.clone());
      }
      return response;
    }catch{
      return (await caches.match(request))||(request.mode==='navigate'&&await caches.match('/yatsun/'))||Response.error();
    }
  })());
});
