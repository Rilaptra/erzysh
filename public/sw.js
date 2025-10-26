// File: public/sw.js

self.addEventListener("push", (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "https://erzysh.vercel.app/api/database/1396528719002075287/1396528759082844230/1411358085611520081?raw=true&userID=881d4d54-126d-4362-8228-dd2235e90b58", // Sediakan ikon di folder public
    badge: "/badge-72x72.png", // Sediakan badge di folder public
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Aksi saat notifikasi di-klik (misal, buka halaman tugas)
  event.waitUntil(clients.openWindow("/kuliah/tugas"));
});