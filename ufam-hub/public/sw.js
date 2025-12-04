self.addEventListener("install", (event) => {
  console.log("Service Worker instalado");
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  console.log("Service Worker ativado");
  event.waitUntil(self.clients.claim());
});
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
self.addEventListener("push", (event) => {
  console.log("Push recebido:", event);
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Nova notificação", body: event.data.text() };
    }
  }
  const options = {
    title: data.title || "UFAM Hub",
    body: data.body || "Você tem uma nova notificação",
    icon: data.icon || "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.tag || "default",
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };
  event.waitUntil(self.registration.showNotification(options.title, options));
});
self.addEventListener("notificationclick", (event) => {
  console.log("Notificação clicada:", event);
  event.notification.close();
  const data = event.notification.data;
  const url = data?.url || "/";
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});