import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RESTAURANTS } from './data';
import { RESTAURANTS_2025 } from './data2025';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App
      restaurants={RESTAURANTS}
      year={2026}
      articleUrl="https://www.sfchronicle.com/projects/2026/top-100-best-restaurants-san-francisco-bay-area/"
      otherYears={[
        { year: 2025, path: '/2025.html' },
        { year: 2024, path: '/2024.html' },
      ]}
      comparisonData={RESTAURANTS_2025}
    />
  </StrictMode>
);
