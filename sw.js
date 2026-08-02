/* Kill-switch service worker.
   Replaces the previous caching worker: it removes itself and deletes all
   caches so no stale files are ever served again. */
self.addEventListener("install", function(e){ self.skipWaiting(); });
self.addEventListener("activate", function(e){
  e.waitUntil((async function(){
    try{
      var keys = await caches.keys();
      await Promise.all(keys.map(function(k){ return caches.delete(k); }));
    }catch(_){}
    try{ await self.registration.unregister(); }catch(_){}
    try{
      var clients = await self.clients.matchAll({type:"window"});
      clients.forEach(function(c){ try{ c.navigate(c.url); }catch(_){} });
    }catch(_){}
  })());
});
self.addEventListener("fetch", function(e){ /* pass through to network */ });
