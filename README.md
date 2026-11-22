# What Should We Eat? 🍕

Each person swipes yes or no on nearby restaurants, Tinder-style, and the app shows the match that fits your group's rule—ending the "I don't mind, you choose" loop.

## How it works

1. The host creates a room, picks a location, radius, optional **Open now only** filter, and a **Match Rule** (**Unanimous**, **Majority >50%**, or **Solo / 1-person mode**), and gets a 4-character room code.
2. Friends join with the code (or you can swipe solo right away in Solo Mode).
3. Everyone swipes through the same list of nearby restaurants (drag cards or tap `✕` / `♥` / `←` / `→`).
4. Once the match condition is met, everyone sees the winning restaurant, map pin, and Google Maps directions.

## Tech stack

| Part | What we use |
|---|---|
| Frontend | Plain JavaScript (ES modules), Tailwind CSS via CDN, no build step |
| Backend | Node.js + Express |
| Restaurant & map data | [Geoapify](https://www.geoapify.com/) Places, Geocoding & Static Maps APIs (free tier, no credit card) |

Simple routes call services directly; rooms use a controller because they have more logic.

no-match-fallback
Geoapify has no photos or ratings, so the frontend shows a stock image based on `cuisine`. `openingHours` may be `null`. `isOpenNow` is `true`, `false`, or `null` when the hours are unknown (checked against the server's clock).

### `GET /api/geocode`

Turns a typed place name into coordinates for `/api/restaurants`.

| Query param | Required | Description |
|---|---|---|
| `text` | yes | Place name, e.g. `Camden` |

```json
{ "lat": 51.5427966, "lng": -0.1624803, "label": "Camden, London, ENG, United Kingdom" }
```

Returns `404` if nothing matches.

### `GET /api/map`

Returns a 600×400 JPEG map with an orange pin on the location. Use it straight in an image tag, since the backend adds the Geoapify key:

```html
<img src="http://localhost:3000/api/map?lat=51.5072772&lng=-0.1283651" alt="Map">
```

| Query param | Required | Description |
|---|---|---|
| `lat` | yes | Latitude of the pin |
| `lng` | yes | Longitude of the pin |

Each location is downloaded from Geoapify once, then served from memory (and cached by the browser for a day) to save free credits.

### Room endpoints

- `POST /api/rooms` creates a room and searches restaurants. Send
  `{ "location": "Camden", "radiusKm": 3, "member": { "id": "browser-id", "name": "Host" } }`.
- `POST /api/rooms/:code/join` joins a room with `{ "member": { "id": "browser-id", "name": "Guest" } }`.
- `GET /api/rooms/:code` returns the latest room state.
- `POST /api/rooms/:code/swipes` records `{ "memberId": "browser-id", "restaurantId": "...", "direction": "right" }`.

Every room response has a `status`:

| `status` | Meaning |
|---|---|
| `swiping` | Still going (or only one person in the room) |
| `matched` | Everyone swiped right on the same place, see `matchedRestaurant` |
| `finished` | Everyone swiped every card with no full match. `bestRestaurant` is the place with the most right swipes (ties go to the closer place), or `null` if nobody liked anything. `votes[bestRestaurant.id]` gives the count |

If someone joins a `finished` room, it goes back to `swiping` until they finish too.

The frontend polls room state every two seconds. By default it connects to the API at
`http://<frontend-host>:3000/api`; set `window.WSWE_API_BASE_URL` before loading
`src/app.js` when the backend uses another URL. For example:

```html
<script>window.WSWE_API_BASE_URL = 'https://api.example.com/api';</script>
```

## Team

- Thanh Lan Ngo
- Jovian Niko Soesilo

## License

[MIT](LICENSE)

## Project structure
main

```text
what-should-we-eat/
├── .gitignore
├── LICENSE
├── README.md
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── roomController.js
│   │   │   └── swipeController.js
│   │   ├── models/
│   │   │   └── Restaurant.js
│   │   ├── routes/
│   │   │   ├── geocode.js
│   │   │   ├── map.js
│   │   │   ├── restaurants.js
│   │   │   └── rooms.js
│   │   ├── services/
│   │   │   ├── geocode.js
│   │   │   ├── places.js
│   │   │   ├── roomStore.js
│   │   │   └── staticMap.js
│   │   └── test/
│   │       └── room.test.js
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── app.js
        ├── assets/
        │   └── style.css
        ├── components/
        │   ├── Button.js
        │   ├── Navbar.js
        │   └── SwipeCard.js
        ├── models/
        │   ├── Room.js
        │   └── User.js
        ├── pages/
        │   ├── Home.js
        │   ├── Match.js
        │   └── SwipeRoom.js
        ├── services/
        │   ├── api.js
        │   └── sync.js
        └── utils/
            ├── formatRestaurant.js
            └── html.js