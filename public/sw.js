self.addEventListener('install', () => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(clients.claim());
});

// Remove fetch handler to avoid no-op overhead
