// public/sw.js

self.addEventListener("push", (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/icon-192x192.png", // Sediakan ikon di folder public
    badge: "/badge-72x72.png", // Sediakan badge di folder public
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Aksi saat notifikasi di-klik (misal, buka halaman tugas)
  event.waitUntil(clients.openWindow("/kuliah/tugas"));
});
