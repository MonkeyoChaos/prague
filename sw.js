/* Trip Itinerary service worker */
var SHELL="itinerary-shell-v2";
var RUNTIME="itinerary-runtime-v2";
var PRECACHE=[
  "./","./index.html",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
];
self.addEventListener("install",function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(SHELL).then(function(c){
    return Promise.all(PRECACHE.map(function(u){
      return fetch(u).then(function(r){return c.put(u,r);}).catch(function(){});
    }));
  }));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){if(k!==SHELL&&k!==RUNTIME)return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener("fetch",function(e){
  var req=e.request;
  if(req.method!=="GET")return;
  var url=new URL(req.url);
  // navigations -> serve app shell (offline-friendly SPA)
  if(req.mode==="navigate"){
    e.respondWith(fetch(req).catch(function(){return caches.match("./index.html").then(function(r){return r||caches.match("./");});}));
    return;
  }
  // leaflet shell -> cache first
  if(url.href.indexOf("unpkg.com/leaflet")>-1){
    e.respondWith(caches.match(req).then(function(c){return c||fetch(req).then(function(r){var cp=r.clone();caches.open(SHELL).then(function(ch){ch.put(req,cp);});return r;});}));
    return;
  }
  // tiles, wikimedia photos, wiki/nominatim APIs -> stale-while-revalidate into runtime cache
  var runtime=/tile\.openstreetmap|upload\.wikimedia|wikipedia\.org|nominatim\.openstreetmap/.test(url.href);
  if(runtime){
    e.respondWith(caches.open(RUNTIME).then(function(cache){
      return cache.match(req).then(function(cached){
        var net=fetch(req).then(function(r){ if(r && (r.ok||r.type==="opaque")) cache.put(req,r.clone()); return r; }).catch(function(){return cached;});
        return cached||net;
      });
    }));
    return;
  }
  // default: network, fall back to any cache
  e.respondWith(fetch(req).catch(function(){return caches.match(req);}));
});
