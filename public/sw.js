// ================================================
// FILE: public/sw.js
// ================================================
// File: public/sw.js

self.addEventListener("push", (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    // Path ini akan me-load `icon-192x192.png` dari folder public
    icon: "/icon-192x192.png", 
    // Path ini akan me-load `badge-72x72.png` dari folder public
    badge: "/badge-72x72.png", 
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Aksi saat notifikasi di-klik (misal, buka halaman tugas)
  event.waitUntil(clients.openWindow("/kuliah/tugas"));
});