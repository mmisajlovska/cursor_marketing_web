# PromoRunner player frontend

Play-first branded endless runner (React + Phaser 3). Talks to `/api/v1` when `VITE_USE_MOCK=false`; otherwise uses local mocks so this app can be built without the Spring backend.

```bash
npm install
npm run dev
```

Routes: `/` landing, `/play`, `/leaderboard`, `/auth/callback`.
