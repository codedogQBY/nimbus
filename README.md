# ☁️ Nimbus - 多源聚合网盘

一个开源、安全、高效的**个人网盘解决方案**，通过聚合多个免费存储服务，为个人用户提供大容量、高可用的云存储体验。

## ✨ 核心特性

### 🎯 个人网盘 + RBAC权限管理
- **文件统一存储**: 所有文件不做用户隔离，存储在共享空间
- **细粒度权限控制**: 通过RBAC系统实现不同用户的访问控制
- **多角色支持**: Owner、Admin、Editor、Viewer、Guest
- **21个权限维度**: 文件、文件夹、存储源、用户、设置等

### 🔐 完整的认证系统
- **邮箱验证**: 注册强制邮箱验证（6位验证码，5分钟有效期）
- **灵活登录**: 支持用户名或邮箱登录
- **密码重置**: 通过邮箱重置密码
- **安全机制**: 频率限制、尝试次数限制、审计日志

### 💾 多源聚合存储
- **插件式扩展**: 统一接口，易于扩展新存储源
- **智能选择**: 自动选择最优存储源
- **文件夹同步**: 所有存储源自动维护相同的目录结构
- **故障转移**: 存储源故障自动切换

### 🎨 温暖复古UI
- **60-30-10配色**: 奶油绿 + 浅卡其 + 琥珀棕
- **HeroUI组件**: 现代化的React UI库
- **响应式设计**: 完美适配各种设备
- **暗色模式**: 支持亮色/暗色主题切换

## 🚀 快速开始

### 环境要求
- Node.js 20+
- PostgreSQL 15+
- pnpm 9+

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/nimbus.git
cd nimbus

# 2. 安装依赖
pnpm install

# 3. 启动PostgreSQL (使用Docker)
docker run --name nimbus-postgres \
  -e POSTGRES_USER=nimbus \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=nimbus \
  -p 5432:5432 \
  -d postgres:15

# 4. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，配置必要的环境变量：
# - DATABASE_URL: PostgreSQL 连接地址
# - JWT_SECRET: JWT密钥（至少32个字符）
# - SMTP_*: 邮件服务器配置
# - INIT_OWNER_*: 初始 Owner 账号配置

# 5. 一键初始化（推荐）
pnpm setup
# 这将自动执行：
# - 生成 Prisma 客户端
# - 推送数据库结构
# - 运行种子数据（创建角色和权限）
# - 创建 Owner 用户

# 或者分步执行：
pnpm db:generate   # 生成 Prisma 客户端
pnpm db:push       # 推送数据库结构
pnpm db:seed       # 运行种子数据
pnpm init:owner    # 创建 Owner 用户

# 6. 启动开发服务器
pnpm dev

# 7. 访问应用
# 浏览器打开 http://localhost:3000
# 使用配置的 Owner 账号登录
```

## 📖 文档

- [产品需求文档](./docs/product-requirements.md)
- [技术架构文档](./docs/technical-architecture.md)
- [UI设计规范](./docs/ui-design-guidelines.md)
- [开发环境设置](./docs/SETUP.md)

## 🏗️ 项目结构

```
nimbus/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 认证页面（登录、注册等）
│   ├── (dashboard)/         # 主应用页面（文件、存储、用户等）
│   └── api/                 # API路由
│       └── auth/            # 认证API
├── components/              # React组件
├── lib/                     # 核心库
│   ├── auth.ts             # JWT和认证工具
│   ├── email.ts            # 邮件服务
│   ├── permissions.ts      # 权限检查服务
│   ├── prisma.ts           # Prisma客户端
│   └── storage/            # 存储源插件系统
│       ├── base.ts         # 存储源抽象接口
│       ├── r2.ts           # Cloudflare R2实现
│       ├── manager.ts      # 存储源管理器
│       └── folder-sync.ts  # 文件夹同步管理器
├── config/                  # 配置文件
│   ├── site.ts             # 站点配置
│   └── email.ts            # 邮件配置
├── prisma/                  # Prisma ORM
│   ├── schema.prisma       # 数据库Schema
│   └── seed.ts             # 种子数据
└── docs/                    # 文档
```

## 🎨 技术栈

### 前端
- **框架**: Next.js 15 (App Router)
- **UI库**: HeroUI v2 + Tailwind CSS
- **状态管理**: Zustand
- **表单验证**: Zod
- **HTTP客户端**: Ky
- **文件上传**: Uppy
- **图标**: Lucide React

### 后端
- **运行时**: Node.js 20+
- **框架**: Next.js API Routes
- **数据库**: PostgreSQL 15+
- **ORM**: Prisma
- **认证**: JWT (jsonwebtoken)
- **加密**: bcryptjs
- **邮件**: Nodemailer
- **图片处理**: Sharp

### 存储层
- **Cloudflare R2**: AWS SDK v3
- **七牛云**: qiniu SDK (待实现)
- **Telegram**: grammY Bot (待实现)
- **GitHub**: Octokit (待实现)

## 🔑 预设角色与权限

### 角色
1. **Owner（所有者）**: 拥有所有权限，系统唯一
2. **Admin（管理员）**: 管理文件和用户，配置存储源
3. **Editor（编辑者）**: 上传、编辑、删除文件
4. **Viewer（查看者）**: 只读访问，可下载
5. **Guest（访客）**: 临时访问指定内容

### 权限类别
- **文件**: upload, download, delete, rename, move, share, view
- **文件夹**: create, delete, rename, move
- **存储源**: view, manage, test
- **用户**: view, manage, assign_roles
- **设置**: view, manage
- **分享**: view, manage

## 🎨 配色方案

采用温暖复古的配色，遵循60-30-10法则：

- **主色 (60%)**: 奶油绿 `#D4E2D4` - 页面背景、卡片
- **辅助色 (30%)**: 浅卡其 `#E8E1D0` - 内容区块、纸张质感
- **点缀色 (10%)**: 琥珀棕 `#B5651D` - 按钮、链接
- **文字色**: 深橄榄绿 `#556B2F` - 主要文字

## 📝 开发进度

### ✅ 已完成
- [x] 项目基础设施搭建
- [x] 数据库设计与迁移
- [x] 认证系统（注册、登录、邮箱验证）
- [x] RBAC权限系统
- [x] 存储源插件架构
- [x] R2存储源实现
- [x] 文件夹同步管理器
- [x] UI主题配置
- [x] 基础页面（登录、注册、文件管理等）
- [x] 文件上传功能
- [x] 文件列表和预览
- [x] 文件分享功能
- [x] 存储源管理界面
- [x] 用户管理界面

### 📅 计划中
- [ ] 在线解压缩
- [ ] 七牛云存储源
- [ ] Telegram存储源
- [ ] GitHub存储源
- [ ] 文件搜索
- [ ] 批量操作
- [ ] 移动端适配

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

## 📄 许可证

MIT License

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [HeroUI](https://heroui.com/)
- [Prisma](https://www.prisma.io/)
- [Cloudflare R2](https://www.cloudflare.com/products/r2/)

---

**Nimbus** - 让云存储更简单、更安全、更自由 ☁️
