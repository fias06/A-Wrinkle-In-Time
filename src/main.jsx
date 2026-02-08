// --- ADD THESE POLYFILLS AT THE VERY TOP ---
import { Buffer } from 'buffer';
import process from 'process';

// Force these into the global window object so simple-peer can find them
window.global = window;
window.process = process;
window.Buffer = Buffer;
// -------------------------------------------

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)