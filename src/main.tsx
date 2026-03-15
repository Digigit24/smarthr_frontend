import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@/components/ui/theme-provider'
import App from './App'
import './globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" enableSystem={false} storageKey="celiyo-theme" attribute="class">
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
