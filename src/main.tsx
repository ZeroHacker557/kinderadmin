import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="system" storageKey="kinderadmin-theme">
    <App />
  </ThemeProvider>,
)
