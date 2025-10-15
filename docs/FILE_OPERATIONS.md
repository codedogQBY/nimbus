# 📁 文件操作功能说明

## ✅ 已实现功能

### 1. 文件上传

#### 🎯 功能特性

- **单文件上传**：选择单个文件进行上传
- **多文件上传**：一次性选择多个文件批量上传
- **文件夹上传**：支持上传整个文件夹（保留文件夹结构）
- **并发上传**：最多3个文件同时上传，提高效率
- **实时进度**：每个文件独立显示上传进度
- **自动创建文件夹**：上传文件夹时自动创建对应的文件夹结构

#### 🔧 技术实现

- 使用 `XMLHttpRequest` 实现真实的上传进度跟踪
- 支持 `webkitdirectory` 属性实现文件夹选择
- 自动解析 `relativePath` 创建文件夹结构
- 文件大小限制：单个文件最大 100MB

#### 📡 API端点

```
POST /api/files/upload
```

**请求参数**：

- `file` (File): 文件对象
- `folderId` (可选): 目标文件夹ID
- `relativePath` (可选): 相对路径（用于文件夹上传）

**响应**：

```json
{
  "success": true,
  "file": {
    "id": 1,
    "name": "unique-name.jpg",
    "originalName": "photo.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg"
  }
}
```

---

### 2. 文件下载

#### 🎯 功能特性

- **单文件下载**：直接下载文件到本地
- **文件夹打包下载**：将文件夹打包为 ZIP 文件下载
- **保留文件名**：下载时使用原始文件名
- **递归打包**：文件夹下载时包含所有子文件夹和文件

#### 🔧 技术实现

- 使用 Node.js 的 `fs/promises` 读取文件
- 使用 `archiver` 库创建 ZIP 压缩包
- 设置正确的 `Content-Type` 和 `Content-Disposition` 头
- 支持大文件流式传输

#### 📡 API端点

**单文件下载**：

```
GET /api/files/[id]/download
```

**文件夹下载**：

```
GET /api/folders/[id]/download
```

**响应**：

- 文件流（`application/octet-stream` 或实际 MIME 类型）
- ZIP 文件流（`application/zip`，用于文件夹）

---

### 3. 文件/文件夹复制

#### 🎯 功能特性

- **文件复制**：复制文件到指定位置
- **文件夹复制**：递归复制整个文件夹结构
- **保留文件内容**：使用 `copyFile` 确保文件完整性
- **自动更新配额**：复制后更新存储源使用量

#### 🔧 技术实现

- 使用 `fs/promises.copyFile` 复制文件
- 递归遍历文件夹结构
- 为每个复制的文件生成新的唯一文件名
- 自动更新数据库记录和存储配额

#### 📡 API端点

**文件复制**：

```
POST /api/files/[id]/copy
```

**文件夹复制**：

```
POST /api/folders/[id]/copy
```

**请求参数**：

```json
{
  "targetFolderId": 123 // 可选，null表示移动到根目录
}
```

**响应**：

```json
{
  "success": true,
  "file": {
    "id": 2,
    "name": "new-unique-name.jpg"
  }
}
```

---

### 4. 文件/文件夹移动

#### 🎯 功能特性

- **文件移动**：将文件移动到其他文件夹
- **文件夹移动**：移动整个文件夹到新位置
- **路径自动更新**：移动文件夹时自动更新所有子文件夹的路径
- **防止循环依赖**：禁止将文件夹移动到自己或子文件夹中

#### 🔧 技术实现

- 只更新数据库记录，不移动物理文件
- 递归更新所有子文件夹的 `path` 字段
- 检查目标文件夹的祖先链，防止循环引用
- 支持移动到根目录（`targetFolderId` 为 null）

#### 📡 API端点

**文件移动**：

```
POST /api/files/[id]/move
```

**文件夹移动**：

```
POST /api/folders/[id]/move
```

**请求参数**：

```json
{
  "targetFolderId": 123 // 可选，null表示移动到根目录
}
```

**响应**：

```json
{
  "success": true,
  "folder": {
    "id": 1,
    "name": "Documents",
    "path": "/Photos/Documents",
    "parentId": 10
  }
}
```

---

## 🎨 UI 交互

### 上传按钮

- **桌面端**：下拉菜单，包含三个选项
  - 📄 上传文件
  - 📑 上传多个文件
  - 📁 上传文件夹
- **移动端**：图标按钮，默认单文件上传

### 上传进度模态框

- **总进度条**：显示所有文件的平均进度
- **文件列表**：每个文件单独显示
  - 文件名
  - 文件大小
  - 上传进度条
  - 状态图标（✅ 成功 / ❌ 失败 / ⏳ 上传中）
- **成功统计**：显示 `已成功/总数`

### 文件操作菜单

在文件/文件夹的三点菜单中：

- 📥 下载
- 📋 复制
- ➡️ 移动
- ✏️ 重命名
- 🔗 分享
- 🗑️ 删除

---

## 🔐 权限要求

| 操作            | 所需权限         |
| --------------- | ---------------- |
| 上传文件        | `files.upload`   |
| 下载文件        | `files.download` |
| 复制文件/文件夹 | `files.upload`   |
| 移动文件/文件夹 | `files.edit`     |
| 重命名          | `files.edit`     |
| 删除            | `files.delete`   |

---

## 🚀 存储适配器集成（待实现）

目前所有文件操作都基于本地存储实现。未来将集成存储适配器系统，支持多种存储源：

### 计划支持的存储源

1. **Cloudflare R2** - S3兼容存储
2. **七牛云** - 中国CDN存储
3. **MinIO** - 自托管S3兼容存储
4. **又拍云** - CDN存储
5. **Telegram Bot** - 利用Telegram作为存储
6. **Cloudinary** - 图片/视频CDN
7. **GitHub** - 代码仓库存储
8. **自定义HTTP** - 自定义上传/下载接口

### 适配器接口

每个存储适配器需要实现以下方法：

```typescript
interface IStorageAdapter {
  upload(file: Buffer, path: string, options?: any): Promise<string>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  copy(sourcePath: string, destPath: string): Promise<string>;
  move(sourcePath: string, destPath: string): Promise<void>;
  getUrl(path: string): Promise<string>;
  testConnection(): Promise<boolean>;
}
```

### 集成方案

1. 上传时根据存储源类型调用对应适配器的 `upload` 方法
2. 下载时根据存储源类型调用对应适配器的 `download` 方法
3. 复制/移动时调用适配器的 `copy`/`move` 方法
4. 如果适配器不支持原生复制/移动，回退到下载+上传方式

---

## 📊 数据库设计

### 文件表 (files)

```sql
- id: 主键
- name: 存储文件名（唯一）
- originalName: 原始文件名
- size: 文件大小（BIGINT）
- mimeType: MIME类型
- md5Hash: MD5哈希值
- storagePath: 存储路径
- storageSourceId: 存储源ID
- folderId: 所属文件夹ID（可空）
- uploadedBy: 上传者ID
- createdAt: 创建时间
- updatedAt: 更新时间
```

### 文件夹表 (folders)

```sql
- id: 主键
- name: 文件夹名
- path: 完整路径
- parentId: 父文件夹ID（可空）
- createdBy: 创建者ID
- createdAt: 创建时间
- updatedAt: 更新时间
```

---

## 🔒 安全考虑

1. **权限检查**：所有API都进行RBAC权限验证
2. **文件大小限制**：单文件100MB上限
3. **存储配额检查**：上传和复制前检查存储空间
4. **路径验证**：防止路径遍历攻击
5. **循环依赖检查**：移动文件夹时防止循环引用
6. **用户身份验证**：所有操作都需要有效的JWT token

---

## 🎯 使用示例

### 前端调用示例

#### 上传多文件

```typescript
const files = Array.from(fileInput.files);
for (const file of files) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folderId", currentFolderId);

  await fetch("/api/files/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}
```

#### 下载文件

```typescript
const response = await fetch(`/api/files/${fileId}/download`, {
  headers: { Authorization: `Bearer ${token}` },
});
const blob = await response.blob();
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = filename;
link.click();
```

#### 复制文件

```typescript
await fetch(`/api/files/${fileId}/copy`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ targetFolderId }),
});
```

#### 移动文件夹

```typescript
await fetch(`/api/folders/${folderId}/move`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ targetFolderId }),
});
```

---

## 📝 TODO

### 高优先级

- [ ] 集成存储适配器系统
- [ ] 实现拖拽上传
- [ ] 添加断点续传支持
- [ ] 实现批量操作（批量下载、批量移动等）

### 中优先级

- [ ] 添加文件去重（基于MD5）
- [ ] 实现文件版本管理
- [ ] 添加回收站功能
- [ ] 支持文件预览时直接下载

### 低优先级

- [ ] 添加上传队列管理
- [ ] 支持上传后自动压缩图片
- [ ] 实现分块上传（大文件）
- [ ] 添加上传统计和分析

---

**最后更新**: 2024-10-11  
**文档版本**: v1.0
