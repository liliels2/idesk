/* estdesk service worker
   Bump CACHE whenever the shell changes so old caches get dropped. */
var CACHE = "estdesk-v1";

var SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./favicon.ico"
];

/* Auth and calendar traffic must never be served from cache. */
var NEVER_CACHE = [
  "accounts.google.com",
  "www.googleapis.com",
  "apis.google.com"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(SHELL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.map(function(k){
          return k === CACHE ? null : caches.delete(k);
        }));
      })
      .then(function(){ return self.clients.claim(); })
  );
});

function isNeverCache(url){
  for(var i=0;i<NEVER_CACHE.length;i++){
    if(url.hostname === NEVER_CACHE[i]) return true;
  }
  return false;
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;

  var url;
  try{ url = new URL(req.url); }catch(err){ return; }
  if(url.protocol !== "http:" && url.protocol !== "https:") return;
  if(isNeverCache(url)) return;

  var sameOrigin = url.origin === self.location.origin;

  if(sameOrigin){
    /* Network first: the dashboard is edited often, so freshness wins.
       The cache is the offline fallback, not the primary source. */
    e.respondWith(
      fetch(req)
        .then(function(res){
          if(res && res.ok){
            var copy = res.clone();
            caches.open(CACHE).then(function(c){ c.put(req, copy); });
          }
          return res;
        })
        .catch(function(){
          return caches.match(req).then(function(hit){
            if(hit) return hit;
            if(req.mode === "navigate") return caches.match("./index.html");
            return Response.error();
          });
        })
    );
    return;
  }

  /* Third-party fonts are versioned URLs, so cache first is safe. */
  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        if(res && (res.ok || res.type === "opaque")){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
