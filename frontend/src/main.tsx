import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './modules/app/App'
import { RpcActivityProvider } from './context/RpcActivityContext'
import './styles.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RpcActivityProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </RpcActivityProvider>
  </React.StrictMode>
);