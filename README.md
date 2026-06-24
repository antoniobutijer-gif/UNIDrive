# UNIDrive

Sustav za **suprijevoz i dijeljenje prijevoza** studenata Sveučilišta u Dubrovniku.
Projekt iz kolegija *Osnove programskog inženjerstva* (ak. god. 2025./2026.).

## Struktura repozitorija

```
UNIDrive/
├── frontend/        # Klijentska aplikacija (React prototip + PWA)
│   ├── UNIDrive.html
│   ├── support.js
│   ├── ios-frame.jsx
│   ├── config.js    # adresa backend API-ja (za deploy)
│   ├── manifest.json # PWA manifest (instalacija na mobitel)
│   ├── sw.js        # service worker (offline / instalacija)
│   └── icon.svg     # ikona aplikacije
├── backend/         # REST API (Node.js + Express.js + MySQL)
│   ├── src/         # MVC: routes → controllers → models
│   ├── tests/       # Jest jedinični testovi
│   └── README.md    # detaljne upute za backend
├── render.yaml      # konfiguracija za deploy backenda (Render)
└── DEPLOY.md        # upute za deploy (Render + GitHub Pages)
```

## Tehnologije

- **Frontend:** React (komponentski prototip), HTML/CSS
- **Backend:** Node.js, Express.js — RESTful API
- **Baza:** MySQL (Aiven u cloudu / lokalni MySQL)
- **Autentikacija:** AAI@EduHr (u prototipu simulirano), JWT

## Brzo pokretanje (lokalno)

```bash
# Backend (vidi backend/README.md za .env)
cd backend
npm install
npm run dev            # API na http://localhost:4000

# Frontend (u drugom terminalu)
cd frontend
python -m http.server 5500
# otvori http://localhost:5500/UNIDrive.html
```

## Deploy (demo na mobitelu)

Vidi [DEPLOY.md](DEPLOY.md) — frontend na GitHub Pages, backend na Render,
baza na Aivenu.

## Autori

Antonio Butijer (voditelj), Tomislav Matić (dizajn), Daniel Miletić (programiranje).
