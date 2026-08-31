import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { registerServiceWorker, checkInstallPrompt } from '@/lib/pwa-register'

// Register service worker for PWA
registerServiceWorker()
checkInstallPrompt()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)