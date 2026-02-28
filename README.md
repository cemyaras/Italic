# Italic Travel Itinerary 🇮🇹🇧🇬

A gorgeous, responsive, completely static web application designed to act as a sleek digital itinerary for a multi-city trip to Italy (Rome, Florence, Venice) with layovers in Sofia, Bulgaria.

## ✨ Features

- **Premium Dark Theme:** A stunning dark mode aesthetic (`bg-[#0A1128]`) with smooth gradients, glassmorphism cards, and animated waves that feel premium and modern.
- **Dynamic Route Map:** Interactive Leaflet.js map showing the flight paths (Istanbul -> Sofia -> Rome / Venice -> Sofia -> Istanbul) and the train routes within Italy.
- **Countdown Timer:** A lively real-time countdown to the departure flight.
- **Detailed City Pages:** Separate views for each city (`city.html`) that load specific context dynamically, including:
  - Transport logistics (Flights / Trains)
  - Detailed daily itineraries
  - Accommodation cards with images and smart Google Maps routing buttons
- **AI Travel Assistant widget:** Built-in floating chat widget (`chat.js`) that uses the OpenRouter API (`arcee-ai/trinity-large-preview:free` model) to answer travel questions. The UI natively renders Markdown from the LLM, supports streaming-like interactions, and uses `localStorage` to securely store your API key.
- **100% Client-Side:** Written purely in HTML, Vanilla JS, and TailwindCSS (via CDN). Data is loaded via fetch from `data.json`. No build step or backend required!

## 🚀 How to Run

Because the app fetches `data.json` via JavaScript, you must serve it over a local web server (opening `index.html` directly from the file system `file://` will cause CORS restrictions on the JSON file).

1. Open your terminal in the project directory.
2. Start a simple Python HTTP server:

```bash
python3 -m http.server 8080
```

3. Open your browser and navigate to: [http://localhost:8080](http://localhost:8080)

## 📁 Project Structure

- `index.html`: The main dashboard containing the animated hero, map, city cards, accommodation summaries, and highlights arrays.
- `city.html`: The dynamic template for viewing deep-dives into a specific city (loaded via URL parameter `?id=roma`, `?id=floransa`, etc.).
- `app.js`: The core Vanilla JavaScript file handling data fetching, countdown timers, map rendering, and DOM manipulation.
- `chat.js`: The AI assistant logic. Handles the UI for the floating action button, the chat history, Markdown parsing, and fetch calls to OpenRouter.
- `data.json`: The "database" of the application. Contains all flights, train references, city content, accommodation links, itineraries, and highlight arrays.

## 🤖 AI Assistant Usage

When you open the site, look for the floating blue/purple action button at the bottom right.
1. Click the toggle to open the chat panel.
2. The UI will request your OpenRouter API key.
3. Once entered, the key is saved safely in your browser's `localStorage` (`openrouter_api_key`). 
4. Ask anything about your itinerary in Italy or layovers in Sofia! The Assistant is instructed to act as a knowledgeable historian and provide helpful, concise advice in Turkish.

## 🛠 Built With

- **HTML5 & Vanilla JS**
- **Tailwind CSS (via CDN)** for fast, utility-first styling.
- **Leaflet.js** for interactive maps.
- **OpenRouter API** for the LLM integration.
