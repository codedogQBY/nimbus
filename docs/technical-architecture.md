# Nimbus 多源聚合网盘 - 技术架构文档

## 1. 系统架构概述

### 1.1 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  Storage Layer  │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Multi-Source)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌─────────┐             ┌─────────┐            ┌─────────┐
    │   UI    │             │   API   │            │   R2    │
    │ HeroUI  │             │Gateway  │            │  七牛云  │
    └─────────┘             └─────────┘            │   TG    │
                                   │               │ GitHub  │
                              ┌─────────┐          └─────────┘
                              │Database │
                              │(PgSQL)  │
                              └─────────┘
```

### 1.2 核心设计原则
- **存储源抽象**: 统一接口，插件化扩展
- **文件夹分布**: 同一文件夹的文件可分布在不同存储源
- **隐私保护**: 中间层代理，隐藏真实存储源
- **高可用性**: 多源备份，故障自动切换
- **可扩展性**: 模块化设计，易于扩展新功能

## 2. 技术栈选择

### 2.1 前端技术栈
```json
{
  "framework": "Next.js 14+ (App Router)",
  "ui_library": "HeroUI v2",
  "styling": "Tailwind CSS",
  "state_management": "Zustand",
  "http_client": "Ky",
  "file_upload": "Uppy",
  "icons": "Lucide React",
  "animations": "Framer Motion",
  "validation": "Zod"
}
```

### 2.2 后端技术栈
```json
{
  "runtime": "Node.js 20+",
  "framework": "Next.js 14+ API Routes",
  "database": "PostgreSQL 15+",
  "orm": "Prisma ORM",
  "authentication": "Auth.js (NextAuth.js v5)",
  "validation": "Zod",
  "file_processing": "Sharp (images), FFmpeg (videos)",
  "compression": "node-stream-zip, 7zip-bin"
}
```

### 2.3 存储层技术
```json
{
  "cloudflare_r2": "AWS SDK v3",
  "qiniu": "qiniu SDK",
  "telegram": "grammY Bot Framework",
  "github": "Octokit",
  "s3_compatible": "AWS SDK v3"
}
```

## 3. 数据库设计

### 3.1 系统架构说明
Nimbus 采用**个人网盘 + RBAC权限管理**架构：
- **文件统一存储**: 所有文件不做用户隔离，存储在共享空间
- **权限细分控制**: 通过RBAC系统实现不同用户的访问控制
- **多角色支持**: 用户可拥有多个角色，权限按角色累加
- **应用场景**: 个人使用、家庭共享、访客访问等

### 3.2 数据表结构

#### 用户表 (users)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  is_owner BOOLEAN DEFAULT FALSE, -- 是否为所有者（系统唯一）
  is_active BOOLEAN DEFAULT TRUE, -- 账号是否激活
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_owner ON users(is_owner);
```

#### 角色表 (roles)
```sql
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL, -- 角色名称：owner, admin, editor, viewer, guest
  display_name VARCHAR(100) NOT NULL, -- 显示名称
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE, -- 是否为系统预设角色
  priority INTEGER DEFAULT 0, -- 优先级，数字越大优先级越高
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_name ON roles(name);

-- 插入预设角色
INSERT INTO roles (name, display_name, description, is_system, priority) VALUES
('owner', '所有者', '系统所有者，拥有所有权限', TRUE, 100),
('admin', '管理员', '管理文件和用户，配置存储源', TRUE, 80),
('editor', '编辑者', '上传、编辑、删除文件', TRUE, 60),
('viewer', '查看者', '只读访问，可下载文件', TRUE, 40),
('guest', '访客', '临时访问指定内容', TRUE, 20);
```

#### 权限表 (permissions)
```sql
CREATE TABLE permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL, -- 权限标识：files.upload, files.delete 等
  resource VARCHAR(50) NOT NULL, -- 资源类型：files, folders, storage, users, settings
  action VARCHAR(50) NOT NULL, -- 操作类型：upload, download, delete, view, manage
  display_name VARCHAR(100) NOT NULL, -- 显示名称
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_resource ON permissions(resource);

-- 插入预设权限
INSERT INTO permissions (name, resource, action, display_name, description) VALUES
-- 文件权限
('files.upload', 'files', 'upload', '上传文件', '允许上传新文件'),
('files.download', 'files', 'download', '下载文件', '允许下载文件'),
('files.delete', 'files', 'delete', '删除文件', '允许删除文件'),
('files.rename', 'files', 'rename', '重命名文件', '允许重命名文件'),
('files.move', 'files', 'move', '移动文件', '允许移动文件到其他文件夹'),
('files.share', 'files', 'share', '分享文件', '允许创建文件分享链接'),
('files.view', 'files', 'view', '查看文件', '允许查看文件列表和详情'),
-- 文件夹权限
('folders.create', 'folders', 'create', '创建文件夹', '允许创建新文件夹'),
('folders.delete', 'folders', 'delete', '删除文件夹', '允许删除文件夹'),
('folders.rename', 'folders', 'rename', '重命名文件夹', '允许重命名文件夹'),
('folders.move', 'folders', 'move', '移动文件夹', '允许移动文件夹'),
-- 存储源权限
('storage.view', 'storage', 'view', '查看存储源', '允许查看存储源信息'),
('storage.manage', 'storage', 'manage', '管理存储源', '允许添加、编辑、删除存储源'),
('storage.test', 'storage', 'test', '测试存储源', '允许测试存储源连接'),
-- 用户权限
('users.view', 'users', 'view', '查看用户', '允许查看用户列表'),
('users.manage', 'users', 'manage', '管理用户', '允许添加、编辑、删除用户'),
('users.assign_roles', 'users', 'assign_roles', '分配角色', '允许为用户分配角色'),
-- 系统设置权限
('settings.view', 'settings', 'view', '查看设置', '允许查看系统设置'),
('settings.manage', 'settings', 'manage', '管理设置', '允许修改系统设置'),
-- 分享权限
('shares.view', 'shares', 'view', '查看分享', '允许查看分享列表'),
('shares.manage', 'shares', 'manage', '管理分享', '允许管理所有分享链接');
```

#### 角色权限关联表 (role_permissions)
```sql
CREATE TABLE role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- 为预设角色分配权限
-- Owner: 所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Admin: 除系统设置管理外的所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name != 'settings.manage';

-- Editor: 文件和文件夹的基本操作权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE name IN (
  'files.upload', 'files.download', 'files.delete', 'files.rename', 'files.move', 'files.view',
  'folders.create', 'folders.delete', 'folders.rename', 'folders.move',
  'storage.view', 'shares.view'
);

-- Viewer: 只读权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE name IN (
  'files.view', 'files.download', 'storage.view'
);

-- Guest: 最小权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions WHERE name IN (
  'files.view', 'files.download'
);
```

#### 用户角色关联表 (user_roles)
```sql
CREATE TABLE user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  granted_by INTEGER, -- 授予角色的用户ID
  expires_at DATETIME, -- 过期时间，NULL表示永不过期
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id),
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);
```

#### 权限审计日志表 (permission_logs)
```sql
CREATE TABLE permission_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL, -- 执行的操作
  resource_type VARCHAR(50) NOT NULL, -- 资源类型
  resource_id INTEGER, -- 资源ID
  permission_required VARCHAR(100), -- 所需权限
  granted BOOLEAN NOT NULL, -- 是否授权
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_permission_logs_user_id ON permission_logs(user_id);
CREATE INDEX idx_permission_logs_created_at ON permission_logs(created_at);
CREATE INDEX idx_permission_logs_granted ON permission_logs(granted);
```

#### 邮箱验证码表 (email_verifications)
```sql
CREATE TABLE email_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(100) NOT NULL,
  code VARCHAR(6) NOT NULL, -- 6位数字验证码
  type VARCHAR(20) NOT NULL, -- 类型：register, reset_password, change_email
  user_id INTEGER, -- 已有用户（重置密码、修改邮箱）
  is_verified BOOLEAN DEFAULT FALSE, -- 是否已验证
  attempts INTEGER DEFAULT 0, -- 尝试次数
  max_attempts INTEGER DEFAULT 5, -- 最大尝试次数
  expires_at DATETIME NOT NULL, -- 过期时间（5分钟后）
  verified_at DATETIME, -- 验证时间
  ip_address VARCHAR(45),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_code ON email_verifications(code);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
```

#### 邮件发送日志表 (email_logs)
```sql
CREATE TABLE email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 邮件类型：verification, reset_password, notification
  status VARCHAR(20) NOT NULL, -- 状态：pending, sent, failed, bounced
  error_message TEXT, -- 错误信息
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_logs_email ON email_logs(email);
CREATE INDEX idx_email_logs_type ON email_logs(type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);
```

#### 登录历史表 (login_history)
```sql
CREATE TABLE login_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  login_method VARCHAR(20) NOT NULL, -- 登录方式：username, email
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) NOT NULL, -- 状态：success, failed, blocked
  failure_reason VARCHAR(100), -- 失败原因
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_created_at ON login_history(created_at);
CREATE INDEX idx_login_history_ip_address ON login_history(ip_address);
```

#### 存储源配置表 (storage_sources)
```sql
-- 个人网盘模式：存储源为全局配置，不与特定用户关联
CREATE TABLE storage_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'r2', 'qiniu', 'telegram', 'github'
  config JSON NOT NULL, -- 存储源配置信息（加密存储）
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0, -- 优先级，数字越大优先级越高
  quota_used BIGINT DEFAULT 0,
  quota_limit BIGINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_storage_sources_type ON storage_sources(type);
CREATE INDEX idx_storage_sources_is_active ON storage_sources(is_active);
```

#### 文件夹表 (folders)
```sql
-- 个人网盘模式：文件夹不做用户隔离，统一存储
CREATE TABLE folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER, -- 父文件夹ID，NULL为根目录
  path VARCHAR(1000) NOT NULL, -- 完整路径
  created_by INTEGER NOT NULL, -- 创建者
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_path ON folders(path);
CREATE INDEX idx_folders_created_by ON folders(created_by);
```

#### 文件表 (files)
```sql
-- 个人网盘模式：文件不做用户隔离，统一存储
CREATE TABLE files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folder_id INTEGER,
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  md5_hash VARCHAR(32) NOT NULL,
  sha256_hash VARCHAR(64),
  storage_source_id INTEGER NOT NULL,
  storage_path VARCHAR(500) NOT NULL, -- 在存储源中的路径
  is_public BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  uploaded_by INTEGER NOT NULL, -- 上传者
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
  FOREIGN KEY (storage_source_id) REFERENCES storage_sources(id)
);

CREATE INDEX idx_files_folder_id ON files(folder_id);
CREATE INDEX idx_files_md5_hash ON files(md5_hash);
CREATE INDEX idx_files_storage_source_id ON files(storage_source_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_mime_type ON files(mime_type);
```

#### 分享链接表 (shares)
```sql
CREATE TABLE shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER,
  folder_id INTEGER,
  share_token VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- 可选的访问密码
  expires_at DATETIME, -- 过期时间，NULL表示永不过期
  download_limit INTEGER, -- 下载次数限制，NULL表示无限制
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER NOT NULL, -- 创建分享的用户
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX idx_shares_token ON shares(share_token);
CREATE INDEX idx_shares_created_by ON shares(created_by);
CREATE INDEX idx_shares_expires_at ON shares(expires_at);
CREATE INDEX idx_shares_file_id ON shares(file_id);
CREATE INDEX idx_shares_folder_id ON shares(folder_id);
```

### 3.3 RBAC权限检查实现

#### 权限检查服务
```typescript
class PermissionService {
  private db: Database;
  private permissionCache: Map<number, Set<string>> = new Map();

  /**
   * 检查用户是否拥有指定权限
   */
  async hasPermission(userId: number, permissionName: string): Promise<boolean> {
    // 检查所有者权限
    const user = await this.getUserById(userId);
    if (user.is_owner) {
      return true; // 所有者拥有所有权限
    }

    // 从缓存获取用户权限
    let userPermissions = this.permissionCache.get(userId);
    
    if (!userPermissions) {
      userPermissions = await this.loadUserPermissions(userId);
      this.permissionCache.set(userId, userPermissions);
    }

    return userPermissions.has(permissionName);
  }

  /**
   * 加载用户的所有权限（合并所有角色的权限）
   */
  private async loadUserPermissions(userId: number): Promise<Set<string>> {
    const permissions = await this.db.query(`
      SELECT DISTINCT p.name
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    `, [userId]);

    return new Set(permissions.map(p => p.name));
  }

  /**
   * 批量检查权限
   */
  async hasPermissions(userId: number, permissionNames: string[]): Promise<boolean> {
    for (const permission of permissionNames) {
      if (!await this.hasPermission(userId, permission)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 检查用户是否拥有任一权限（OR关系）
   */
  async hasAnyPermission(userId: number, permissionNames: string[]): Promise<boolean> {
    for (const permission of permissionNames) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 获取用户的所有权限
   */
  async getUserPermissions(userId: number): Promise<Permission[]> {
    return await this.db.query(`
      SELECT DISTINCT p.*
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
        AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    `, [userId]);
  }

  /**
   * 获取用户的所有角色
   */
  async getUserRoles(userId: number): Promise<Role[]> {
    return await this.db.query(`
      SELECT r.*, ur.expires_at
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
        AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
      ORDER BY r.priority DESC
    `, [userId]);
  }

  /**
   * 为用户分配角色
   */
  async assignRole(
    userId: number, 
    roleId: number, 
    grantedBy: number,
    expiresAt?: Date
  ): Promise<void> {
    await this.db.execute(`
      INSERT INTO user_roles (user_id, role_id, granted_by, expires_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (user_id, role_id) DO UPDATE SET
        granted_by = excluded.granted_by,
        expires_at = excluded.expires_at
    `, [userId, roleId, grantedBy, expiresAt]);

    // 清除缓存
    this.permissionCache.delete(userId);
  }

  /**
   * 移除用户角色
   */
  async removeRole(userId: number, roleId: number): Promise<void> {
    await this.db.execute(`
      DELETE FROM user_roles
      WHERE user_id = ? AND role_id = ?
    `, [userId, roleId]);

    // 清除缓存
    this.permissionCache.delete(userId);
  }

  /**
   * 记录权限检查日志
   */
  async logPermissionCheck(
    userId: number,
    action: string,
    resourceType: string,
    resourceId: number | null,
    permissionRequired: string,
    granted: boolean,
    request: Request
  ): Promise<void> {
    await this.db.execute(`
      INSERT INTO permission_logs (
        user_id, action, resource_type, resource_id,
        permission_required, granted, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      action,
      resourceType,
      resourceId,
      permissionRequired,
      granted,
      request.ip,
      request.headers['user-agent']
    ]);
  }
}
```

#### 权限检查中间件
```typescript
/**
 * 权限检查中间件工厂
 */
function requirePermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const permissionService = new PermissionService();
    const hasPermission = await permissionService.hasPermissions(userId, permissions);

    // 记录权限检查
    await permissionService.logPermissionCheck(
      userId,
      req.method + ' ' + req.path,
      req.params.resourceType || 'unknown',
      req.params.id ? parseInt(req.params.id) : null,
      permissions.join(', '),
      hasPermission,
      req
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '您没有执行此操作的权限',
        required: permissions
      });
    }

    next();
  };
}

/**
 * 任一权限检查中间件（OR关系）
 */
function requireAnyPermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const permissionService = new PermissionService();
    const hasPermission = await permissionService.hasAnyPermission(userId, permissions);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '您没有执行此操作的权限',
        required_any: permissions
      });
    }

    next();
  };
}

// 使用示例
app.post('/api/files/upload', 
  authenticate,
  requirePermission('files.upload'),
  uploadController.upload
);

app.delete('/api/files/:id',
  authenticate,
  requirePermission('files.delete'),
  filesController.delete
);

app.get('/api/users',
  authenticate,
  requireAnyPermission('users.view', 'users.manage'),
  usersController.list
);

app.post('/api/storage-sources',
  authenticate,
  requirePermission('storage.manage'),
  storageController.create
);
```

## 4. API 设计

### 4.1 RESTful API 规范

#### 认证相关 API
```typescript
// POST /api/auth/register - 用户注册（第一步）
interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  email: string; // 需要验证的邮箱
  verificationRequired: true;
}

// POST /api/auth/verify-email - 验证邮箱（第二步）
interface VerifyEmailRequest {
  email: string;
  code: string; // 6位验证码
}

interface VerifyEmailResponse {
  success: boolean;
  message: string;
  token?: string; // 验证成功后返回JWT token
  user?: User;
}

// POST /api/auth/resend-code - 重新发送验证码
interface ResendCodeRequest {
  email: string;
  type: 'register' | 'reset_password' | 'change_email';
}

interface ResendCodeResponse {
  success: boolean;
  message: string;
  canResendAt: string; // 下次可发送时间（60秒后）
}

// POST /api/auth/login - 用户登录（支持用户名或邮箱）
interface LoginRequest {
  identifier: string; // 用户名或邮箱
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  expiresIn?: number;
  requireEmailVerification?: boolean; // 是否需要先验证邮箱
  email?: string; // 如果需要验证，返回邮箱地址
}

// POST /api/auth/forgot-password - 忘记密码（第一步）
interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

// POST /api/auth/reset-password - 重置密码（第二步）
interface ResetPasswordRequest {
  email: string;
  code: string; // 验证码
  newPassword: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
  token?: string; // 重置成功后自动登录
}

// GET /api/auth/me - 获取当前用户信息
interface MeResponse {
  user: User;
  roles: Role[];
  permissions: string[];
}

// POST /api/auth/logout - 退出登录
interface LogoutResponse {
  success: boolean;
  message: string;
}
```

#### 文件管理 API
```typescript
// GET /api/files?folderId=123&page=1&limit=50
interface FileListResponse {
  files: File[];
  folders: Folder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// POST /api/files/upload
interface UploadRequest {
  folderId?: number;
  file: FormData;
  storageSourceId?: number; // 可选，系统自动选择
}

// PUT /api/files/:id/move
interface MoveFileRequest {
  targetFolderId: number;
}

// POST /api/files/:id/share
interface CreateShareRequest {
  password?: string;
  expiresAt?: string;
  downloadLimit?: number;
}
```

#### 存储源管理 API
```typescript
// GET /api/storage-sources
interface StorageSourcesResponse {
  sources: StorageSource[];
  totalQuota: number;
  usedQuota: number;
}

// POST /api/storage-sources
interface CreateStorageSourceRequest {
  name: string;
  type: 'r2' | 'qiniu' | 'telegram' | 'github';
  config: StorageSourceConfig;
}

// PUT /api/storage-sources/:id/test
interface TestStorageSourceResponse {
  success: boolean;
  error?: string;
  quotaInfo?: {
    used: number;
    total: number;
  };
}
```

### 4.2 文件代理 API
```typescript
// GET /api/proxy/file/:shareToken/:filename
// 通过分享令牌访问文件，隐藏真实存储源

// GET /api/proxy/download/:fileId
// 授权下载，需要 JWT 认证

// GET /api/proxy/thumbnail/:fileId
// 获取文件缩略图
```

## 5. 存储源插件系统

### 5.1 存储源抽象接口
```typescript
interface StorageSource {
  // 基础信息
  readonly type: string;
  readonly name: string;
  readonly config: StorageSourceConfig;

  // 连接和认证
  connect(config: StorageSourceConfig): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<boolean>;

  // 文件操作
  uploadFile(path: string, file: Buffer | ReadableStream): Promise<UploadResult>;
  downloadFile(path: string): Promise<ReadableStream>;
  deleteFile(path: string): Promise<void>;
  getFileInfo(path: string): Promise<FileInfo>;
  moveFile(oldPath: string, newPath: string): Promise<void>;
  copyFile(sourcePath: string, targetPath: string): Promise<void>;

  // 文件夹操作 (关键：所有存储源必须支持)
  createFolder(path: string): Promise<void>;
  deleteFolder(path: string, recursive?: boolean): Promise<void>;
  moveFolder(oldPath: string, newPath: string): Promise<void>;
  listFolder(path: string): Promise<FolderContents>;
  folderExists(path: string): Promise<boolean>;
  ensureFolderPath(path: string): Promise<void>; // 确保路径存在，递归创建

  // 配额管理
  getQuotaInfo(): Promise<QuotaInfo>;

  // 同步相关
  getLastSyncTime(): Promise<Date>;
  setLastSyncTime(time: Date): Promise<void>;
}

interface FolderContents {
  files: FileInfo[];
  folders: FolderInfo[];
  totalFiles: number;
  totalSize: number;
}

interface FileInfo {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  etag?: string;
  contentType?: string;
}

interface FolderInfo {
  name: string;
  path: string;
  lastModified: Date;
  itemCount: number;
}

interface UploadResult {
  path: string;
  size: number;
  etag?: string;
  uploadTime: Date;
}

interface QuotaInfo {
  used: number;
  total: number;
  available: number;
}
```
```

### 5.2 具体存储源实现

#### Cloudflare R2 实现
```typescript
class R2StorageSource implements StorageSource {
  private s3Client: S3Client;

  async connect(config: R2Config): Promise<void> {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async uploadFile(path: string, file: Buffer | ReadableStream): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: path,
      Body: file,
    });

    const result = await this.s3Client.send(command);
    return {
      path,
      size: file.length,
      etag: result.ETag,
    };
  }

  // ... 其他方法实现
}
```

#### Telegram 存储实现
```typescript
class TelegramStorageSource implements StorageSource {
  private bot: Bot;
  private channelId: string;

  async connect(config: TelegramConfig): Promise<void> {
    this.bot = new Bot(config.botToken);
    this.channelId = config.channelId;
  }

  async uploadFile(path: string, file: Buffer): Promise<UploadResult> {
    // 大文件需要分片上传
    if (file.length > 50 * 1024 * 1024) { // 50MB
      return this.uploadLargeFile(path, file);
    }

    const message = await this.bot.api.sendDocument(this.channelId, {
      source: file,
      filename: path,
    });

    return {
      path: `${message.message_id}`,
      size: file.length,
    };
  }

  private async uploadLargeFile(path: string, file: Buffer): Promise<UploadResult> {
    const chunkSize = 20 * 1024 * 1024; // 20MB per chunk
    const chunks: string[] = [];

    for (let i = 0; i < file.length; i += chunkSize) {
      const chunk = file.slice(i, i + chunkSize);
      const message = await this.bot.api.sendDocument(this.channelId, {
        source: chunk,
        filename: `${path}.part${chunks.length}`,
      });
      chunks.push(message.message_id.toString());
    }

    // 保存分片信息
    const metaMessage = await this.bot.api.sendMessage(this.channelId,
      JSON.stringify({
        type: 'multipart',
        originalPath: path,
        chunks: chunks,
        totalSize: file.length,
      })
    );

    return {
      path: metaMessage.message_id.toString(),
      size: file.length,
    };
  }

  // ... 其他方法实现
}
```

### 5.3 文件夹同步管理器
```typescript
class FolderSyncManager {
  private sources: Map<number, StorageSource> = new Map();
  private syncQueue: SyncOperation[] = [];

  // 在所有存储源中同步创建文件夹
  async createFolderAcrossSources(
    userId: number,
    folderPath: string
  ): Promise<SyncResult> {
    const userSources = await this.getUserStorageSources(userId);
    const results: SourceSyncResult[] = [];

    for (const source of userSources) {
      try {
        await source.ensureFolderPath(folderPath);
        results.push({
          sourceId: source.id,
          success: true,
          timestamp: new Date(),
        });
      } catch (error) {
        results.push({
          sourceId: source.id,
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      }
    }

    return {
      success: results.every(r => r.success),
      results,
      affectedSources: userSources.length,
    };
  }

  // 合并所有存储源的文件夹内容
  async mergeFolderContents(
    userId: number,
    folderPath: string
  ): Promise<MergedFolderContents> {
    const userSources = await this.getActiveStorageSources(userId);
    const allFiles: FileInfo[] = [];
    const allFolders: FolderInfo[] = [];
    const sourceStatus: SourceStatus[] = [];

    await Promise.allSettled(
      userSources.map(async (source) => {
        try {
          const contents = await source.listFolder(folderPath);

          // 添加源信息到文件和文件夹
          contents.files.forEach(file => {
            allFiles.push({
              ...file,
              sourceId: source.id,
              sourceName: source.name,
              sourceType: source.type,
            });
          });

          contents.folders.forEach(folder => {
            // 去重文件夹（可能在多个源中都存在）
            if (!allFolders.find(f => f.path === folder.path)) {
              allFolders.push(folder);
            }
          });

          sourceStatus.push({
            sourceId: source.id,
            status: 'online',
            fileCount: contents.files.length,
            folderCount: contents.folders.length,
          });
        } catch (error) {
          sourceStatus.push({
            sourceId: source.id,
            status: 'error',
            error: error.message,
            fileCount: 0,
            folderCount: 0,
          });
        }
      })
    );

    return {
      files: allFiles,
      folders: allFolders,
      sourceStatus,
      totalFiles: allFiles.length,
      totalFolders: allFolders.length,
      sourcesQueried: userSources.length,
      sourcesOnline: sourceStatus.filter(s => s.status === 'online').length,
    };
  }

  // 同步文件夹重命名操作
  async renameFolderAcrossSources(
    userId: number,
    oldPath: string,
    newPath: string
  ): Promise<SyncResult> {
    const userSources = await this.getUserStorageSources(userId);
    const results: SourceSyncResult[] = [];

    for (const source of userSources) {
      try {
        // 检查旧文件夹是否存在
        const exists = await source.folderExists(oldPath);
        if (exists) {
          await source.moveFolder(oldPath, newPath);
        } else {
          // 如果不存在，创建新文件夹以保持同步
          await source.ensureFolderPath(newPath);
        }

        results.push({
          sourceId: source.id,
          success: true,
          timestamp: new Date(),
        });
      } catch (error) {
        results.push({
          sourceId: source.id,
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      }
    }

    return {
      success: results.every(r => r.success),
      results,
      affectedSources: userSources.length,
    };
  }

  // 智能删除文件夹（处理包含文件的情况）
  async deleteFolderAcrossSources(
    userId: number,
    folderPath: string,
    deleteFiles: boolean = false
  ): Promise<FolderDeleteResult> {
    const userSources = await this.getUserStorageSources(userId);
    const results: SourceDeleteResult[] = [];
    let totalFilesFound = 0;
    const filesInSources: Record<number, FileInfo[]> = {};

    // 首先检查每个源中的文件
    for (const source of userSources) {
      try {
        const contents = await source.listFolder(folderPath);
        filesInSources[source.id] = contents.files;
        totalFilesFound += contents.files.length;
      } catch (error) {
        // 文件夹不存在或无法访问
        filesInSources[source.id] = [];
      }
    }

    // 如果不允许删除文件且有文件存在，返回警告
    if (!deleteFiles && totalFilesFound > 0) {
      return {
        success: false,
        reason: 'folder_not_empty',
        totalFiles: totalFilesFound,
        filesInSources,
        results: [],
      };
    }

    // 执行删除操作
    for (const source of userSources) {
      try {
        const exists = await source.folderExists(folderPath);
        if (exists) {
          await source.deleteFolder(folderPath, true); // 递归删除
        }

        results.push({
          sourceId: source.id,
          success: true,
          deletedFiles: filesInSources[source.id].length,
          timestamp: new Date(),
        });
      } catch (error) {
        results.push({
          sourceId: source.id,
          success: false,
          error: error.message,
          deletedFiles: 0,
          timestamp: new Date(),
        });
      }
    }

    return {
      success: results.every(r => r.success),
      totalFiles: totalFilesFound,
      filesInSources,
      results,
    };
  }
}

interface SyncResult {
  success: boolean;
  results: SourceSyncResult[];
  affectedSources: number;
}

interface SourceSyncResult {
  sourceId: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

interface MergedFolderContents {
  files: (FileInfo & { sourceId: number; sourceName: string; sourceType: string })[];
  folders: FolderInfo[];
  sourceStatus: SourceStatus[];
  totalFiles: number;
  totalFolders: number;
  sourcesQueried: number;
  sourcesOnline: number;
}

interface SourceStatus {
  sourceId: number;
  status: 'online' | 'offline' | 'error';
  error?: string;
  fileCount: number;
  folderCount: number;
}

interface FolderDeleteResult {
  success: boolean;
  reason?: string;
  totalFiles: number;
  filesInSources: Record<number, FileInfo[]>;
  results: SourceDeleteResult[];
}

interface SourceDeleteResult {
  sourceId: number;
  success: boolean;
  error?: string;
  deletedFiles: number;
  timestamp: Date;
}
```
### 5.4 智能存储源选择策略
```typescript
class StorageSourceManager {
  private sources: Map<number, StorageSource> = new Map();
  private folderSyncManager: FolderSyncManager;

  constructor() {
    this.folderSyncManager = new FolderSyncManager();
  }

  // 智能选择存储源
  async selectStorageSource(
    userId: number,
    fileSize: number,
    fileType: string
  ): Promise<StorageSource> {
    const userSources = await this.getUserStorageSources(userId);

    // 筛选可用的存储源
    const availableSources = userSources.filter(source => {
      const quotaInfo = source.getQuotaInfo();
      return quotaInfo.available >= fileSize && source.isActive;
    });

    if (availableSources.length === 0) {
      throw new Error('No available storage source');
    }

    // 选择策略：优先级 + 剩余空间 + 文件类型适配
    return this.selectByStrategy(availableSources, fileSize, fileType);
  }

  private selectByStrategy(
    sources: StorageSource[],
    fileSize: number,
    fileType: string
  ): StorageSource {
    // 1. 按优先级排序
    sources.sort((a, b) => b.priority - a.priority);

    // 2. 大文件优先选择R2/七牛云
    if (fileSize > 100 * 1024 * 1024) { // > 100MB
      const preferredSources = sources.filter(s =>
        s.type === 'r2' || s.type === 'qiniu'
      );
      if (preferredSources.length > 0) {
        return preferredSources[0];
      }
    }

    // 3. 图片/视频优先选择有CDN的源
    if (fileType.startsWith('image/') || fileType.startsWith('video/')) {
      const cdnSources = sources.filter(s =>
        s.type === 'r2' || s.type === 'qiniu'
      );
      if (cdnSources.length > 0) {
        return cdnSources[0];
      }
    }

    // 4. 默认选择剩余空间最多的
    return sources.reduce((max, current) => {
      const maxQuota = max.getQuotaInfo().available;
      const currentQuota = current.getQuotaInfo().available;
      return currentQuota > maxQuota ? current : max;
    });
  }
}
```

## 6. 文件夹同步与合并系统

### 6.1 文件上传流程
```typescript
class FileUploadService {
  constructor(
    private storageManager: StorageSourceManager,
    private folderSyncManager: FolderSyncManager
  ) {}

  async uploadFile(
    userId: number,
    folderId: number,
    file: Express.Multer.File
  ): Promise<File> {
    // 1. 获取文件夹路径
    const folderPath = await this.getFolderPath(folderId);

    // 2. 确保所有存储源都有对应的文件夹结构
    await this.folderSyncManager.ensureFolderExistsAcrossSources(
      userId,
      folderPath
    );

    // 3. 智能选择存储源（用户无需选择）
    const storageSource = await this.storageManager.selectOptimalStorageSource(
      userId,
      file.size,
      file.mimetype,
      folderPath
    );

    // 4. 上传文件到选定的存储源
    const uploadResult = await this.uploadToStorageSource(
      storageSource,
      folderPath,
      file
    );

    // 5. 保存文件记录到数据库
    const fileRecord = await this.createFileRecord({
      userId,
      folderId,
      name: file.originalname,
      size: file.size,
      storageSourceId: storageSource.id,
      storagePath: uploadResult.path,
      // ... 其他字段
    });

    return fileRecord;
  }

  // 确保文件夹在所有存储源中存在
  private async ensureFolderExistsAcrossSources(
    userId: number,
    folderPath: string
  ): Promise<void> {
    const syncResult = await this.folderSyncManager.createFolderAcrossSources(
      userId,
      folderPath
    );

    if (!syncResult.success) {
      // 记录同步失败的存储源，但不阻止上传
      logger.warn('Folder sync partially failed', {
        userId,
        folderPath,
        failedSources: syncResult.results.filter(r => !r.success),
      });
    }
  }
}
```

### 6.2 文件夹读取与合并
```typescript
class FolderService {
  constructor(private folderSyncManager: FolderSyncManager) {}

  async getFolderContents(
    userId: number,
    folderId: number,
    options: FolderQueryOptions = {}
  ): Promise<FolderContentsResponse> {
    // 1. 获取文件夹路径
    const folderPath = await this.getFolderPath(folderId);

    // 2. 从所有存储源合并文件夹内容
    const mergedContents = await this.folderSyncManager.mergeFolderContents(
      userId,
      folderPath
    );

    // 3. 应用过滤和排序
    const filteredContents = this.applyFiltersAndSorting(
      mergedContents,
      options
    );

    // 4. 分页处理
    const paginatedContents = this.applyPagination(
      filteredContents,
      options.page || 1,
      options.limit || 50
    );

    return {
      ...paginatedContents,
      sourceStatus: mergedContents.sourceStatus,
      syncInfo: {
        sourcesQueried: mergedContents.sourcesQueried,
        sourcesOnline: mergedContents.sourcesOnline,
        lastSyncTime: await this.getLastSyncTime(folderId),
      },
    };
  }

  // 创建文件夹（同步到所有存储源）
  async createFolder(
    userId: number,
    parentFolderId: number,
    folderName: string
  ): Promise<Folder> {
    // 1. 构建完整路径
    const parentPath = await this.getFolderPath(parentFolderId);
    const fullPath = `${parentPath}/${folderName}`;

    // 2. 在数据库中创建文件夹记录
    const folder = await this.createFolderRecord({
      userId,
      parentId: parentFolderId,
      name: folderName,
      path: fullPath,
    });

    // 3. 在所有存储源中同步创建文件夹
    const syncResult = await this.folderSyncManager.createFolderAcrossSources(
      userId,
      fullPath
    );

    // 4. 记录同步状态
    await this.recordSyncStatus(folder.id, syncResult);

    return folder;
  }

  // 重命名文件夹（同步到所有存储源）
  async renameFolder(
    userId: number,
    folderId: number,
    newName: string
  ): Promise<Folder> {
    const folder = await this.getFolderById(folderId);
    const oldPath = folder.path;
    const newPath = this.buildNewPath(oldPath, newName);

    // 1. 更新数据库记录
    const updatedFolder = await this.updateFolderRecord(folderId, {
      name: newName,
      path: newPath,
    });

    // 2. 同步重命名到所有存储源
    const syncResult = await this.folderSyncManager.renameFolderAcrossSources(
      userId,
      oldPath,
      newPath
    );

    // 3. 更新子文件夹路径
    await this.updateChildFolderPaths(folderId, oldPath, newPath);

    // 4. 记录同步状态
    await this.recordSyncStatus(folderId, syncResult);

    return updatedFolder;
  }

  // 删除文件夹（智能处理跨源文件）
  async deleteFolder(
    userId: number,
    folderId: number,
    force: boolean = false
  ): Promise<FolderDeleteResponse> {
    const folder = await this.getFolderById(folderId);

    // 1. 检查文件夹在各存储源的情况
    const deleteResult = await this.folderSyncManager.deleteFolderAcrossSources(
      userId,
      folder.path,
      force
    );

    if (!deleteResult.success && deleteResult.reason === 'folder_not_empty') {
      return {
        success: false,
        reason: 'folder_not_empty',
        conflictInfo: {
          totalFiles: deleteResult.totalFiles,
          filesInSources: deleteResult.filesInSources,
        },
      };
    }

    // 2. 删除数据库记录
    await this.deleteFolderRecord(folderId);

    // 3. 删除相关文件记录
    await this.deleteFilesInFolder(folderId);

    return {
      success: true,
      deletedFiles: deleteResult.totalFiles,
      sourceResults: deleteResult.results,
    };
  }
}

interface FolderQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'size' | 'modified';
  sortOrder?: 'asc' | 'desc';
  fileType?: string;
  searchQuery?: string;
}

interface FolderContentsResponse {
  files: FileWithSource[];
  folders: FolderInfo[];
  pagination: PaginationInfo;
  sourceStatus: SourceStatus[];
  syncInfo: SyncInfo;
}

interface FileWithSource extends FileInfo {
  sourceId: number;
  sourceName: string;
  sourceType: string;
}

interface SyncInfo {
  sourcesQueried: number;
  sourcesOnline: number;
  lastSyncTime: Date;
}

interface FolderDeleteResponse {
  success: boolean;
  reason?: string;
  deletedFiles?: number;
  sourceResults?: SourceDeleteResult[];
  conflictInfo?: {
    totalFiles: number;
    filesInSources: Record<number, FileInfo[]>;
  };
}
```

### 6.3 存储源故障处理
```typescript
class StorageSourceHealthManager {
  private healthChecks: Map<number, HealthCheckResult> = new Map();

  // 定期健康检查
  async performHealthChecks(userId: number): Promise<HealthReport> {
    const userSources = await this.getUserStorageSources(userId);
    const results: HealthCheckResult[] = [];

    for (const source of userSources) {
      try {
        const isOnline = await source.testConnection();
        const quotaInfo = isOnline ? await source.getQuotaInfo() : null;

        results.push({
          sourceId: source.id,
          status: isOnline ? 'online' : 'offline',
          responseTime: await this.measureResponseTime(source),
          quotaInfo,
          lastChecked: new Date(),
        });
      } catch (error) {
        results.push({
          sourceId: source.id,
          status: 'error',
          error: error.message,
          responseTime: null,
          quotaInfo: null,
          lastChecked: new Date(),
        });
      }
    }

    // 更新健康状态缓存
    results.forEach(result => {
      this.healthChecks.set(result.sourceId, result);
    });

    return {
      totalSources: userSources.length,
      onlineSources: results.filter(r => r.status === 'online').length,
      results,
      overallHealth: this.calculateOverallHealth(results),
    };
  }

  // 处理存储源故障转移
  async handleSourceFailover(
    failedSourceId: number,
    userId: number
  ): Promise<FailoverResult> {
    const remainingSources = await this.getHealthyStorageSources(userId);

    if (remainingSources.length === 0) {
      return {
        success: false,
        reason: 'no_healthy_sources',
      };
    }

    // 标记故障源为不可用
    await this.markSourceAsUnavailable(failedSourceId);

    // 重新分配新上传到其他源
    const newPrimarySource = this.selectBestSource(remainingSources);

    return {
      success: true,
      newPrimarySource: newPrimarySource.id,
      remainingSources: remainingSources.length,
    };
  }

  // 存储源恢复时的同步
  async handleSourceRecovery(
    recoveredSourceId: number,
    userId: number
  ): Promise<RecoveryResult> {
    // 1. 重新标记为可用
    await this.markSourceAsAvailable(recoveredSourceId);

    // 2. 获取需要同步的文件夹结构
    const userFolders = await this.getUserFolders(userId);

    // 3. 同步文件夹结构到恢复的存储源
    const syncResults: FolderSyncResult[] = [];
    const recoveredSource = await this.getStorageSource(recoveredSourceId);

    for (const folder of userFolders) {
      try {
        await recoveredSource.ensureFolderPath(folder.path);
        syncResults.push({
          folderPath: folder.path,
          success: true,
        });
      } catch (error) {
        syncResults.push({
          folderPath: folder.path,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: syncResults.every(r => r.success),
      syncedFolders: syncResults.filter(r => r.success).length,
      failedFolders: syncResults.filter(r => !r.success).length,
      syncResults,
    };
  }
}

interface HealthCheckResult {
  sourceId: number;
  status: 'online' | 'offline' | 'error';
  responseTime: number | null;
  quotaInfo: QuotaInfo | null;
  error?: string;
  lastChecked: Date;
}

interface HealthReport {
  totalSources: number;
  onlineSources: number;
  results: HealthCheckResult[];
  overallHealth: 'good' | 'degraded' | 'critical';
}

interface FailoverResult {
  success: boolean;
  reason?: string;
  newPrimarySource?: number;
  remainingSources?: number;
}

interface RecoveryResult {
  success: boolean;
  syncedFolders: number;
  failedFolders: number;
  syncResults: FolderSyncResult[];
}

interface FolderSyncResult {
  folderPath: string;
  success: boolean;
  error?: string;
}
```

## 7. 文件处理系统

### 7.1 文件上传处理
```typescript
class FileUploadService {
  async uploadFile(
    userId: number,
    folderId: number,
    file: Express.Multer.File,
    storageSourceId?: number
  ): Promise<File> {
    // 1. 文件校验
    await this.validateFile(file);

    // 2. 计算文件哈希
    const md5Hash = await this.calculateMD5(file.buffer);
    const sha256Hash = await this.calculateSHA256(file.buffer);

    // 3. 检查重复文件
    const existingFile = await this.findDuplicateFile(userId, md5Hash);
    if (existingFile) {
      return this.createFileReference(existingFile, folderId, file.originalname);
    }

    // 4. 选择存储源
    const storageSource = storageSourceId
      ? await this.getStorageSource(storageSourceId)
      : await this.storageManager.selectStorageSource(
          userId,
          file.size,
          file.mimetype
        );

    // 5. 生成存储路径
    const storagePath = this.generateStoragePath(userId, file.originalname);

    // 6. 上传到存储源
    const uploadResult = await storageSource.uploadFile(storagePath, file.buffer);

    // 7. 保存文件记录
    const fileRecord = await this.createFileRecord({
      userId,
      folderId,
      name: file.originalname,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      md5Hash,
      sha256Hash,
      storageSourceId: storageSource.id,
      storagePath: uploadResult.path,
    });

    // 8. 更新存储源使用量
    await this.updateStorageUsage(storageSource.id, file.size);

    return fileRecord;
  }

  private generateStoragePath(userId: number, filename: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const uuid = crypto.randomUUID();

    return `users/${userId}/${year}/${month}/${day}/${uuid}-${filename}`;
  }
}
```

### 6.2 文件下载代理
```typescript
class FileProxyService {
  async downloadFile(fileId: number, userId: number): Promise<ReadableStream> {
    // 1. 验证权限
    const file = await this.getFileWithPermission(fileId, userId);

    // 2. 获取存储源
    const storageSource = await this.getStorageSource(file.storageSourceId);

    // 3. 从存储源下载
    const stream = await storageSource.downloadFile(file.storagePath);

    // 4. 更新下载统计
    await this.updateDownloadCount(fileId);

    return stream;
  }

  async downloadByShareToken(shareToken: string, password?: string): Promise<{
    stream: ReadableStream;
    filename: string;
    mimeType: string;
  }> {
    // 1. 验证分享链接
    const share = await this.validateShareToken(shareToken, password);

    // 2. 检查访问限制
    await this.checkShareLimits(share);

    // 3. 获取文件
    const file = await this.getFile(share.fileId);
    const storageSource = await this.getStorageSource(file.storageSourceId);

    // 4. 下载文件
    const stream = await storageSource.downloadFile(file.storagePath);

    // 5. 更新分享统计
    await this.updateShareDownloadCount(share.id);

    return {
      stream,
      filename: file.name,
      mimeType: file.mimeType,
    };
  }
}
```

## 7. 在线解压缩系统

### 7.1 压缩文件处理
```typescript
class CompressionService {
  private readonly supportedFormats = ['zip', 'rar', '7z', 'tar', 'tar.gz'];

  async extractArchive(
    fileId: number,
    userId: number,
    targetFolderId: number,
    extractOptions: ExtractOptions = {}
  ): Promise<ExtractResult> {
    // 1. 获取文件流
    const fileStream = await this.fileProxy.downloadFile(fileId, userId);
    const file = await this.getFile(fileId);

    // 2. 检测压缩格式
    const format = this.detectCompressionFormat(file.name);
    if (!this.supportedFormats.includes(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }

    // 3. 创建临时文件
    const tempFilePath = await this.createTempFile(fileStream);

    try {
      // 4. 解压缩
      const extractor = this.getExtractor(format);
      const entries = await extractor.list(tempFilePath);

      // 5. 选择性解压
      const selectedEntries = extractOptions.selectedFiles || entries;
      const results: ExtractedFile[] = [];

      for (const entry of selectedEntries) {
        if (extractOptions.onProgress) {
          extractOptions.onProgress(entry.name, results.length, selectedEntries.length);
        }

        const extractedData = await extractor.extract(tempFilePath, entry.name);
        const uploadedFile = await this.uploadExtractedFile(
          userId,
          targetFolderId,
          entry.name,
          extractedData
        );

        results.push({
          originalPath: entry.name,
          fileId: uploadedFile.id,
          size: entry.size,
        });
      }

      return {
        success: true,
        extractedFiles: results,
        totalFiles: results.length,
      };
    } finally {
      // 6. 清理临时文件
      await this.cleanupTempFile(tempFilePath);
    }
  }

  private getExtractor(format: string): ArchiveExtractor {
    switch (format) {
      case 'zip':
        return new ZipExtractor();
      case 'rar':
        return new RarExtractor();
      case '7z':
        return new SevenZipExtractor();
      case 'tar':
      case 'tar.gz':
        return new TarExtractor();
      default:
        throw new Error(`No extractor for format: ${format}`);
    }
  }
}

interface ArchiveExtractor {
  list(filePath: string): Promise<ArchiveEntry[]>;
  extract(filePath: string, entryName: string): Promise<Buffer>;
}

class ZipExtractor implements ArchiveExtractor {
  async list(filePath: string): Promise<ArchiveEntry[]> {
    const zip = new StreamZip.async({ file: filePath });
    const entries = await zip.entries();

    return Object.values(entries).map(entry => ({
      name: entry.name,
      size: entry.size,
      isDirectory: entry.isDirectory,
      lastModified: entry.time,
    }));
  }

  async extract(filePath: string, entryName: string): Promise<Buffer> {
    const zip = new StreamZip.async({ file: filePath });
    return await zip.entryData(entryName);
  }
}
```

### 7.2 前端解压缩预览
```typescript
// 前端压缩文件预览组件
interface ArchivePreviewProps {
  fileId: number;
  onExtract: (selectedFiles: string[]) => void;
}

const ArchivePreview: React.FC<ArchivePreviewProps> = ({ fileId, onExtract }) => {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchiveEntries();
  }, [fileId]);

  const loadArchiveEntries = async () => {
    try {
      const response = await fetch(`/api/files/${fileId}/archive/entries`);
      const data = await response.json();
      setEntries(data.entries);
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = () => {
    onExtract(selectedFiles);
  };

  if (loading) {
    return <ArchivePreviewSkeleton />;
  }

  return (
    <div className="archive-preview">
      <div className="archive-header">
        <h3>压缩文件内容预览</h3>
        <Button onClick={handleExtract} disabled={selectedFiles.length === 0}>
          解压选中文件 ({selectedFiles.length})
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableColumn>
            <Checkbox
              isSelected={selectedFiles.length === entries.length}
              onChange={(checked) => {
                setSelectedFiles(checked ? entries.map(e => e.name) : []);
              }}
            />
          </TableColumn>
          <TableColumn>文件名</TableColumn>
          <TableColumn>大小</TableColumn>
          <TableColumn>修改时间</TableColumn>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.name}>
              <TableCell>
                <Checkbox
                  isSelected={selectedFiles.includes(entry.name)}
                  onChange={(checked) => {
                    if (checked) {
                      setSelectedFiles([...selectedFiles, entry.name]);
                    } else {
                      setSelectedFiles(selectedFiles.filter(f => f !== entry.name));
                    }
                  }}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileIcon type={entry.isDirectory ? 'folder' : 'file'} />
                  {entry.name}
                </div>
              </TableCell>
              <TableCell>{formatFileSize(entry.size)}</TableCell>
              <TableCell>{formatDate(entry.lastModified)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
```

## 8. 部署与运维

### 8.1 Docker 部署
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# 安装系统依赖
RUN apk add --no-cache \
    ffmpeg \
    imagemagick \
    p7zip \
    unrar

# 构建应用
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  nimbus:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/nimbus.db
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - nimbus
    restart: unless-stopped
```

### 8.2 环境变量配置
```bash
# .env.production
NODE_ENV=production
PORT=3000

# 数据库
DATABASE_URL=file:./data/nimbus.db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# 文件上传
MAX_FILE_SIZE=5368709120  # 5GB
ALLOWED_FILE_TYPES=*

# 存储源默认配置
DEFAULT_STORAGE_QUOTA=5368709120  # 5GB per user

# 日志
LOG_LEVEL=info
LOG_FILE=./logs/nimbus.log

# Redis (可选，用于缓存)
REDIS_URL=redis://localhost:6379
```

### 8.3 监控与日志
```typescript
// 监控中间件
export const monitoringMiddleware = (req: FastifyRequest, reply: FastifyReply, done: Function) => {
  const startTime = Date.now();

  reply.addHook('onSend', (request, reply, payload, done) => {
    const duration = Date.now() - startTime;

    // 记录API性能
    logger.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    // 慢查询警告
    if (duration > 1000) {
      logger.warn(`Slow API: ${request.method} ${request.url} took ${duration}ms`);
    }

    done();
  });

  done();
};

// 错误监控
export const errorHandler = (error: Error, request: FastifyRequest, reply: FastifyReply) => {
  logger.error({
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    body: request.body,
    query: request.query,
  });

  // 发送错误到监控服务 (如 Sentry)
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error);
  }

  reply.status(500).send({ error: 'Internal Server Error' });
};
```

## 9. 邮箱验证与认证系统

### 9.1 邮箱验证服务

#### 邮件发送配置
```typescript
// config/email.ts
export const emailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  },
  from: {
    name: 'Nimbus 网盘',
    email: process.env.SMTP_FROM || 'noreply@nimbus.com',
  },
  templates: {
    verification: {
      subject: '验证您的邮箱 - Nimbus',
      expiresIn: 5 * 60 * 1000, // 5分钟
    },
    resetPassword: {
      subject: '重置密码 - Nimbus',
      expiresIn: 10 * 60 * 1000, // 10分钟
    },
  },
  rateLimits: {
    resendCooldown: 60 * 1000, // 60秒
    maxAttemptsPerHour: 10, // 每小时最多10次
  },
};
```

#### 邮件服务实现
```typescript
import nodemailer from 'nodemailer';
import { emailConfig } from '../config/email';

class EmailService {
  private transporter: nodemailer.Transporter;
  private db: Database;

  constructor() {
    this.transporter = nodemailer.createTransport(emailConfig.smtp);
  }

  /**
   * 生成6位随机验证码
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送验证邮件
   */
  async sendVerificationEmail(
    email: string,
    type: 'register' | 'reset_password' | 'change_email',
    userId?: number
  ): Promise<{ code: string; expiresAt: Date }> {
    // 检查发送频率限制
    await this.checkRateLimit(email);

    // 生成验证码
    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + emailConfig.templates.verification.expiresIn);

    // 保存验证码到数据库
    await this.db.execute(`
      INSERT INTO email_verifications (email, code, type, user_id, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `, [email, code, type, userId || null, expiresAt]);

    // 准备邮件内容
    const emailContent = this.buildEmailContent(type, code, expiresAt);

    try {
      // 发送邮件
      await this.transporter.sendMail({
        from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      // 记录发送日志
      await this.logEmail(email, emailContent.subject, type, 'sent');

      return { code, expiresAt };
    } catch (error) {
      // 记录失败日志
      await this.logEmail(email, emailContent.subject, type, 'failed', error.message);
      throw new Error('邮件发送失败，请稍后重试');
    }
  }

  /**
   * 验证邮箱验证码
   */
  async verifyCode(email: string, code: string, type: string): Promise<boolean> {
    const verification = await this.db.queryOne(`
      SELECT * FROM email_verifications
      WHERE email = ?
        AND code = ?
        AND type = ?
        AND is_verified = FALSE
        AND expires_at > CURRENT_TIMESTAMP
        AND attempts < max_attempts
      ORDER BY created_at DESC
      LIMIT 1
    `, [email, code, type]);

    if (!verification) {
      // 记录失败尝试
      await this.db.execute(`
        UPDATE email_verifications
        SET attempts = attempts + 1
        WHERE email = ? AND type = ? AND is_verified = FALSE
      `, [email, type]);

      return false;
    }

    // 标记为已验证
    await this.db.execute(`
      UPDATE email_verifications
      SET is_verified = TRUE, verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [verification.id]);

    return true;
  }

  /**
   * 检查发送频率限制
   */
  private async checkRateLimit(email: string): Promise<void> {
    // 检查是否在冷却期内
    const lastSent = await this.db.queryOne(`
      SELECT created_at FROM email_verifications
      WHERE email = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [email]);

    if (lastSent) {
      const cooldownEnd = new Date(lastSent.created_at).getTime() + emailConfig.rateLimits.resendCooldown;
      if (Date.now() < cooldownEnd) {
        const waitSeconds = Math.ceil((cooldownEnd - Date.now()) / 1000);
        throw new Error(`请等待 ${waitSeconds} 秒后再重新发送`);
      }
    }

    // 检查每小时发送次数
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await this.db.queryOne(`
      SELECT COUNT(*) as count FROM email_verifications
      WHERE email = ? AND created_at > ?
    `, [email, hourAgo]);

    if (recentCount.count >= emailConfig.rateLimits.maxAttemptsPerHour) {
      throw new Error('发送次数过多，请一小时后再试');
    }
  }

  /**
   * 构建邮件内容
   */
  private buildEmailContent(
    type: string,
    code: string,
    expiresAt: Date
  ): { subject: string; html: string; text: string } {
    const expiresInMinutes = Math.floor(
      (expiresAt.getTime() - Date.now()) / (60 * 1000)
    );

    const templates = {
      register: {
        subject: '验证您的邮箱 - Nimbus 网盘',
        title: '欢迎注册 Nimbus！',
        message: '感谢您注册 Nimbus 网盘。请使用以下验证码完成邮箱验证：',
      },
      reset_password: {
        subject: '重置密码 - Nimbus 网盘',
        title: '重置您的密码',
        message: '您请求重置密码。请使用以下验证码完成密码重置：',
      },
      change_email: {
        subject: '验证新邮箱 - Nimbus 网盘',
        title: '验证您的新邮箱',
        message: '您正在更改邮箱地址。请使用以下验证码验证新邮箱：',
      },
    };

    const template = templates[type];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
          .content { padding: 30px 0; }
          .code-box { background: #f5f5f5; border: 2px dashed #ddd; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333; font-family: 'Courier New', monospace; }
          .footer { border-top: 1px solid #f0f0f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${template.title}</h1>
          </div>
          <div class="content">
            <p>${template.message}</p>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <p>验证码有效期为 <strong>${expiresInMinutes} 分钟</strong>，请尽快完成验证。</p>
            <div class="warning">
              <strong>⚠️ 安全提示：</strong> 如果这不是您的操作，请忽略此邮件。
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Nimbus 网盘. 保留所有权利.</p>
            <p>这是一封自动发送的邮件，请勿直接回复。</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
${template.title}

${template.message}

验证码：${code}

验证码有效期为 ${expiresInMinutes} 分钟。

安全提示：如果这不是您的操作，请忽略此邮件。

© ${new Date().getFullYear()} Nimbus 网盘
    `;

    return {
      subject: template.subject,
      html,
      text,
    };
  }

  /**
   * 记录邮件发送日志
   */
  private async logEmail(
    email: string,
    subject: string,
    type: string,
    status: 'sent' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    await this.db.execute(`
      INSERT INTO email_logs (email, subject, type, status, error_message, sent_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [email, subject, type, status, errorMessage || null, status === 'sent' ? new Date() : null]);
  }
}

export default EmailService;
```

### 9.2 认证服务实现

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { EmailService } from './email.service';

class AuthService {
  private db: Database;
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * 用户注册（第一步）
   */
  async register(
    username: string,
    email: string,
    password: string,
    ipAddress: string
  ): Promise<{ success: boolean; message: string; email: string }> {
    // 验证输入
    await this.validateRegistration(username, email, password);

    // 检查用户名是否已存在
    const existingUsername = await this.db.queryOne(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (existingUsername) {
      throw new Error('用户名已被使用');
    }

    // 检查邮箱是否已注册
    const existingEmail = await this.db.queryOne(
      'SELECT id, is_active FROM users WHERE email = ?',
      [email]
    );
    
    if (existingEmail) {
      if (existingEmail.is_active) {
        throw new Error('该邮箱已被注册');
      } else {
        // 如果账号存在但未激活，删除旧账号重新注册
        await this.db.execute('DELETE FROM users WHERE id = ?', [existingEmail.id]);
      }
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建未激活的用户账号
    const result = await this.db.execute(`
      INSERT INTO users (username, email, password_hash, is_active)
      VALUES (?, ?, ?, FALSE)
    `, [username, email, passwordHash]);

    // 发送验证邮件
    await this.emailService.sendVerificationEmail(email, 'register');

    return {
      success: true,
      message: '注册成功，验证码已发送至您的邮箱',
      email,
    };
  }

  /**
   * 验证邮箱（第二步）
   */
  async verifyEmail(
    email: string,
    code: string
  ): Promise<{ success: boolean; token: string; user: User }> {
    // 验证验证码
    const isValid = await this.emailService.verifyCode(email, code, 'register');
    
    if (!isValid) {
      throw new Error('验证码错误或已过期');
    }

    // 激活用户账号
    await this.db.execute(`
      UPDATE users SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `, [email]);

    // 获取用户信息
    const user = await this.db.queryOne(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    // 为首个注册用户自动设置为 Owner
    const userCount = await this.db.queryOne('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
    if (userCount.count === 1) {
      await this.db.execute('UPDATE users SET is_owner = TRUE WHERE id = ?', [user.id]);
      await this.db.execute(`
        INSERT INTO user_roles (user_id, role_id, granted_by)
        VALUES (?, 1, ?)
      `, [user.id, user.id]); // role_id=1 是 owner 角色
      user.is_owner = true;
    } else {
      // 其他用户默认分配 viewer 角色
      await this.db.execute(`
        INSERT INTO user_roles (user_id, role_id, granted_by)
        VALUES (?, 4, 1)
      `, [user.id]); // role_id=4 是 viewer 角色，granted_by=1 是 owner
    }

    // 生成 JWT token
    const token = this.generateToken(user);

    return {
      success: true,
      token,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * 用户登录（支持用户名或邮箱）
   */
  async login(
    identifier: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean; token?: string; user?: User; requireEmailVerification?: boolean }> {
    // 查找用户（支持用户名或邮箱）
    const user = await this.db.queryOne(`
      SELECT * FROM users
      WHERE username = ? OR email = ?
      LIMIT 1
    `, [identifier, identifier]);

    if (!user) {
      // 记录失败日志
      await this.logLogin(null, identifier.includes('@') ? 'email' : 'username', ipAddress, userAgent, 'failed', '用户不存在');
      throw new Error('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      await this.logLogin(user.id, identifier.includes('@') ? 'email' : 'username', ipAddress, userAgent, 'failed', '密码错误');
      throw new Error('用户名或密码错误');
    }

    // 检查账号是否已激活
    if (!user.is_active) {
      // 重新发送验证邮件
      await this.emailService.sendVerificationEmail(user.email, 'register', user.id);
      
      return {
        success: false,
        requireEmailVerification: true,
      };
    }

    // 生成 token
    const token = this.generateToken(user);

    // 更新最后登录时间
    await this.db.execute(`
      UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [user.id]);

    // 记录成功登录
    await this.logLogin(user.id, identifier.includes('@') ? 'email' : 'username', ipAddress, userAgent, 'success', null);

    return {
      success: true,
      token,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * 忘记密码
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      // 为了安全，即使用户不存在也返回成功
      return {
        success: true,
        message: '如果该邮箱已注册，重置密码的验证码已发送至您的邮箱',
      };
    }

    await this.emailService.sendVerificationEmail(email, 'reset_password', user.id);

    return {
      success: true,
      message: '重置密码的验证码已发送至您的邮箱',
    };
  }

  /**
   * 重置密码
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; token: string }> {
    // 验证验证码
    const isValid = await this.emailService.verifyCode(email, code, 'reset_password');
    
    if (!isValid) {
      throw new Error('验证码错误或已过期');
    }

    // 验证新密码
    this.validatePassword(newPassword);

    // 更新密码
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.db.execute(`
      UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `, [passwordHash, email]);

    // 获取用户信息并生成 token（自动登录）
    const user = await this.db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
    const token = this.generateToken(user);

    return {
      success: true,
      token,
    };
  }

  /**
   * 生成 JWT Token
   */
  private generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        isOwner: user.is_owner,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  /**
   * 记录登录历史
   */
  private async logLogin(
    userId: number | null,
    loginMethod: string,
    ipAddress: string,
    userAgent: string,
    status: string,
    failureReason: string | null
  ): Promise<void> {
    if (userId) {
      await this.db.execute(`
        INSERT INTO login_history (user_id, login_method, ip_address, user_agent, status, failure_reason)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, loginMethod, ipAddress, userAgent, status, failureReason]);
    }
  }

  /**
   * 清理用户敏感信息
   */
  private sanitizeUser(user: User): User {
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * 验证注册输入
   */
  private async validateRegistration(username: string, email: string, password: string): Promise<void> {
    // 验证用户名
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      throw new Error('用户名只能包含字母、数字和下划线，长度3-20个字符');
    }

    // 验证邮箱
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('邮箱格式不正确');
    }

    // 验证密码
    this.validatePassword(password);
  }

  /**
   * 验证密码强度
   */
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('密码长度至少为8个字符');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('密码必须包含至少一个大写字母');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('密码必须包含至少一个小写字母');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('密码必须包含至少一个数字');
    }
  }
}

export default AuthService;
```

## 10. 安全考虑

### 10.1 认证与授权
```typescript
// JWT 认证中间件
export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const token = extractTokenFromHeader(request.headers.authorization);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // 检查用户是否存在且激活
    const user = await getUserById(payload.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    request.user = user;
  } catch (error) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
};

// 权限检查
export const checkFilePermission = async (
  userId: number,
  fileId: number,
  action: 'read' | 'write' | 'delete'
): Promise<boolean> => {
  const file = await getFileById(fileId);

  // 文件所有者有全部权限
  if (file.userId === userId) {
    return true;
  }

  // 检查分享权限
  if (action === 'read') {
    const share = await getActiveShareByFileId(fileId);
    return !!share;
  }

  return false;
};
```

### 9.2 数据加密
```typescript
// 敏感配置加密存储
export class ConfigEncryption {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivation = 'pbkdf2';

  encrypt(data: string, password: string): string {
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

    const cipher = crypto.createCipherGCM(this.algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encrypted,
    });
  }

  decrypt(encryptedData: string, password: string): string {
    const { salt, iv, authTag, encrypted } = JSON.parse(encryptedData);
    const key = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 32, 'sha256');

    const decipher = crypto.createDecipherGCM(this.algorithm, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

## 10. 性能优化

### 10.1 缓存策略
```typescript
// Redis 缓存服务
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  // 缓存文件元数据
  async cacheFileMetadata(fileId: number, metadata: FileMetadata, ttl = 3600): Promise<void> {
    await this.redis.setex(`file:${fileId}`, ttl, JSON.stringify(metadata));
  }

  async getCachedFileMetadata(fileId: number): Promise<FileMetadata | null> {
    const cached = await this.redis.get(`file:${fileId}`);
    return cached ? JSON.parse(cached) : null;
  }

  // 缓存文件夹内容
  async cacheFolderContents(folderId: number, contents: FolderContents, ttl = 1800): Promise<void> {
    await this.redis.setex(`folder:${folderId}`, ttl, JSON.stringify(contents));
  }

  // 缓存存储源状态
  async cacheStorageSourceStatus(sourceId: number, status: StorageSourceStatus, ttl = 300): Promise<void> {
    await this.redis.setex(`storage:${sourceId}`, ttl, JSON.stringify(status));
  }
}

// 缓存中间件
export const cacheMiddleware = (ttl: number = 300) => {
  return async (request: FastifyRequest, reply: FastifyReply, done: Function) => {
    const cacheKey = `api:${request.method}:${request.url}`;

    // 只缓存 GET 请求
    if (request.method !== 'GET') {
      return done();
    }

    const cached = await cache.get(cacheKey);
    if (cached) {
      reply.send(JSON.parse(cached));
      return;
    }

    // 缓存响应
    reply.addHook('onSend', async (request, reply, payload) => {
      if (reply.statusCode === 200) {
        await cache.setex(cacheKey, ttl, payload);
      }
    });

    done();
  };
};
```

### 10.2 数据库优化
```typescript
// 数据库连接池
export const dbConfig = {
  client: 'sqlite3',
  connection: {
    filename: process.env.DATABASE_URL,
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 600000,
  },
  useNullAsDefault: true,
};

// 分页查询优化
export class FileService {
  async getFilesPaginated(
    folderId: number,
    page: number = 1,
    limit: number = 50,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedFiles> {
    const offset = (page - 1) * limit;

    // 使用索引优化的查询
    const [files, totalCount] = await Promise.all([
      db('files')
        .where('folder_id', folderId)
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .offset(offset),

      db('files')
        .where('folder_id', folderId)
        .count('* as count')
        .first()
    ]);

    return {
      files,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        hasMore: offset + files.length < totalCount.count,
      },
    };
  }
}
```

这份技术架构文档详细描述了 Nimbus 多源聚合网盘的技术实现方案，包括系统架构、数据库设计、API 接口、存储源插件系统、文件处理、安全机制和性能优化等各个方面。文档基于现代化的技术栈，确保系统的可扩展性、安全性和高性能。