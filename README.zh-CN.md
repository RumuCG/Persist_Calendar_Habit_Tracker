# Persist - 日历打卡计划

<p align="center">
  <img src="https://img.shields.io/badge/📅-日历应用-ff6b9d.svg" alt="日历">
  <img src="https://img.shields.io/badge/✅-习惯追踪-4ecdc4.svg" alt="习惯">
  <img src="https://img.shields.io/badge/🎯-全栈应用-45b7d1.svg" alt="全栈">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="许可证">
</p>

<p align="center">
  <a href="./README.md">🇺🇸 English</a>
</p>

基于日历的习惯追踪应用，用于管理每日打卡计划。

---

## ✨ 功能特性

- 📅 **日历视图** - 可视化月历展示任务完成情况
- ✅ **每日任务** - 管理和追踪每日打卡任务
- 🔄 **默认任务** - 为每天设置重复默认任务
- 📊 **数据统计** - 个人完成率统计分析
- 🏆 **排行榜** - 日榜、月榜、年榜排名
- 🔐 **用户认证** - 基于 JWT 的身份验证

---

## 🚀 本地部署

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装

```bash
# 克隆仓库
git clone https://github.com/RumuCG/-.git
cd calendar

# 安装后端依赖
cd backend && npm install

# 安装前端依赖
cd ../frontend && npm install
```

### 数据库设置

```bash
cd backend

# 复制环境模板
cp .env.example .env

# 运行迁移
npx prisma migrate dev
npx prisma generate
```

### 启动开发

```bash
# 终端 1 - 后端（端口 3000）
cd backend && npm run dev

# 终端 2 - 前端（端口 5173）
cd frontend && npm run dev
```

访问 http://localhost:5173

---

## 🛠 技术栈

| 前端 | 后端 | 数据库 |
|------|------|--------|
| Vue 3 + TypeScript | Express + TypeScript | SQLite |
| Vite | Prisma ORM | |
| Element Plus | JWT 认证 | |
| Pinia | Jest 测试 | |

---

## 📁 项目结构

```
calendar/
├── frontend/          # Vue 3 前端
│   ├── src/
│   │   ├── api/      # API 请求
│   │   ├── components/
│   │   ├── stores/   # Pinia 状态
│   │   └── views/    # 页面
│   └── package.json
├── backend/           # Express 后端
│   ├── src/
│   │   ├── routes/   # API 路由
│   │   └── services/
│   ├── prisma/       # 数据库模型
│   └── .env.example
├── README.md
└── LICENSE
```

---

## 🔑 环境变量

创建 `backend/.env`：

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

## 📄 许可证

[MIT 许可证](./LICENSE)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/RumuCG">@RumuCG</a>
</p>
