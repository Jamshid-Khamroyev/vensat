import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from "react-router-dom"
import { Toaster } from 'sonner';
import { useThemeStore } from './states/theme.state';

const ThemedToaster = () => {
  const theme = useThemeStore((s) => s.theme)
  return <Toaster position="top-center" richColors theme={theme} />
}

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <App />
      <ThemedToaster />
    </BrowserRouter>
);
