# UNIDrive – Deploy (mobilni demo uživo)

Cilj: prototip dostupan na mobitelu preko linka, s povezanim frontendom i
backendom. Arhitektura:

```
Mobitel (preglednik)
   │  otvara
   ▼
GitHub Pages  (frontend, statički, HTTPS)
   │  poziva /api preko HTTPS
   ▼
Render        (Node/Express backend, HTTPS)
   │
   ▼
Aiven         (MySQL baza — već postavljena ✓)
```

> Baza na Aivenu je već napunjena, pa preostaje samo backend (Render) i
> frontend (GitHub Pages).

---

## Korak 1 — Stavi kod na GitHub

1. Na [github.com](https://github.com) napravi **novi (privatni) repozitorij**, npr. `UNIDrive`.
2. U mapi `UNIDrive` pokreni (u terminalu):
   ```bash
   git init
   git add .
   git commit -m "UNIDrive prototip (frontend + backend)"
   git branch -M main
   git remote add origin https://github.com/<tvoj-username>/UNIDrive.git
   git push -u origin main
   ```
   `.gitignore` već pazi da `.env`, `ca.pem` i `node_modules` **ne** odu na GitHub.

---

## Korak 2 — Backend na Render

1. Registriraj se na [render.com](https://render.com) (možeš preko GitHub računa).
2. Klikni **New +** → **Blueprint** → odaberi svoj `UNIDrive` repozitorij.
   Render automatski pročita `render.yaml` i predloži servis `unidrive-backend`.
3. Prije deploya ispuni **tajne varijable** (Environment), s Aiven "Overview" kartice:

   | Varijabla | Vrijednost |
   |-----------|-----------|
   | `DB_HOST` | `unidrive-db-xxxx.aivencloud.com` (tvoj Aiven host) |
   | `DB_PORT` | `26062` |
   | `DB_USER` | `avnadmin` |
   | `DB_PASSWORD` | tvoja Aiven lozinka |
   | `DB_NAME` | `unidrive` |
   | `DB_CA_CERT` | **cijeli sadržaj** `ca.pem` (s `-----BEGIN…` i `-----END…` linijama) |
   | `CLIENT_ORIGIN` | `*` (zasad; u Koraku 4 zamijeni GitHub Pages URL-om) |

   (`JWT_SECRET`, `DB_SSL`, `NODE_ENV` se postavljaju automatski iz `render.yaml`.)
4. **Apply / Create** → pričekaj da build završi (~2–3 min).
5. Dobit ćeš adresu, npr. `https://unidrive-backend.onrender.com`.
   Provjeri u pregledniku: otvori `https://unidrive-backend.onrender.com/health`
   → mora vratiti `{"success":true,...}`.

> ⚠️ Besplatni Render servis "zaspi" nakon ~15 min neaktivnosti — prvi zahtjev
> nakon toga traje ~40–60 s dok se probudi. Za demo otvori link minutu ranije.

---

## Korak 3 — Frontend na GitHub Pages

1. Otvori datoteku **`frontend/config.js`** i upiši Render adresu:
   ```js
   window.UNIDRIVE_API = "https://unidrive-backend.onrender.com/api";
   ```
   (odkomentiraj liniju i zamijeni stvarnom adresom). Spremi, pa:
   ```bash
   git add frontend/config.js
   git commit -m "Postavi adresu backenda"
   git push
   ```
2. Na GitHubu: repozitorij → **Settings** → **Pages**.
3. **Source**: *Deploy from a branch* → **Branch**: `main` → **/(root)** → **Save**.
4. Nakon minutu dobiješ adresu oblika:
   `https://<tvoj-username>.github.io/UNIDrive/frontend/UNIDrive.html`

---

## Korak 4 — Poveži CORS (sigurnost)

1. Vrati se na Render → servis → **Environment**.
2. Promijeni `CLIENT_ORIGIN` iz `*` u svoj GitHub Pages izvor (bez putanje):
   `https://<tvoj-username>.github.io`
3. Spremi → Render se sam ponovno deploya.

---

## Korak 5 — Demo na mobitelu 📱

1. Na telefonu otvori `https://<tvoj-username>.github.io/UNIDrive/frontend/UNIDrive.html`
2. Klikni **„Prijavi se putem AAI@EduHr"** → otvara se Pretraga sa živim vožnjama
   iz Aiven baze.
3. Odaberi vožnju → **Rezerviraj** → provjeri u **Rezervacije** i **Obavijesti**.

Sve ide preko interneta — frontend (GitHub Pages) ↔ backend (Render) ↔ baza (Aiven).

---

## Rješavanje problema

| Simptom | Uzrok / rješenje |
|---------|------------------|
| Frontend pokazuje demo (mock) podatke | `frontend/config.js` nema točan Render URL, ili backend spava (pričekaj 60 s i osvježi) |
| Greška u konzoli „CORS" | `CLIENT_ORIGIN` na Renderu ne odgovara Pages izvoru — provjeri Korak 4 |
| `/health` ne radi | Krivi DB podaci na Renderu — provjeri `DB_*` i `DB_CA_CERT` |
| Prvi zahtjev jako spor | Normalno za Render free (cold start) — drugi je brz |
