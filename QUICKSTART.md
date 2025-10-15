# 🚀 Nimbus 快速开始指南

## 前提条件

- ✅ Node.js 20+
- ✅ PostgreSQL 15+
- ✅ pnpm 9+

## 5分钟快速启动

### 1️⃣ 安装依赖

```bash
pnpm install
```

### 2️⃣ 启动 PostgreSQL

使用 Docker（推荐）：

```bash
docker run --name nimbus-postgres \
  -e POSTGRES_USER=nimbus \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=nimbus \
  -p 5432:5432 \
  -d postgres:15
```

### 3️⃣ 配置环境变量

```bash
# 复制示例文件
cp .env.example .env.local

# 编辑 .env.local，至少配置以下项：
```

打开 `.env.local`，修改以下配置：

```bash
# 数据库（如果使用上面的Docker命令，无需修改）
DATABASE_URL="postgresql://nimbus:password@localhost:5432/nimbus?schema=public"

# JWT密钥（生成随机密钥）
JWT_SECRET="$(openssl rand -base64 32)"

# SMTP邮件配置（必须配置）
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-gmail-app-password"
SMTP_FROM="noreply@nimbus.com"

# Owner 初始账号
INIT_OWNER_USERNAME="admin"
INIT_OWNER_EMAIL="admin@nimbus.com"
INIT_OWNER_PASSWORD="Admin@123456"  # 请改成强密码
```

### 4️⃣ 初始化数据库

```bash
pnpm setup
```

执行完成后，你会看到：

```
✅ Owner 用户创建成功！
   用户名: admin
   邮箱: admin@nimbus.com
   ID: 1
✅ Owner 角色分配成功
🎉 初始化完成！
```

### 5️⃣ 启动应用

```bash
pnpm dev
```

### 6️⃣ 访问应用

打开浏览器访问：http://localhost:3000

使用 Owner 账号登录：

- 用户名：`admin`（或你配置的用户名）
- 密码：你在 `.env.local` 中设置的密码

## 📧 Gmail SMTP 配置

如果使用 Gmail 发送邮件，需要：

1. **开启两步验证**

   - 访问 https://myaccount.google.com/security
   - 开启两步验证

2. **生成应用专用密码**

   - 访问 https://myaccount.google.com/apppasswords
   - 创建新的应用密码
   - 将生成的密码填入 `SMTP_PASSWORD`

3. **配置示例**

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="yourname@gmail.com"
SMTP_PASSWORD="abcd efgh ijkl mnop"  # Gmail应用密码（16位）
SMTP_FROM="noreply@nimbus.com"
```

## 🛠️ 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器
pnpm lint             # 代码检查

# 数据库
pnpm db:generate      # 生成 Prisma 客户端
pnpm db:push          # 推送数据库结构
pnpm db:seed          # 运行种子数据
pnpm db:studio        # 打开数据库管理界面
pnpm db:migrate       # 创建迁移文件

# 初始化
pnpm setup            # 一键初始化（推荐）
pnpm init:owner       # 创建 Owner 用户
```

## 🐛 常见问题

### Q: 提示"邮件发送失败"

**A**: 检查 SMTP 配置是否正确，特别是：

- Gmail 需要应用专用密码
- QQ邮箱需要授权码
- 确认端口和 secure 设置

### Q: 数据库连接失败

**A**: 检查：

- PostgreSQL 是否正在运行
- DATABASE_URL 是否正确
- 数据库是否已创建

### Q: pnpm setup 失败

**A**: 分步执行命令，查看具体哪一步出错：

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm init:owner
```

### Q: Owner 用户已存在

**A**: 如果需要重新创建，先删除数据库中的用户：

```sql
-- 连接数据库后执行
DELETE FROM users WHERE is_owner = true;
-- 然后重新运行
pnpm init:owner
```

## 📚 更多文档

- [README.md](./README.md) - 项目介绍
- [docs/SETUP.md](./docs/SETUP.md) - 详细设置指南
- [docs/DEVELOPMENT_PROGRESS.md](./docs/DEVELOPMENT_PROGRESS.md) - 开发进度
- [docs/product-requirements.md](./docs/product-requirements.md) - 产品需求
- [docs/technical-architecture.md](./docs/technical-architecture.md) - 技术架构
- [docs/ui-design-guidelines.md](./docs/ui-design-guidelines.md) - UI设计规范

## 🎉 开始使用

现在你可以：

1. ✅ 使用 Owner 账号登录
2. ✅ 创建新用户并分配角色
3. ✅ 查看文件管理页面
4. ✅ 查看存储源管理页面
5. ✅ 管理系统用户

享受 Nimbus 带来的便捷云存储体验！ ☁️
