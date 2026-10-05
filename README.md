# BIK Bötesystem

A real-time fines tracker for my football team, BIK. Teammates log fines from their phones, mark them as paid, and keep track of the team kitty, with every change showing up instantly on everyone's screen.

Built for, and used by, my own team during the season. The interface is in Swedish. The live app holds the team's real data, so it's only shared within the team.

---

## Features

- **Fast fine logging** — a floating button opens a sheet where you search for a player and pick one of 15 preset reasons with a fixed amount (late to practice, phone during a match, yellow card for talking back, …) or type your own
- **Outstanding fines** — each player's unpaid total, highest first, with an expandable history showing reason, amount, date and time
- **Payments** — tick a fine as paid and it moves out of the outstanding list; players with everything paid get their own section
- **Team kitty** — the balance is paid fines minus withdrawals, shown in green or red; withdrawals are logged with a reason and kept in a history
- **Top 3** — a leaderboard of the players with the most fines in total
- **Player management** — add and remove players from the roster in the app
- **Real-time sync** — every phone updates live when someone else adds a fine or marks one as paid
- **Handles bad reception** — if the connection drops while the app is open, changes are saved on the phone and synced once it's back online
- **Home screen icon** — can be added to the home screen with the team's own icon

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS and JavaScript (ES modules) |
| Database | Cloud Firestore (Firebase JS SDK 10, loaded from Google's CDN) |
| Real-time | Firestore `onSnapshot` listeners |
| Offline | Firestore IndexedDB persistence |
| Hosting | Netlify |

No build step and no dependencies to install.

---

## How it works

The app is a single page backed by three Firestore collections:

| Collection | Holds |
|---|---|
| `players` | The team roster |
| `fines` | One document per fine: player, amount, reason, paid flag, timestamp |
| `withdrawals` | Money taken out of the kitty: amount, reason, timestamp |

The app listens to all three collections and re-renders whenever any of them changes. Totals, the kitty balance and the top 3 are all computed in the browser from that data, so nothing is stored twice and the numbers can never drift out of sync.

### Design decisions

- **No login, on purpose.** The app is shared with the team as a link. Everyone on the team should be able to log a fine during practice in a few seconds, and accounts would only get in the way of that. Destructive actions (deleting a fine, a withdrawal or a player) ask for confirmation first.
- **Firestore instead of my own backend.** Real-time updates and offline writes come built in, which is exactly what a team using the app on their phones at the pitch needs.
- **Presets for common fines.** The team's fine list is built into the form, so amounts stay consistent and nobody has to remember what each fine costs.

---

## Running locally

The app uses ES modules, so it has to be served over HTTP rather than opened as a file:

```bash
git clone https://github.com/EACORTHO777/boetesystem.git
cd boetesystem
npx serve .
```

Then open the address it prints, usually `http://localhost:3000`.

It connects to the Firestore project configured in `firebase.js`. To run it against your own data, create a Firebase project with Firestore enabled and replace the config in that file.

---

## Project structure

```
boetesystem/
├── index.html      # Page layout and the "add fine" sheet
├── script.js       # Firestore listeners, rendering and all interactions
├── firebase.js     # Firebase config and offline persistence
├── styles.css      # Mobile-first styling
├── icons/          # Favicons and home screen icons
└── logo23.png      # Team logo shown in the header
```
