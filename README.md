# Persist - Calendar Habit Tracker

<p align="center">
  <img src="https://img.shields.io/badge/📅-Calendar%20App-ff6b9d.svg" alt="Calendar">
  <img src="https://img.shields.io/badge/✅-Habit%20Tracker-4ecdc4.svg" alt="Habit">
  <img src="https://img.shields.io/badge/🎯-Full%20Stack-45b7d1.svg" alt="Full Stack">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
</p>

<p align="center">
  <a href="./README.zh-CN.md">🇨🇳 简体中文</a>
</p>

A calendar-based habit tracking application for managing daily check-in plans.

---

## ✨ Features

- 📅 **Calendar View** - Visual monthly calendar with task completion status
- ✅ **Daily Tasks** - Manage and track daily check-in tasks
- 🔄 **Default Tasks** - Set recurring default tasks for each day
- 📊 **Statistics** - Personal completion analytics
- 🏆 **Leaderboard** - Daily, monthly, yearly rankings
- 🔐 **User Auth** - JWT-based authentication

---

## 🚀 Local Deployment

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
# Clone repository
git clone https://github.com/RumuCG/-.git
cd calendar

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Database Setup

```bash
cd backend

# Copy environment template
cp .env.example .env

# Run migrations
npx prisma migrate dev
npx prisma generate
```

### Start Development

```bash
# Terminal 1 - Backend (port 3000)
cd backend && npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

Visit http://localhost:5173

---

## 🛠 Tech Stack

| Frontend | Backend | Database |
|----------|---------|----------|
| Vue 3 + TypeScript | Express + TypeScript | SQLite |
| Vite | Prisma ORM | |
| Element Plus | JWT Auth | |
| Pinia | Jest Testing | |

---

## 📁 Project Structure

```
calendar/
├── frontend/          # Vue 3 Frontend
│   ├── src/
│   │   ├── api/      # API requests
│   │   ├── components/
│   │   ├── stores/   # Pinia state
│   │   └── views/    # Pages
│   └── package.json
├── backend/           # Express Backend
│   ├── src/
│   │   ├── routes/   # API routes
│   │   └── services/
│   ├── prisma/       # DB schema
│   └── .env.example
├── README.md
└── LICENSE
```

---

## 🔑 Environment Variables

Create `backend/.env`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
CORS_ORIGIN="http://localhost:5173"
COOKIE_SECURE=false
```

---

## 📄 License

[MIT License](./LICENSE)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/RumuCG">@RumuCG</a>
</p>
