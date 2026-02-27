# SyncCode ko GitHub par kaise push karein

## 1. GitHub par naya repo banao

1. [github.com](https://github.com) login karo.
2. **+** (top right) → **New repository**.
3. **Repository name:** `SyncCode` (ya jo naam chaho).
4. **Public** choose karo.
5. **"Add a README file"** mat select karo (pehle se code hai).
6. **Create repository** dabao.

---

## 2. Terminal me project folder me jao

```bash
cd /Users/himanshuyadav/Desktop/SyncCode
```

---

## 3. Git init (agar pehle se git nahi hai)

```bash
git init
```

---

## 4. Saari files add karo (`.gitignore` ki wajah se `.env.local` add nahi hogi)

```bash
git add .
```

---

## 5. Pehla commit

```bash
git commit -m "Initial commit: SyncCode collaborative editor"
```

---

## 6. GitHub repo ko remote add karo

GitHub par jo repo banaya, uska URL use karo. Format:

```bash
git remote add origin https://github.com/YOUR_USERNAME/SyncCode.git
```

**Yahan `YOUR_USERNAME` apna GitHub username daalo.**  
Agar repo ka naam alag hai to `SyncCode` ki jagah woh naam use karo.

---

## 7. Branch naam set karo (optional, agar main use karte ho)

```bash
git branch -M main
```

---

## 8. GitHub par push karo

```bash
git push -u origin main
```

Pehli baar push par GitHub **username + password** maang sakta hai. Password ki jagah **Personal Access Token (PAT)** use karna hoga:

- GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**.
- `repo` scope select karo, token copy karo.
- Jab password maange to ye token paste karo.

---

## 9. Verify

- GitHub par apne repo me jao.
- Saari project files dikhni chahiye.
- **`.env.local` dikhni nahi chahiye** (wo ignore ho chuki hai).

---

## Baad me code update kaise push karein

```bash
git add .
git commit -m "Short message ki kya change kiya"
git push
```

---

## Ab Render / Vercel par deploy

- **Render:** [DEPLOY_RENDER.md](./DEPLOY_RENDER.md) – Render dashboard me **New → Web Service** → is GitHub repo ko connect karo.
- **Vercel:** vercel.com → **Import** → is repo ko connect karo (note: Socket.io ke liye custom server chahiye, isliye full app Render pe better hai).
