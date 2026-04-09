import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RESTAURANTS_2024 } from './data2024';
import { RESTAURANTS_2025 } from './data2025';
import { RESTAURANTS } from './data';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App
      restaurants={RESTAURANTS_2024}
      year={2024}
      articleUrl="https://www.sfchronicle.com/projects/2024/best-sf-restaurants-bay-area/"
      otherYears={[
        { year: 2026, path: '/index.html' },
        { year: 2025, path: '/2025.html' },
      ]}
      survivalData={[
        { year: 2025, data: RESTAURANTS_2025 },
        { year: 2026, data: RESTAURANTS },
      ]}
    />
  </StrictMode>
);
