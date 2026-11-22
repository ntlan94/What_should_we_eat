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

## Project structure

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