# BiblioTech

Gestione archivi di libri di biblioteche.

Web app full-stack per gestire il catalogo di una biblioteca: chiunque può consultare i libri, gli utenti registrati possono fare CRUD, gli admin hanno anche un pannello per gestire gli account.

## Stack

| Parte | Tecnologie |
|-------|------------|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | JWT (access 15 min + refresh 7 giorni, con rotazione) |
| Test | Jest/Supertest (BE), Vitest/RTL (FE), fast-check |

## Requisiti

- Node.js 18+
- MongoDB 6+ in locale, oppure [MongoDB Atlas](https://www.mongodb.com/atlas)
- npm 9+

## Struttura (in sintesi)

```
├── backend/
│   ├── controllers/     auth, books, admin, profile
│   ├── middleware/      auth JWT, admin, errorHandler
│   ├── models/          Book, User
│   ├── routes/
│   ├── createAdmin.js   crea/aggiorna account admin
│   ├── seed.js          libri di esempio
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/  Navbar, BookForm, BookCard, ...
        ├── context/     AuthContext, ThemeContext (dark mode)
        ├── pages/       catalogo, login, profilo, admin, ...
        └── services/    api.js (axios + interceptors)
```

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # su Windows: copy .env.example .env
```

`.env` minimo:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/biblioteca
JWT_SECRET=metti_un_valore_casuale_lungo
JWT_REFRESH_SECRET=un_altro_valore_casuale
FRONTEND_ORIGIN=http://localhost:3000
```

Non committare `.env`. In produzione usa secret seri per i JWT.

### Frontend

```bash
cd frontend
npm install
```

Opzionale (`frontend/.env`):

```env
VITE_API_URL=http://localhost:3001
```

Se manca, il default è `http://localhost:3001`.

## Avvio

MongoDB deve essere su. Su Windows spesso basta:

```bash
net start MongoDB
```

Terminale 1 — API:

```bash
cd backend
npm run dev
```

Controllo rapido: `curl http://localhost:3001/health`

Terminale 2 — interfaccia:

```bash
cd frontend
npm run dev
```

- App: http://localhost:3000  
- API: http://localhost:3001  

## Account e dati

**Libri di esempio** (cancella i libri esistenti e ne inserisce 8):

```bash
cd backend
npm run seed
```

**Registrazione** dalla UI (`/register`) oppure via API:

```bash
curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"mario\",\"email\":\"mario@biblioteca.it\",\"password\":\"password123\"}"
```

**Admin** (per `/admin` e gestione utenti):

```bash
cd backend
npm run create-admin
```

Default: `admin@biblioteca.it` / `Admin1234!` — cambiala dopo il primo accesso.

Gli utenti registrati hanno ruolo `user`. Solo gli `admin` vedono il pannello in `/admin` (lista utenti, modifica ruolo, reset password, ecc.).

## Test

Backend (usa DB in-memory, MongoDB locale non serve):

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm test
```

## Cosa fa l'app

**Visitatore** — catalogo, ricerca (debounce 300 ms), dettaglio libro.

**Utente loggato** — aggiungi/modifica/elimina libri, profilo (`/profile`), logout.

**Admin** — tutto quanto sopra + `/admin` (statistiche, utenti, libri dal pannello).

**UI** — tema chiaro/scuro dal pulsante in navbar (salvato in `localStorage`).

**Auth** — access token breve, refresh con rotazione, sessione ripristinata al reload. I token stanno in `localStorage` (in produzione meglio cookie httpOnly).

## API principali

| Metodo | Endpoint | Note |
|--------|----------|------|
| GET | `/api/books` | Pubblico. `?search=testo` per titolo/autore |
| GET | `/api/books/:id` | Pubblico |
| POST/PUT/DELETE | `/api/books` … | JWT richiesto |
| POST | `/api/auth/register` | Registrazione |
| POST | `/api/auth/login` | `identifier` = email o username |
| POST | `/api/auth/refresh` | Nuova coppia di token |
| POST | `/api/auth/logout` | Invalida refresh nel DB |
| GET | `/api/admin/users` | Solo admin |
| GET | `/api/admin/stats` | Solo admin |
| GET/PUT | `/api/profile/me` | Profilo utente loggato |
| GET | `/health` | Health check |

## Note aggiuntive

- Porte: frontend **3000**, backend **3001**
- Ricerca libri: regex MongoDB case-insensitive
- `BookForm` serve sia per creazione che modifica; autocomplete titolo da Open Library
- I test property-based con `fast-check` sono legati alle specifiche in `.kiro/specs/`