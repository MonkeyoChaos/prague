/* Trip Itinerary service worker v3 (offline).
   Leaflet is inlined in index.html, so there is no external script to cache/break.
   Own files: network-first (updates always land online, cache serves offline).
   Tiles/photos/APIs: cached as viewed for offline reuse. */
var VER="v13", SHELL="itin-shell-"+VER, RUNTIME="itin-rt-"+VER;
self.addEventListener("install",function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(SHELL).then(function(c){return c.addAll(["./","./index.html"]).catch(function(){});}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){if(k!==SHELL&&k!==RUNTIME)return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener("fetch",function(e){
  var req=e.request; if(req.method!=="GET")return;
  var url; try{url=new URL(req.url);}catch(_){return;}
  if(req.mode==="navigate" || url.origin===location.origin){
    e.respondWith(fetch(req).then(function(r){var cp=r.clone();caches.open(SHELL).then(function(c){c.put(req,cp);});return r;})
      .catch(function(){return caches.match(req).then(function(m){return m||caches.match("./index.html");});}));
    return;
  }
  e.respondWith(caches.open(RUNTIME).then(function(cache){
    return cache.match(req).then(function(cached){
      var net=fetch(req).then(function(r){if(r&&(r.ok||r.type==="opaque"))cache.put(req,r.clone());return r;}).catch(function(){return cached;});
      return cached||net;
    });
  }));
});
