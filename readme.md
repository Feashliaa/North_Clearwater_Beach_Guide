# North Clearwater Beach — Interactive Visitor's Guide

An interactive, mobile-friendly map guide for visitors to North Clearwater Beach, FL. Built as a reusable template — swap out the config and POI data to deploy for any location.

**[View Live Demo →](https://feashliaa.github.io/North_Clearwater_Beach_Guide/)**

---

## Features

- Interactive map with custom category markers
- Satellite / street view toggle
- GPS location tracking with out-of-bounds detection
- Distance-sorted list view
- Bottom drawer with place details and directions
- Category filter pills
- Fully mobile responsive

---

## Setup

```bash
git clone https://github.com/feashliaa/North_Clearwater_Beach_Guide.git
cd North_Clearwater_Beach_Guide
```

No build step required. Open `index.html` in a browser or serve with any static host (GitHub Pages, Netlify, etc.).

---

## Making Your Own Version

The app is data-driven. To deploy for a different location, you only need to edit two files:

### `config.json`

```json
{
    "title": "Your Location Name",
    "subtitle": "✦ Interactive Visitor's Guide ✦",
    "center": [LAT, LNG],
    "bounds": {
        "sw": [LAT, LNG],
        "ne": [LAT, LNG]
    },
    "poisFile": "pois.json"
}
```

| Field       | Description                                     |
| ----------- | ----------------------------------------------- |
| `title`     | Displayed in the top bar                        |
| `subtitle`  | Displayed below the title                       |
| `center`    | `[lat, lng]` — where the map loads              |
| `bounds.sw` | `[lat, lng]` — southwest corner of map boundary |
| `bounds.ne` | `[lat, lng]` — northeast corner of map boundary |

### `pois.json`

Array of place objects:

```json
[
    {
        "id": 1,
        "name": "Place Name",
        "category": "dining",
        "lat": 27.983,
        "lng": -82.827,
        "address": "123 Example St, City, FL",
        "description": "Short description of the place.",
        "link": "https://example.com",
        "linkLabel": "Visit Website"
    }
]
```

| Field         | Required | Description                             |
| ------------- | -------- | --------------------------------------- |
| `id`          | Yes      | Unique integer                          |
| `name`        | Yes      | Display name                            |
| `category`    | Yes      | See categories below                    |
| `lat` / `lng` | Yes      | Coordinates                             |
| `address`     | Yes      | Display address                         |
| `description` | Yes      | Short description shown in drawer       |
| `link`        | No       | Optional URL for a CTA button           |
| `linkLabel`   | No       | Button label (defaults to "Learn More") |

**Available categories:** `dining` · `attractions` · `nature` · `shopping` · `nightlife` · `services` · `hotels`

---

## Project Structure

```
├── index.html
├── app.js
├── styles.css
├── config.json
├── pois.json
├── favicon.ico
└── LICENSE
```

---

## License

MIT License — Copyright (c) 2026 Riley Dorrington.
See [LICENSE](./LICENSE) for full terms.