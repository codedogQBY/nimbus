-- 分享快照架构设计方案
-- 解决文件删除和文件夹内容变化导致的分享失效问题

-- ============== 分享快照系统 ==============

-- 分享快照表 - 存储分享时的完整快照信息
model ShareSnapshot {
  id          Int      @id @default(autoincrement())
  shareId     Int      @unique @map("share_id")
  type        String   @db.VarChar(10) // 'file' or 'folder'

  -- 原文件/文件夹信息快照
  originalFileId   Int?    @map("original_file_id")   -- 原文件ID（用于追溯）
  originalFolderId Int?    @map("original_folder_id") -- 原文件夹ID（用于追溯）

  -- 快照内容（JSON格式存储）
  snapshotData Json    @map("snapshot_data")
  -- 文件快照示例：
  -- {
  --   "name": "example.jpg",
  --   "originalName": "my-photo.jpg",
  --   "size": 1024000,
  --   "mimeType": "image/jpeg",
  --   "md5Hash": "abc123...",
  --   "storagePath": "/files/abc123.jpg",
  --   "storageSourceId": 1,
  --   "createdAt": "2024-01-01T00:00:00Z"
  -- }
  --
  -- 文件夹快照示例：
  -- {
  --   "name": "Documents",
  --   "path": "/Documents",
  --   "files": [...],
  --   "folders": [...],
  --   "totalSize": 5000000,
  --   "fileCount": 15,
  --   "folderCount": 3,
  --   "createdAt": "2024-01-01T00:00:00Z"
  -- }

  createdAt   DateTime @default(now()) @map("created_at")

  -- 关系
  share Share @relation(fields: [shareId], references: [id], onDelete: Cascade)

  @@index([shareId])
  @@index([originalFileId])
  @@index([originalFolderId])
  @@map("share_snapshots")
}

-- 修改现有的分享表
model Share {
  id            Int       @id @default(autoincrement())
  shareToken    String    @unique @map("share_token") @db.VarChar(50)
  passwordHash  String?   @map("password_hash") @db.VarChar(255)
  expiresAt     DateTime? @map("expires_at")
  downloadLimit Int?      @map("download_limit")
  downloadCount Int       @default(0) @map("download_count")
  viewCount     Int       @default(0) @map("view_count")
  isActive      Boolean   @default(true) @map("is_active")
  createdBy     Int       @map("created_by")
  createdAt     DateTime  @default(now()) @map("created_at")

  -- 关系（移除直接的文件/文件夹引用）
  creator User @relation("ShareCreator", fields: [createdBy], references: [id])
  snapshot ShareSnapshot? -- 一对一关系到快照

  @@index([shareToken])
  @@index([createdBy])
  @@index([expiresAt])
  @@map("shares")
}

-- ============== 优势分析 ==============

-- 1. 数据一致性
--    - 分享创建时保存完整快照，不受后续文件变化影响
--    - 即使原文件被删除，分享依然有效（只要存储文件还在）

-- 2. 性能优化
--    - 减少复杂的JOIN查询
--    - 快照数据可以直接返回，无需实时查询文件系统

-- 3. 功能完整性
--    - 支持"历史版本"概念
--    - 可以显示分享时的文件状态vs当前状态的差异
--    - 便于实现分享统计和审计

-- 4. 存储策略
--    - 文件分享：快照保存元数据，实际文件数据仍在存储源
--    - 文件夹分享：快照保存完整目录结构，但文件数据仍在存储源
--    - 支持存储文件的引用计数，防止误删

-- ============== 实现策略 ==============

-- Phase 1: 创建快照表和迁移脚本
-- Phase 2: 修改分享创建逻辑，生成快照
-- Phase 3: 修改分享访问逻辑，使用快照数据
-- Phase 4: 实现文件引用计数和清理机制