# Render par SyncCode deploy kaise karein

## 1. Render account + repo connect

1. [render.com](https://render.com) par sign up / login karo.
2. **Dashboard** → **New** → **Web Service**.
3. Apna **GitHub** repo connect karo (SyncCode wala).
4. Repo select karo, branch `main` (ya jo use karte ho).

---

## 2. Service settings

| Field | Value |
|-------|--------|
| **Name** | `synccode` (ya koi bhi naam) |
| **Region** | Singapore / Oregon / Frankfurt (jo paas ho) |
| **Runtime** | **Node** |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free ya paid (Socket.io + Redis ke liye Free tier chal jata hai, Piston alag host karna padega) |

---

## 3. Environment variables (zaroori)

Render dashboard me **Environment** tab me ye add karo:

| Key | Value | Notes |
|-----|--------|--------|
| `NODE_ENV` | `production` | Render bhi set kar sakta hai |
| `PORT` | *(chhodo)* | Render khud `PORT` inject karta hai |
| `REDIS_URL` | `rediss://...` | Upstash se copy karo ([console.upstash.com](https://console.upstash.com)) |
| `PISTON_API_URL` | Piston API ka full URL | Public: `https://emkc.org/api/v2/piston/execute` ya apna self‑hosted URL |
| `NEXT_PUBLIC_ZEGO_APP_ID` | Zego app ID (number) | [console.zegocloud.com](https://console.zegocloud.com) |
| `NEXT_PUBLIC_ZEGO_SERVER_SECRET` | Zego server secret | Same dashboard se |

**Optional (email invites):**

| Key | Value |
|-----|--------|
| `SMTP_HOST` | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Gmail / SMTP user |
| `SMTP_PASS` | App password / SMTP password |
| `SMTP_FROM_NAME` | SyncCode |
| `SMTP_FROM_EMAIL` | sender@example.com |

**Important:** `NEXT_PUBLIC_*` vars **Build** time par use hote hain, isliye env add karne ke baad ek **manual redeploy** karo (Deploy → Clear build cache & deploy).

---

## 4. Deploy

1. **Create Web Service** dabao.
2. Pehla deploy automatic start hoga (build + start).
3. Logs me dekhna: `Build succeeded` aur `Synccode server ready`.
4. Render jo URL dega (e.g. `https://synccode-xxxx.onrender.com`) wahi app ka URL hoga.

---

## 5. Baad me change / redeploy

- **Env change** (especially `NEXT_PUBLIC_*`) → **Manual Deploy** (aur agar chaho to “Clear build cache & deploy”).
- Code push to same branch → Render auto-deploy karega (agar Auto-Deploy on hai).

---

## 6. Redis (Upstash – recommended)

Render par Redis service bhi le sakte ho, par **Upstash** free tier simple hai:

1. [console.upstash.com](https://console.upstash.com) → Create database (Redis).
2. **Connect** → **Node.js / ioredis** → `REDIS_URL` copy karo (`rediss://...`).
3. Ye hi value Render env me `REDIS_URL` me daalo.

---

## 7. Piston (code execution)

- **Option A:** Public API use karo:  
  `PISTON_API_URL=https://emkc.org/api/v2/piston/execute`  
  (Rate limit ho sakta hai.)
- **Option B:** Piston apne server/VPS par host karke waha ka URL `PISTON_API_URL` me daalo.

---

## 8. Common issues

| Issue | Solution |
|-------|----------|
| Build fail | Logs me error dekho; usually `npm run build` ya missing env. |
| “Room not found” | `REDIS_URL` sahi hai na? Room create API call ho raha hai na? |
| Video call nahi chal raha | `NEXT_PUBLIC_ZEGO_*` dono set karo aur **redeploy** (clear build cache). |
| Code run nahi ho raha | `PISTON_API_URL` sahi hai? Browser / Render logs me execute API error dekho. |

Agar tumhare paas **render.yaml** use ho (Blueprint), to **New → Blueprint** se repo connect karke same env vars Environment me add karke deploy karo.
