const C='healthsync-v2-6';
const A=['./','index.html','styles.css','app.js','manifest.webmanifest','assets/exercise_slow_walk.png','assets/exercise_brisk_walk.png','assets/exercise_side_crunch.png','assets/icon-192.png','assets/icon-512.png','assets/side-crunch.gif'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A).catch(()=>{}))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
