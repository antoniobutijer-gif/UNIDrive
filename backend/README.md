# UNIDrive – Backend (REST API)

Poslužiteljski dio sustava za **suprijevoz i dijeljenje prijevoza** studenata
Sveučilišta u Dubrovniku. Implementiran prema projektnoj dokumentaciji
(*Sustav za suprijevoz i dijeljenje prijevoza, Rev. 1.0*).

- **Tehnologije:** Node.js (v18+), Express.js, MySQL (InnoDB), JWT, AAI@EduHr
- **Arhitektura:** troslojna klijent-poslužitelj, MVC obrazac (Rute → Kontroleri → Modeli)
- **Testiranje:** Jest (jedinično), Postman (integracijsko)

---

## 1. Struktura projekta

```
backend/
├── src/
│   ├── server.js              # ulazna točka (pokretanje poslužitelja)
│   ├── app.js                 # Express konfiguracija (middleware, rute)
│   ├── config/
│   │   ├── env.js             # učitavanje .env varijabli
│   │   └── db.js              # MySQL connection pool + transakcije
│   ├── db/
│   │   ├── schema.sql         # fizički model (5 tablica, pogl. 7.1)
│   │   ├── seed.sql           # demonstracijski podaci
│   │   └── migrate.js         # migracijska skripta
│   ├── middleware/            # auth (JWT), validacija, error handler
│   ├── models/               # komunikacija s bazom (DB sloj)
│   ├── controllers/          # poslovna logika (obrada zahtjeva)
│   ├── routes/               # definicije REST ruta + validatori
│   ├── services/             # notifikacijski modul (FZ-12)
│   └── utils/                # JWT, ApiError, izračun mjesta, asyncHandler
└── tests/                     # Jest testovi
```

## 2. Pokretanje (upute za administraciju – pogl. 8.2)

```bash
# 1. Instalacija ovisnosti
npm install

# 2. Konfiguracija okoline
cp .env.example .env          # zatim uredi vrijednosti (DB, JWT, AAI)

# 3. Kreiranje baze i tablica (+ demo podaci)
npm run db:seed               # ili: npm run db:migrate (bez demo podataka)

# 4. Pokretanje
npm run dev                   # razvojni način (nodemon)
npm start                     # produkcijski način
npm run start:prod            # produkcija s NODE_ENV=production
```

Poslužitelj sluša na `http://localhost:4000` (zadano). Provjera: `GET /health`.

## 3. Autentikacija (FZ-1)

Prijava se obavlja putem **AAI@EduHr** identiteta. U prototipu je
implementirana *mock / just-in-time* prijava: ako student ne postoji, automatski
se registrira pri prvoj prijavi (može se isključiti s `AAI_ALLOW_DEV_LOGIN=false`).

```http
POST /api/auth/aai/login
Content-Type: application/json

{ "email": "mkovac@student.unidu.hr", "first_name": "Marta", "last_name": "Kovač" }
```

Odgovor sadrži `token` (JWT) koji se šalje u svim sljedećim zahtjevima:

```
Authorization: Bearer <token>
```

## 4. Pregled API ruta (mapiranje na funkcionalne zahtjeve)

| Metoda | Ruta | FZ | Opis |
|--------|------|----|------|
| POST | `/api/auth/aai/login` | FZ-1 | Prijava putem AAI@EduHr |
| GET | `/api/auth/me` | FZ-1 | Trenutno prijavljeni korisnik |
| GET | `/api/users/me` | FZ-2 | Vlastiti profil |
| PUT | `/api/users/me` | FZ-2 | Uređivanje profila |
| GET | `/api/users/:id` | FZ-9/11 | Javni profil + ocjene |
| GET | `/api/users/me/history` | FZ-10 | Povijest vožnji |
| GET | `/api/rides` | FZ-3/4 | Pretraga i filtriranje vožnji |
| GET | `/api/rides/:id` | FZ-3 | Detalji vožnje |
| POST | `/api/rides` | FZ-7 | Kreiranje vožnje |
| PUT | `/api/rides/:id` | FZ-8 | Uređivanje vožnje |
| DELETE | `/api/rides/:id` | FZ-8 | Brisanje vožnje (+ obavijest putnicima) |
| GET | `/api/rides/:id/passengers` | FZ-9 | Pregled prijavljenih putnika |
| POST | `/api/rides/:id/bookings` | FZ-5 | Rezervacija mjesta (transakcijski) |
| GET | `/api/bookings/me` | FZ-10 | Vlastite rezervacije |
| PATCH | `/api/bookings/:id/cancel` | FZ-6 | Otkazivanje rezervacije |
| POST | `/api/reviews` | FZ-11 | Ocjenjivanje korisnika |
| GET | `/api/reviews/user/:id` | FZ-11 | Ocjene korisnika |
| GET | `/api/notifications` | FZ-12 | Notifikacije |
| PATCH | `/api/notifications/:id/read` | FZ-12 | Označi pročitano |
| PATCH | `/api/notifications/read-all` | FZ-12 | Označi sve pročitano |
| GET | `/api/admin/users` | FZ-13 | Lista korisnika (admin) |
| PATCH | `/api/admin/users/:id/block` | FZ-13 | Blokiranje korisnika (admin) |
| DELETE | `/api/admin/users/:id` | FZ-13 | Brisanje korisnika (admin) |
| GET | `/api/admin/stats` | FZ-14 | Izvještaji i statistike (admin) |

## 5. Transakcije i integritet (pogl. 7.2)

Rezervacija mjesta (`POST /api/rides/:id/bookings`) izvodi se unutar MySQL
transakcije: redak vožnje se zaključava (`SELECT ... FOR UPDATE`), provjeravaju
se slobodna mjesta, ubacuje rezervacija i umanjuje `seats_available`, te se na
kraju izvršava `COMMIT` (ili `ROLLBACK` u slučaju greške). Time se sprječava
preklapanje rezervacija (*race conditions*).

## 6. Testiranje (pogl. 7.5)

```bash
npm test          # Jest jedinični testovi (izračun slobodnih mjesta)
```

Za integracijsko testiranje koristi se **Postman** (uvezi `postman_collection.json`).

## 7. Odgovor API-ja (format)

Uspjeh:
```json
{ "success": true, "data": { ... } }
```
Greška:
```json
{ "success": false, "error": { "message": "...", "details": [ ... ] } }
```

## 8. Spoj s frontendom (end-to-end demo)

React prototip (`../frontend/UNIDrive.html`) spojen je na ovaj API. Logika u `<script>`
bloku sadrži API klijent koji koristi `window.UNIDRIVE_API` ili zadano
`http://localhost:4000/api`. Žive su sljedeće funkcionalnosti: prijava (FZ-1),
pretraga vožnji (FZ-3), odabir i rezervacija (FZ-5), otkazivanje (FZ-6), objava
vožnje (FZ-7), moje rezervacije (FZ-10) i obavijesti (FZ-12). Ako backend nije
pokrenut, prototip se prikazuje s ugrađenim demo podacima (fallback).

Pokretanje cijele aplikacije za demo:

```bash
# 1) backend (vidi gore)
cd backend && npm run db:seed && npm run dev

# 2) frontend (statički poslužitelj iz frontend mape)
cd ../frontend && python -m http.server 5500
# otvori: http://localhost:5500/UNIDrive.html
```

Prijava u prototipu koristi simulirani AAI@EduHr identitet demo studenta
(`astudent@student.unidu.hr`). Korijenski `.claude/launch.json` već sadrži
konfiguraciju `unidrive-frontend-preview` za pokretanje frontenda.

## 9. Napomena o proširenjima modela

Fizički model iz dokumentacije (pogl. 7.1) vjerno je preslikan. Radi potpune
podrške funkcionalnim zahtjevima dodani su sljedeći stupci (ne mijenjaju logički
model): `users.avatar_url`, `users.ride_pref`, `users.is_blocked` (FZ-2, FZ-13),
`rides.preferences`, `rides.status`, `bookings.seats`. Detaljno opisano u
komentarima `schema.sql`.
