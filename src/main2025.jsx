import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RESTAURANTS_2025 } from './data2025';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App
      restaurants={RESTAURANTS_2025}
      year={2025}
      articleUrl="https://www.sfchronicle.com/projects/2025/top-100-best-restaurants-san-francisco-bay-area/"
      otherYears={[
        { year: 2026, path: '/index.html' },
        { year: 2024, path: '/2024.html' },
      ]}
    />
  </StrictMode>
);
