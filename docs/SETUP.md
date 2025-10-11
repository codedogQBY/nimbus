# Nimbus 开发环境设置指南

## ✅ 已完成的工作

### 1. 依赖安装
- ✅ 安装了所有核心依赖包
  - Prisma ORM (@prisma/client, prisma)
  - 认证相关 (bcryptjs, jsonwebtoken)
  - 验证 (zod)
  - 状态管理 (zustand)
  - HTTP 客户端 (ky)
  - 文件上传 (@uppy/core, @uppy/react)
  - 邮件服务 (nodemailer)
  - 图片处理 (sharp)
  - Telegram Bot (grammy)
  - AWS S3 SDK (@aws-sdk/client-s3)
  - TypeScript 运行器 (tsx)

### 2. 数据库设计
- ✅ 创建了完整的 Prisma Schema (`prisma/schema.prisma`)
  - 用户认证系统（User, EmailVerification, LoginHistory）
  - RBAC权限系统（Role, Permission, RolePermission, UserRole）
  - 存储系统（StorageSource, Folder, File, Share）
  - 审计日志（PermissionLog, EmailLog）

### 3. 种子数据
- ✅ 创建了数据库种子脚本 (`prisma/seed.ts`)
  - 5个预设角色：Owner, Admin, Editor, Viewer, Guest
  - 21个细粒度权限
  - 角色权限自动分配

### 4. 核心服务
- ✅ Prisma 客户端单例 (`lib/prisma.ts`)
- ✅ 邮件服务 (`lib/email.ts`)
  - 验证码生成和发送
  - 邮件模板（注册、重置密码）
  - 频率限制保护
- ✅ 邮件配置 (`config/email.ts`)

### 5. UI 配置
- ✅ 更新了 Tailwind 配置 (`tailwind.config.ts`)
  - 温暖复古配色方案
  - 奶油绿主色系
  - 浅卡其辅助色
  - 琥珀棕点缀色
  - 深橄榄绿文字色

### 6. 项目配置
- ✅ 更新了 package.json 添加数据库脚本
  - `pnpm db:generate` - 生成 Prisma 客户端
  - `pnpm db:push` - 推送数据库结构
  - `pnpm db:migrate` - 创建迁移
  - `pnpm db:seed` - 运行种子数据
  - `pnpm db:studio` - 打开 Prisma Studio

## 📋 下一步操作

### 1. 配置环境变量
创建 `.env.local` 文件（参考 `.env.example`）：

```bash
# 复制示例文件
cp .env.example .env.local

# 编辑 .env.local 文件，配置以下必填项：

# 1. 数据库连接
DATABASE_URL="postgresql://nimbus:password@localhost:5432/nimbus?schema=public"

# 2. JWT密钥（至少32个字符的随机字符串）
JWT_SECRET="请使用强随机字符串替换这里-至少32个字符"

# 3. SMTP邮件配置（必须配置，用于邮箱验证）
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@nimbus.com"

# 4. Owner初始账号（首次运行时创建）
INIT_OWNER_USERNAME="admin"
INIT_OWNER_EMAIL="admin@example.com"
INIT_OWNER_PASSWORD="Admin123456"  # 请修改为强密码！
```

**重要提示**：
- JWT_SECRET 建议使用随机生成的字符串（可用 `openssl rand -base64 32`）
- SMTP配置必须正确，否则无法发送验证码
- INIT_OWNER_PASSWORD 必须满足密码强度要求：
  - 至少8个字符
  - 包含大写字母
  - 包含小写字母
  - 包含数字

**Gmail 配置说明**：
1. 开启两步验证
2. 生成应用专用密码
3. 使用应用密码作为 SMTP_PASSWORD

### 2. 设置 PostgreSQL 数据库
```bash
# 使用 Docker 快速启动（推荐）
docker run --name nimbus-postgres \
  -e POSTGRES_USER=nimbus \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=nimbus \
  -p 5432:5432 \
  -d postgres:15

# 或使用现有的 PostgreSQL 服务器
# 创建数据库：CREATE DATABASE nimbus;
```

### 3. 初始化数据库

#### 方式一：一键初始化（推荐）
```bash
pnpm setup
```
这个命令会自动执行：
1. 生成 Prisma 客户端
2. 推送数据库结构
3. 运行种子数据（创建角色和权限）
4. 创建 Owner 用户（基于环境变量配置）

#### 方式二：分步执行
```bash
# 1. 生成 Prisma 客户端
pnpm db:generate

# 2. 推送数据库结构到 PostgreSQL
pnpm db:push

# 3. 运行种子数据（创建角色和权限）
pnpm db:seed

# 4. 创建 Owner 用户
pnpm init:owner

# 5. 检查数据库（可选）
pnpm db:studio
```

#### Owner 用户说明
- 脚本会根据环境变量 `INIT_OWNER_*` 创建第一个 Owner 用户
- 如果数据库中已有用户，则跳过创建
- Owner 用户自动激活，无需邮箱验证
- 创建后会显示登录信息，请妥善保管

**初始登录信息**（基于 .env.local 配置）：
- 用户名：`INIT_OWNER_USERNAME`
- 邮箱：`INIT_OWNER_EMAIL`
- 密码：`INIT_OWNER_PASSWORD`

⚠️ **安全提示**：首次登录后，请立即修改密码！

### 4. 开始使用

#### 快速启动
```bash
# 启动开发服务器
pnpm dev

# 访问应用
open http://localhost:3000
```

应用会自动重定向到登录页面。

#### 首次登录
使用在 `.env.local` 中配置的 Owner 账号登录：
- 用户名或邮箱：`INIT_OWNER_USERNAME` 或 `INIT_OWNER_EMAIL`
- 密码：`INIT_OWNER_PASSWORD`

#### 已实现的功能 ✅
- ✅ 用户注册和邮箱验证
- ✅ 用户登录（支持用户名/邮箱）
- ✅ 密码重置
- ✅ RBAC权限系统
- ✅ 文件管理页面框架
- ✅ 存储源管理页面框架
- ✅ 用户管理页面框架

#### 待实现的功能 🚧
- 🚧 文件上传功能
- 🚧 文件列表和预览
- 🚧 文件分享
- 🚧 存储源配置
- 🚧 在线解压缩

### 5. 开发流程
```bash
# 1. 启动开发服务器
pnpm dev

# 2. 访问应用
open http://localhost:3000

# 3. 访问 API 文档（需要创建）
open http://localhost:3000/api

# 4. 访问数据库管理
pnpm db:studio
```

## 🎨 设计系统
已配置的颜色方案（60-30-10 法则）：

- **主色 (60%)**: 奶油绿 `#D4E2D4`
  - 用于：页面背景、卡片背景、侧边栏
- **辅助色 (30%)**: 浅卡其 `#E8E1D0`
  - 用于：内容区块、交替背景、纸张质感
- **点缀色 (10%)**: 琥珀棕 `#B5651D`
  - 用于：按钮、链接、选中状态
- **文字色**: 深橄榄绿 `#556B2F`
  - 用于：主要文字、图标

## 🔐 系统角色和权限
预设的5个角色：

1. **Owner（所有者）** - 所有权限
2. **Admin（管理员）** - 除系统设置外的所有权限
3. **Editor（编辑者）** - 文件和文件夹操作权限
4. **Viewer（查看者）** - 只读权限
5. **Guest（访客）** - 最小权限

## 📚 技术栈
- **前端**: Next.js 15 (App Router), React 18, TypeScript
- **UI库**: HeroUI v2, Tailwind CSS
- **状态管理**: Zustand
- **表单验证**: Zod
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT (jsonwebtoken)
- **邮件**: Nodemailer
- **文件处理**: Sharp, Uppy
- **存储**: AWS S3 SDK (R2, 七牛云等)

## 🚀 接下来的开发优先级

### Phase 1: 认证系统（P0）
1. 创建认证 API 路由
2. 实现 JWT 工具和中间件
3. 创建登录/注册页面
4. 实现邮箱验证流程

### Phase 2: 权限系统（P0）
1. 实现权限检查服务
2. 创建权限中间件
3. 创建用户管理界面

### Phase 3: 存储系统（P0）
1. 实现存储源插件接口
2. 创建 R2 存储源实现
3. 创建文件上传 API
4. 创建文件管理界面

### Phase 4: 文件管理（P1）
1. 文件夹操作
2. 文件预览
3. 文件分享
4. 在线解压缩

## 📝 注意事项
- 首个注册用户自动成为 Owner
- 所有文件统一存储，通过权限控制访问
- 邮箱验证强制启用
- JWT token 默认有效期 7 天
- 验证码有效期 5 分钟
- 重发验证码冷却时间 60 秒

## 🐛 调试工具
- Prisma Studio: `pnpm db:studio`
- 查看数据库日志: 设置 `DATABASE_URL` 并检查 Prisma 日志
- 邮件测试: 使用 Mailtrap 或类似服务

祝开发顺利！ 🎉

