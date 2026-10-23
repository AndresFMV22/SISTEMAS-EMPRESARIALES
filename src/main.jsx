import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Aplicacion from './App.jsx'
import { ProveedorIdioma } from './lib/i18n.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProveedorIdioma>
      <Aplicacion />
    </ProveedorIdioma>
  </StrictMode>,
)
