export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js', { scope: '/' }).catch(() => {
        // Service worker registration failed, but app still works
      });
    });
  }
}

export function checkInstallPrompt() {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Show install button/prompt if needed
    window.dispatchEvent(new CustomEvent('pwa-install-ready', { detail: { prompt: deferredPrompt } }));
  });

  window.addEventListener('appinstalled', () => {
    // PWA was installed
    deferredPrompt = null;
  });

  return deferredPrompt;
}

export function getInstallPrompt() {
  return new Promise((resolve) => {
    const handlePrompt = (e) => {
      resolve(e.detail?.prompt);
      window.removeEventListener('pwa-install-ready', handlePrompt);
    };
    window.addEventListener('pwa-install-ready', handlePrompt);
    // Timeout after 3s if no prompt
    setTimeout(() => {
      window.removeEventListener('pwa-install-ready', handlePrompt);
      resolve(null);
    }, 3000);
  });
}