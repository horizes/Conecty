self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
 let data={};try{data=event.data?.json()||{}}catch{}
 const home=new URL('painel.html',self.registration.scope);let target=home;try{const candidate=new URL(data.url);if(candidate.origin===home.origin&&candidate.pathname===home.pathname)target=candidate}catch{}
 event.waitUntil(self.registration.showNotification(data.title||'Conecty',{body:data.body||'Há um novo aviso no seu painel.',icon:new URL('icon-192.png',self.registration.scope).href,badge:new URL('icon-192.png',self.registration.scope).href,tag:data.tag||'conecty',renotify:true,requireInteraction:data.urgent===true,vibrate:data.urgent?[200,100,200]:[100],data:{url:target.href}}));
});
self.addEventListener('notificationclick',event=>{event.notification.close();const target=new URL(event.notification.data?.url||'painel.html',self.registration.scope);event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{for(const client of clients){const current=new URL(client.url);if(current.origin===target.origin&&current.pathname.startsWith(new URL(self.registration.scope).pathname)){await client.navigate(target.href);return client.focus()}}return self.clients.openWindow(target.href)}))});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
 if(request.method!=='GET'||request.mode!=='navigate'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 event.respondWith(fetch(request).catch(()=>new Response('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conecty Cliente</title><body style="font:16px Arial;background:#0f0d1d;color:#eaf6ef;padding:12vw"><h1>Conecty Cliente</h1><p>Conecte-se à internet para acessar seu painel.</p><a href="'+scope.href+'" style="color:#41d88d">Tentar novamente</a></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})));
});
