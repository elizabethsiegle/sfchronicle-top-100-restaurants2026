# SF Chronicle Top Restaurants Explorer

Interactive maps and charts for the [2026 SF Chronicle's Top 100 Bay Area restaurants](https://www.sfchronicle.com/projects/2026/top-100-best-restaurants-san-francisco-bay-area/) — covering [2024](https://www.sfchronicle.com/projects/2024/best-sf-restaurants-bay-area/), [2025](https://www.sfchronicle.com/projects/2025/top-100-best-restaurants-san-francisco-bay-area/), and, of course, 2026.

It also compares and visualizes returning and new restaurants, and shows if they moved up or down over the years. With the map, you can filter by region, price, and cuisine.

## How it started

I love Bay Area restaurants! I was curious about the restaurants and wanted a visualization besides the Chronicle's map.

I gave [Claude Code](https://claude.ai/code) a couple of prompts:

> *"scrape https://www.sfchronicle.com/projects/2026/top-100-best-restaurants-san-francisco-bay-area/ make a cool visualization of all of the top 100 restaurants. Put them on a map. Let users sort by city, neighborhood, cuisine, price. Add them to Google Maps too and add in a Yelp or Google Reviews integration. Use React."*

> *"add some data visualizations below the map like bar or pie charts detailing the percentage of restaurants that appear on the list that are a specific food type, price, and location"*

And Claude Code just... built it.

## What it does

- **Map** — all restaurants plotted with custom ranked markers, click to open a popup with description, links to Google Maps, Yelp, and Google Reviews
- **Filters** — search by name, city, region, price, or cuisine; click any chart segment to filter too
- **Charts** — interactive donut and bar charts breaking down by region, price tier, and cuisine type
- **Year-over-year comparison** — 2025 vs 2026 charts showing rank changes, new entries, and what dropped; 2024 survival tracker showing which of the top 25 made subsequent lists
- **Nearby fallback** — type a city with no listed restaurants and it shows the closest ones
- **AI chatbot** — powered by [Gradient AI](https://gradient.ai), trained on the SF Chronicle articles

## Data

Scraped from the SF Chronicle using `curl` + Python/Node — no scraping library. The 2026 page had structured JSON-LD embedded in the HTML; 2025 and 2024 data was packed inside Gatsby JS bundles.

Download the raw data for yourself:
- [restaurants-2026.json](/data/restaurants-2026.json) — 100 restaurants
- [restaurants-2025.json](/data/restaurants-2025.json) — 100 restaurants
- [restaurants-2024.json](/data/restaurants-2024.json) — 25 restaurants (fall top 25)

## Built with

- [React](https://react.dev) + [Vite](https://vitejs.dev)
- [Leaflet.js](https://leafletjs.com) for maps
- [Chart.js](https://www.chartjs.org) for charts
- [Gradient AI](https://gradient.ai) for the chatbot
- [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform) for hosting
