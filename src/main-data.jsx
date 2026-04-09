import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DataViewer from './DataViewer';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode><DataViewer /></StrictMode>
);
