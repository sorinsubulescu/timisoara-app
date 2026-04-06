# Timișoara App -- Data Sources

## Maps & Geospatial
- **OpenStreetMap (OSM):** Free, open map data with excellent Timișoara coverage. Use for base map tiles, POI data, and routing.
  - Tile server: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
  - Overpass API for querying POIs in Timișoara area
  - Nominatim for geocoding/reverse geocoding
- **Mapbox** (optional upgrade): More polished tiles, turn-by-turn navigation. Free tier: 50,000 map loads/month.

## Public Transport (STPT)
- **STPT Official Site:** https://www.stpt.ro -- schedules, routes, news
- **GTFS Data:** Check for public GTFS feed (General Transit Feed Specification)
- **OpenMobilityData / Transitland:** Community-aggregated transit data, may have Timișoara STPT data
- **Manual data entry:** If no API exists, scrape/manually enter route and schedule data as seed data

## Points of Interest
- **OpenStreetMap Overpass API:** Query for restaurants, cafes, museums, churches, parks in Timișoara bounding box
  - Bounding box: approximately `45.70,21.17,45.80,21.30`
- **Google Places API** (paid, optional): Richer data, photos, reviews
- **Foursquare Places API:** Free tier available, good venue data
- **Manual curation:** For walking tours, neighborhood guides, local recommendations

## Events
- **Facebook Events API** (limited): Public events in Timișoara
- **Eventbrite API:** Some events may be listed
- **Local sources to scrape/aggregate:**
  - timisoara.citylife.ro
  - visitTimisoara.ro
  - National Theatre website
  - Opera Română din Timișoara website
- **User submissions:** Community-submitted events with moderation

## Weather
- **OpenWeatherMap API:** Free tier (1,000 calls/day)
  - Current weather: `api.openweathermap.org/data/2.5/weather?q=Timisoara,RO`
  - 7-day forecast available on free tier
- **Alternative:** Open-Meteo (completely free, no API key needed)
  - `https://api.open-meteo.com/v1/forecast?latitude=45.7489&longitude=21.2087`

## News
- **RSS Feeds:** Local news sites often provide RSS
- **Manual aggregation:** Curate sources from local media

## City/Government Data
- **Primăria Timișoara:** Check for open data portal
- **data.gov.ro:** Romanian government open data
- **Air quality:** Check for local monitoring station APIs (AQICN.org has Timișoara data)

## Seed Data Strategy
For MVP launch, pre-populate the database with:
1. ~200 curated POIs from OSM Overpass API queries
2. STPT routes and schedules (manual if no API)
3. ~50 hand-curated restaurant/cafe entries
4. Neighborhood guide content (written manually)
5. Walking tour routes (manually created with GPX data)
