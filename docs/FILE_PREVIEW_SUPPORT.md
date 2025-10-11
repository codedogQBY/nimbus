# 文件预览支持说明

## 📋 支持预览的文件类型

### ✅ 完全支持（已实现）

#### 🖼️ 图片文件
- **格式**: JPG, JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, AVIF, HEIC, HEIF
- **大小限制**: 50MB
- **功能**: 
  - 缩放（50% - 300%）
  - 旋转（90度增量）
  - 全屏查看
  - 点击放大/缩小
  - 重置视图

#### 🎥 视频文件
- **格式**: MP4, WebM, OGG, AVI, MOV, WMV, FLV, MKV, 3GP, M4V
- **大小限制**: 200MB
- **功能**:
  - 原生 HTML5 播放器
  - 播放控制（播放/暂停、进度条、音量）
  - 全屏播放
  - 下载功能

#### 🎵 音频文件
- **格式**: MP3, WAV, OGG, AAC, FLAC, M4A, WMA
- **大小限制**: 100MB
- **功能**:
  - 原生 HTML5 播放器
  - 播放控制
  - 进度条和音量调节
  - 下载功能

#### 📄 PDF 文档
- **格式**: PDF
- **大小限制**: 50MB
- **功能**:
  - 内嵌 PDF 查看器
  - 翻页浏览
  - 缩放功能
  - 搜索功能
  - 下载功能

#### 📝 文本文件
- **格式**: TXT, HTML, CSS, JS, XML, JSON, CSV, LOG
- **大小限制**: 5MB
- **功能**:
  - 语法高亮（支持多种编程语言）
  - 行号显示
  - 搜索功能
  - 等宽字体显示
  - 下载功能

#### 💻 代码文件
- **格式**: Python, Java, C/C++, C#, PHP, Ruby, Go, Rust, Swift, Kotlin, TypeScript, SQL, Shell 脚本, YAML, TOML, INI, 配置文件等
- **大小限制**: 2MB
- **功能**:
  - 语法高亮
  - 代码折叠
  - 行号显示
  - 搜索功能
  - 下载功能

#### 📋 Markdown 文档
- **格式**: MD, MARKDOWN, MDOWN, MKDN, MKD
- **大小限制**: 1MB
- **功能**:
  - 实时渲染
  - 目录导航
  - 数学公式支持（计划中）
  - 代码块语法高亮
  - 下载功能

### 🚧 计划支持（需要第三方服务）

#### 📊 Office 文档
- **格式**: DOC, DOCX, XLS, XLSX, PPT, PPTX
- **大小限制**: 20MB
- **实现方式**: 
  - Microsoft Office Online
  - OnlyOffice Document Server
  - Google Docs Viewer API
- **功能**:
  - 在线编辑（部分）
  - 查看模式
  - 评论和批注
  - 版本历史

#### 📦 压缩包
- **格式**: ZIP, RAR, 7Z, GZ, TAR, BZ2
- **大小限制**: 100MB
- **实现方式**: 
  - 前端解压缩库（如 JSZip）
  - 后端解压缩服务
- **功能**:
  - 查看文件列表
  - 解压单个文件
  - 下载压缩包
  - 预览压缩包内的文件

### ❌ 不支持预览

- 二进制可执行文件（EXE, APP, DEB, RPM 等）
- 数据库文件（DB, SQLITE, MDB 等）
- 专业设计软件文件（PSD, AI, SKETCH 等）
- 3D 模型文件（OBJ, STL, FBX 等）
- 虚拟机文件（VMDK, VDI, QCOW2 等）

## 🔧 技术实现

### 前端组件架构
```
lib/file-preview/
├── types.ts              # 类型定义和配置
├── preview-components.tsx # 各种预览组件
└── preview-manager.tsx    # 统一预览管理器
```

### 预览流程
1. **文件类型检测**: 根据文件名和 MIME 类型判断支持情况
2. **大小检查**: 验证文件是否超过预览大小限制
3. **组件渲染**: 根据文件类型渲染对应的预览组件
4. **错误处理**: 对于不支持的文件类型显示友好的错误信息

### 性能优化
- **懒加载**: 预览组件按需加载
- **大小限制**: 避免大文件影响性能
- **缓存策略**: 浏览器缓存预览内容
- **渐进式加载**: 大文件分块加载

## 🎯 使用示例

### 在文件列表中添加预览功能
```tsx
import { FilePreview, hasPreviewIcon, getPreviewIcon } from '@/lib/file-preview/preview-manager';

// 文件项组件
function FileItem({ file }) {
  const [showPreview, setShowPreview] = useState(false);
  
  return (
    <div className="file-item">
      {/* 文件图标 */}
      <div className="flex items-center gap-2">
        {getPreviewIcon(file.originalName, file.mimeType)}
        <span>{file.originalName}</span>
      </div>
      
      {/* 预览按钮 */}
      {hasPreviewIcon(file.originalName, file.mimeType) && (
        <Button
          size="sm"
          variant="light"
          onPress={() => setShowPreview(true)}
        >
          预览
        </Button>
      )}
      
      {/* 预览模态框 */}
      {showPreview && (
        <FilePreview
          file={file}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
```

## 📈 未来计划

### 短期目标
- [ ] 完善 Markdown 预览（数学公式支持）
- [ ] 添加代码文件的语法高亮
- [ ] 优化大文件加载性能
- [ ] 添加预览历史记录

### 中期目标
- [ ] 集成 Office Online 预览
- [ ] 实现压缩包预览
- [ ] 添加文件注释功能
- [ ] 支持文件版本对比

### 长期目标
- [ ] 支持更多专业文件格式
- [ ] 添加协作预览功能
- [ ] 实现智能文件分析
- [ ] 支持文件格式转换
