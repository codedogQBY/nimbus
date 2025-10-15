# ✅ Nimbus 启动检查清单

按照此清单逐步完成项目启动，确保一切正常运行。

## 📋 启动前检查

### 1. 环境检查

- [ ] Node.js 版本 >= 20.0.0
  ```bash
  node --version  # 应显示 v20.x.x
  ```
- [ ] pnpm 已安装
  ```bash
  pnpm --version  # 应显示 9.x.x 或更高
  ```
- [ ] PostgreSQL 已安装或可用
  ```bash
  psql --version  # 或使用 Docker
  ```

### 2. 依赖安装

- [ ] 安装项目依赖
  ```bash
  pnpm install
  ```
  预期结果：`Done in x.xs`，无错误

### 3. PostgreSQL 数据库

- [ ] 启动 PostgreSQL 服务

  ```bash
  # Docker 方式（推荐）
  docker run --name nimbus-postgres \
    -e POSTGRES_USER=nimbus \
    -e POSTGRES_PASSWORD=password \
    -e POSTGRES_DB=nimbus \
    -p 5432:5432 \
    -d postgres:15

  # 验证运行状态
  docker ps | grep nimbus-postgres
  ```

- [ ] 或连接到现有 PostgreSQL
  - 创建数据库：`CREATE DATABASE nimbus;`
  - 记录连接信息

### 4. 环境变量配置

- [ ] 复制示例文件

  ```bash
  cp .env.example .env.local
  ```

- [ ] 编辑 `.env.local`，配置以下必填项：

#### 4.1 数据库配置 ⭐ 必填

```bash
DATABASE_URL="postgresql://nimbus:password@localhost:5432/nimbus?schema=public"
```

- [ ] 根据实际情况修改用户名、密码、主机、端口

#### 4.2 JWT 配置 ⭐ 必填

```bash
JWT_SECRET="$(openssl rand -base64 32)"
```

- [ ] 生成强随机密钥（至少32字符）

#### 4.3 SMTP 配置 ⭐ 必填

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-gmail-app-password"
SMTP_FROM="noreply@nimbus.com"
```

- [ ] 配置邮件服务器信息
- [ ] Gmail 需要生成应用专用密码
- [ ] 测试邮件配置（发送测试邮件）

#### 4.4 Owner 初始账号 ⭐ 必填

```bash
INIT_OWNER_USERNAME="admin"
INIT_OWNER_EMAIL="admin@nimbus.com"
INIT_OWNER_PASSWORD="Admin@123456"
```

- [ ] 设置管理员用户名
- [ ] 设置管理员邮箱
- [ ] **设置强密码**（至少8字符，含大小写字母和数字）

#### 4.5 存储源配置（可选）

根据需要配置一个或多个存储源：

- [ ] Cloudflare R2
- [ ] 七牛云
- [ ] Telegram Bot
- [ ] GitHub Repository

### 5. 数据库初始化

- [ ] 一键初始化（推荐）

  ```bash
  pnpm setup
  ```

  或分步执行：

  - [ ] `pnpm db:generate` - 生成 Prisma 客户端
  - [ ] `pnpm db:push` - 推送数据库结构
  - [ ] `pnpm db:seed` - 创建角色和权限
  - [ ] `pnpm init:owner` - 创建 Owner 用户

- [ ] 验证初始化结果
  ```bash
  pnpm db:studio
  ```
  检查：
  - `users` 表中有 1 个 Owner 用户
  - `roles` 表中有 5 个角色
  - `permissions` 表中有 21 个权限
  - `role_permissions` 表中有权限分配记录

### 6. 启动应用

- [ ] 启动开发服务器
  ```bash
  pnpm dev
  ```
- [ ] 检查控制台输出

  ```
  ✓ Ready in Xms
  ○ Local: http://localhost:3000
  ```

- [ ] 访问应用
  ```bash
  open http://localhost:3000
  ```

### 7. 首次登录

- [ ] 自动跳转到登录页面
- [ ] 使用 Owner 账号登录
  - 用户名：`.env.local` 中的 `INIT_OWNER_USERNAME`
  - 密码：`.env.local` 中的 `INIT_OWNER_PASSWORD`
- [ ] 登录成功，进入文件管理页面

### 8. 验证功能

- [ ] 文件管理页面正常显示
- [ ] 用户菜单可以打开
- [ ] 导航栏正常工作
- [ ] 可以访问存储源管理页面
- [ ] 可以访问用户管理页面（Owner权限）

## 🎯 启动成功标志

如果以上所有步骤都打勾 ✅，恭喜你！Nimbus 已经成功启动！

你现在可以：

- ✅ 创建新用户并分配角色
- ✅ 配置存储源
- ✅ 开始开发和测试

## ⚠️ 常见启动问题

### 问题 1: 数据库连接失败

**症状**: `Error: Can't reach database server`

**解决**:

1. 检查 PostgreSQL 是否运行
   ```bash
   docker ps | grep nimbus-postgres
   ```
2. 检查 DATABASE_URL 是否正确
3. 尝试手动连接
   ```bash
   psql "postgresql://nimbus:password@localhost:5432/nimbus"
   ```

### 问题 2: 邮件发送失败

**症状**: 注册时提示"验证邮件发送失败"

**解决**:

1. 检查 SMTP 配置是否正确
2. Gmail 用户确认已生成应用专用密码
3. 测试 SMTP 连接
4. 查看控制台错误日志

### 问题 3: JWT_SECRET 未设置

**症状**: 登录后 token 无效

**解决**:

1. 确保 `.env.local` 中设置了 JWT_SECRET
2. JWT_SECRET 至少32个字符
3. 重启开发服务器

### 问题 4: Prisma 客户端未生成

**症状**: 导入 PrismaClient 报错

**解决**:

```bash
pnpm db:generate
```

### 问题 5: Owner 用户创建失败

**症状**: `pnpm init:owner` 报错

**解决**:

1. 检查密码是否满足强度要求
2. 检查用户名和邮箱是否已存在
3. 查看具体错误信息

## 📞 获取帮助

如果遇到其他问题：

1. 查看 [docs/SETUP.md](./docs/SETUP.md) 详细文档
2. 检查控制台错误日志
3. 查看 Prisma Studio 数据库状态
4. 提交 Issue 到 GitHub

## 🎉 下一步

启动成功后，建议：

1. ✅ 修改 Owner 密码（首次登录后）
2. ✅ 配置至少一个存储源
3. ✅ 创建其他用户账号
4. ✅ 开始使用文件管理功能

Happy Coding! 🚀
