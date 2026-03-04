import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import DataLoader from './components/DataLoader';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DataLoader>
        <App />
      </DataLoader>
    </BrowserRouter>
  </StrictMode>
);
