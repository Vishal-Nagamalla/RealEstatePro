# RealEstatePro | Srikar Palepu — Modern Prototype

Next.js (App Router) + React-Bootstrap + Framer Motion with a modern hero map.
- Google Maps **dark theme** when API key present
- Leaflet + OpenStreetMap fallback (no key required) with mood filter
- Click-to-activate map to prevent scroll hijack
- Geometric background accents, polished cards

## Run
```
npm install
npm run dev
```
Open http://localhost:3000

## Google Maps (optional)
Create `.env.local` with:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY
```

## Next up
Admin dashboard + Postgres schema + one-time Zillow import.
