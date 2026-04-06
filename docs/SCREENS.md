# Timișoara App -- Screen Designs

## Navigation Structure

### Bottom Tab Navigation (Mobile) / Top Nav (Web)
1. **Explore** (map icon) -- Interactive map + POI browsing
2. **Events** (calendar icon) -- Events calendar and list
3. **Transit** (bus icon) -- Public transport routes and planner
4. **Dining** (fork-knife icon) -- Restaurant/cafe directory
5. **Profile** (user icon) -- Account, favorites, settings

---

## Screen Wireframes

### 1. Home / Explore Screen
```
┌─────────────────────────────┐
│  🔍 Search Timișoara...     │
├─────────────────────────────┤
│                             │
│     ┌─────────────────┐     │
│     │                 │     │
│     │   INTERACTIVE   │     │
│     │      MAP        │     │
│     │   (Timișoara)   │     │
│     │                 │     │
│     │  📍 📍   📍     │     │
│     │     📍  📍      │     │
│     │                 │     │
│     └─────────────────┘     │
│                             │
│ Category Pills:             │
│ [All] [Landmarks] [Museums] │
│ [Parks] [Restaurants] [Bars]│
├─────────────────────────────┤
│ Nearby Places               │
│ ┌─────┐ ┌─────┐ ┌─────┐   │
│ │ img │ │ img │ │ img │    │
│ │name │ │name │ │name │    │
│ │dist │ │dist │ │dist │    │
│ └─────┘ └─────┘ └─────┘   │
├─────────────────────────────┤
│ 🗺️  📅  🚌  🍽️  👤       │
│ Explore Events Transit Dine │
└─────────────────────────────┘
```

### 2. POI Detail Sheet (Bottom Sheet / Page)
```
┌─────────────────────────────┐
│ ← Back                      │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │     HERO IMAGE          │ │
│ └─────────────────────────┘ │
│                             │
│ Catedrala Mitropolitană     │
│ ⭐ 4.8  ·  Landmark         │
│ 📍 Piața Victoriei, Cetate  │
│                             │
│ 🕐 Open · Closes at 20:00  │
│ 📞 +40 256 123 456         │
│ 🌐 website.ro              │
│                             │
│ ─────────────────────────── │
│ Description text about the  │
│ cathedral and its history...│
│                             │
│ [♡ Save]  [🗺️ Directions]  │
│  [📤 Share]                 │
└─────────────────────────────┘
```

### 3. Events List Screen
```
┌─────────────────────────────┐
│ Events in Timișoara         │
│ 🔍 Search events...        │
├─────────────────────────────┤
│ [This Week ▼]  [All ▼]     │
│                             │
│ Category Pills:             │
│ [All] [Music] [Theater]    │
│ [Art] [Sports] [Free]      │
├─────────────────────────────┤
│ TODAY · March 30            │
│ ┌─────────────────────────┐│
│ │ 🎵 Jazz TM Festival     ││
│ │ 19:00 · Filarmonica     ││
│ │ Free                  ♡ ││
│ └─────────────────────────┘│
│ ┌─────────────────────────┐│
│ │ 🎭 Hamlet              ││
│ │ 20:00 · Teatrul Național││
│ │ from 30 RON           ♡ ││
│ └─────────────────────────┘│
│                             │
│ TOMORROW · March 31         │
│ ┌─────────────────────────┐│
│ │ 🎨 Art Exhibition       ││
│ │ 10:00 · Muzeul de Artă  ││
│ │ 15 RON                ♡ ││
│ └─────────────────────────┘│
├─────────────────────────────┤
│ 🗺️  📅  🚌  🍽️  👤       │
└─────────────────────────────┘
```

### 4. Transit Screen
```
┌─────────────────────────────┐
│ Public Transport            │
├─────────────────────────────┤
│ [🚋 Trams] [🚌 Buses]      │
│ [🚎 Trolley]               │
├─────────────────────────────┤
│ Route Planner               │
│ ┌─────────────────────────┐│
│ │ 📍 From: Current loc.   ││
│ │ 📍 To:   Search...      ││
│ │        [Find Route]      ││
│ └─────────────────────────┘│
├─────────────────────────────┤
│ Tram Lines                  │
│ ┌──┬──────────────────────┐│
│ │ 1│ Cimitirul Eroilor ↔  ││
│ │  │ Gara de Nord         ││
│ ├──┼──────────────────────┤│
│ │ 2│ Piața Libertății ↔   ││
│ │  │ Calea Buziașului     ││
│ ├──┼──────────────────────┤│
│ │ 4│ Piața Mărăști ↔      ││
│ │  │ Calea Torontalului   ││
│ └──┴──────────────────────┘│
├─────────────────────────────┤
│ 🗺️  📅  🚌  🍽️  👤       │
└─────────────────────────────┘
```

### 5. Dining Screen
```
┌─────────────────────────────┐
│ Restaurants & Cafes         │
│ 🔍 Search dining...        │
├─────────────────────────────┤
│ [Open Now] [Near Me]        │
│ [Romanian] [International]  │
│ [Cafes] [Bars] [Vegan]     │
├─────────────────────────────┤
│ ┌─────────────────────────┐│
│ │ 🖼️  Restaurant Name     ││
│ │      ⭐ 4.6 · Romanian  ││
│ │      📍 500m · $$ · Open││
│ └─────────────────────────┘│
│ ┌─────────────────────────┐│
│ │ 🖼️  Cafe Name           ││
│ │      ⭐ 4.8 · Coffee    ││
│ │      📍 1.2km · $ · Open││
│ └─────────────────────────┘│
├─────────────────────────────┤
│ 🗺️  📅  🚌  🍽️  👤       │
└─────────────────────────────┘
```

### 6. Profile Screen
```
┌─────────────────────────────┐
│ Profile                     │
├─────────────────────────────┤
│      👤                     │
│   John Doe                  │
│   Tourist Mode 🌍           │
│   [Switch to Local Mode]    │
├─────────────────────────────┤
│ ♡ Saved Places (12)      → │
│ 📅 Saved Events (5)      → │
│ 🗺️ My Walking Tours (2)  → │
├─────────────────────────────┤
│ Settings                    │
│ 🌐 Language: English     → │
│ 🌙 Dark Mode          [●] │
│ 🔔 Notifications      [●] │
│ 📍 Location Services   [●] │
├─────────────────────────────┤
│ About Timișoara App       → │
│ Privacy Policy            → │
│ [Sign Out]                  │
├─────────────────────────────┤
│ 🗺️  📅  🚌  🍽️  👤       │
└─────────────────────────────┘
```

## Design Principles
- **Color palette:** Inspired by Timișoara -- warm terracotta, emerald green accents, cream backgrounds
- **Typography:** Clean, modern sans-serif (Inter or similar)
- **Card-based UI:** Content presented in rounded cards with subtle shadows
- **Map-first:** The map is the primary navigation tool on the Explore tab
- **Accessibility:** High contrast, large touch targets, screen reader support
- **Responsive:** Adapts from mobile (375px) to desktop (1440px+)
