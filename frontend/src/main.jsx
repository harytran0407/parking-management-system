import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google';
const clientId = "883510670412 - 5jpos3ljacu8kmlm8r0lgibirniruub3.apps.googleusercontent.com";
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>

    <GoogleOAuthProvider clientId={clientId}>
      <App />
      
    </GoogleOAuthProvider>
    
  </React.StrictMode>,
  
)
