const CACHE='ppl-training-library-v2';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['./','./index.html','./manifest.webmanifest'])));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  const nav=req.mode==='navigate';
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{
    // Only pages may be HTML. A server that answers an unknown image/script URL with index.html (SPA fallback) must not get cached as that asset.
    if(response.ok&&(nav||!(response.headers.get('content-type')||'').includes('text/html'))){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}
    return response;
  }).catch(()=>nav?caches.match('./index.html'):Response.error())));
});
