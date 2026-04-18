# 日历打卡计划网站 - 启动文档

## 项目简介

前后端分离的全栈应用，帮助用户创建和管理个人打卡计划。

- **前端**: Vue 3 + TypeScript + Vite (端口 5173)
- **后端**: Express + TypeScript + Prisma + SQLite (端口 3000)

---

## 快速启动

### 一键启动脚本

```bash
cd /opt/calendar

# 启动后端
cd backend && npm run dev &

# 启动前端
cd ../frontend && npm run dev &
```

### 分步启动

#### 1. 启动后端服务

```bash
cd /opt/calendar/backend
npm run dev
```

- 服务地址: http://localhost:3000
- 健康检查: http://localhost:3000/health

#### 2. 启动前端服务

```bash
cd /opt/calendar/frontend
npm run dev
```

- 服务地址: http://localhost:5173
- 会自动代理 `/api` 请求到后端

---

## 访问方式

### 本机访问
- 前端: http://localhost:5173
- 后端: http://localhost:3000

### 局域网/外网访问
- 前端: http://<服务器IP>:5173
- 后端: http://<服务器IP>:3000

**当前服务器地址**:
- 前端: http://118.25.177.56:5173
- 后端: http://118.25.177.56:3000

---

## 外网访问配置

### 1. 云服务器安全组设置

确保在安全组中开放以下端口：

| 方向 | 协议 | 端口 | 来源 | 动作 |
|------|------|------|------|------|
| 入方向 | TCP | 3000 | 0.0.0.0/0 | 允许 |
| 入方向 | TCP | 5173 | 0.0.0.0/0 | 允许 |

### 2. CORS 配置

后端已配置为允许所有来源访问（开发环境）：

```bash
# 文件: backend/.env
CORS_ORIGIN="*"
```

如需限制特定域名，修改 `.env` 文件：
```bash
CORS_ORIGIN="http://your-domain.com"
```

---

## 常用命令

### 后端命令

```bash
cd /opt/calendar/backend

npm run dev          # 开发模式启动
npm run build        # 构建生产版本
npm run start        # 生产模式启动
npm run test         # 运行测试

npx prisma studio    # 打开数据库管理界面
npx prisma migrate dev  # 执行数据库迁移
```

### 前端命令

```bash
cd /opt/calendar/frontend

npm run dev          # 开发模式启动
npm run build        # 构建生产版本
npm run preview      # 预览生产版本
npm run test         # 运行测试
```

---

## 停止服务

### 查找并停止进程

```bash
# 查找 Node 进程
ps aux | grep -E "vite|ts-node-dev"

# 停止指定端口
kill $(lsof -t -i:3000) 2>/dev/null
kill $(lsof -t -i:5173) 2>/dev/null
```

### 停止所有相关进程

```bash
pkill -f "ts-node-dev"
pkill -f "vite"
```

---

## 故障排查

### 端口被占用

```bash
# 查看占用端口的进程
lsof -i :3000
lsof -i :5173

# 停止占用端口的进程
kill -9 <PID>
```

### CORS 跨域错误

检查 `backend/.env` 中的 `CORS_ORIGIN` 设置：
- 开发环境: `CORS_ORIGIN="*"`
- 生产环境: `CORS_ORIGIN="http://your-domain.com"`

修改后需要重启后端服务。

### 数据库问题

```bash
cd /opt/calendar/backend

# 重新生成 Prisma 客户端
npx prisma generate

# 重置数据库（谨慎使用）
npx prisma migrate reset

# 查看数据库
npx prisma studio
```

---

## 目录结构

```
/opt/calendar/
├── frontend/          # Vue 3 前端
│   ├── src/
│   │   ├── api/      # API 请求封装
│   │   ├── components/# 可复用组件
│   │   ├── stores/   # Pinia 状态管理
│   │   ├── views/    # 页面视图
│   │   └── ...
│   └── package.json
├── backend/           # Express 后端
│   ├── src/
│   │   ├── routes/   # API 路由
│   │   ├── services/ # 业务逻辑
│   │   └── middleware/# 中间件
│   ├── prisma/
│   │   └── schema.prisma  # 数据库模型
│   └── package.json
├── STARTUP.md        # 本文档
└── README.md         # 项目说明
```

---

## 注意事项

1. **开发环境**: 当前配置允许所有 CORS 来源，仅用于开发测试
2. **生产部署**: 建议：
   - 使用 Nginx 反向代理
   - 配置 HTTPS
   - 限制 CORS 来源为实际域名
   - 使用环境变量管理敏感配置
3. **数据库**: 使用 SQLite，数据文件位于 `backend/prisma/dev.db`

---

## 相关文档

- [项目详细说明](./README.md)
- [Vue 3 文档](https://vuejs.org/)
- [Express 文档](https://expressjs.com/)
- [Prisma 文档](https://www.prisma.io/docs)
