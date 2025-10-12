// 文件预览类型定义

export enum PreviewType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  PDF = 'pdf',
  TEXT = 'text',
  CODE = 'code',
  MARKDOWN = 'markdown',
  OFFICE = 'office',
  ARCHIVE = 'archive',
  NOT_SUPPORTED = 'not_supported'
}

export interface PreviewConfig {
  type: PreviewType;
  mimeTypes: string[];
  extensions: string[];
  maxSize?: number; // 最大文件大小（字节）
  supported: boolean;
  description: string;
}

export const PREVIEW_CONFIGS: PreviewConfig[] = [
  // 图片预览
  {
    type: PreviewType.IMAGE,
    mimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      'image/avif',
      'image/heic',
      'image/heif'
    ],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.avif', '.heic', '.heif'],
    maxSize: 50 * 1024 * 1024, // 50MB
    supported: true,
    description: '支持缩放、旋转、全屏查看'
  },

  // 视频预览
  {
    type: PreviewType.VIDEO,
    mimeTypes: [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/mkv',
      'video/3gp',
      'video/m4v'
    ],
    extensions: ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.3gp', '.m4v'],
    maxSize: 200 * 1024 * 1024, // 200MB
    supported: true,
    description: '支持播放控制、进度条、音量调节'
  },

  // 音频预览
  {
    type: PreviewType.AUDIO,
    mimeTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/flac',
      'audio/m4a',
      'audio/wma'
    ],
    extensions: ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma'],
    maxSize: 100 * 1024 * 1024, // 100MB
    supported: true,
    description: '支持播放控制、进度条、音量调节'
  },

  // PDF 预览
  {
    type: PreviewType.PDF,
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    maxSize: 50 * 1024 * 1024, // 50MB
    supported: true,
    description: '支持翻页、缩放、搜索、下载'
  },

  // 文本文件预览
  {
    type: PreviewType.TEXT,
    mimeTypes: [
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'text/xml',
      'application/json',
      'application/xml'
    ],
    extensions: ['.txt', '.html', '.htm', '.css', '.js', '.xml', '.json', '.csv', '.log'],
    maxSize: 5 * 1024 * 1024, // 5MB
    supported: true,
    description: '支持语法高亮、行号、搜索'
  },

  // 代码文件预览
  {
    type: PreviewType.CODE,
    mimeTypes: [
      'text/x-python',
      'text/x-java',
      'text/x-c',
      'text/x-c++',
      'text/x-csharp',
      'text/x-php',
      'text/x-ruby',
      'text/x-go',
      'text/x-rust',
      'text/x-swift',
      'text/x-kotlin',
      'text/x-typescript',
      'text/x-sql'
    ],
    extensions: [
      '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.ts', '.tsx', '.jsx', '.vue', '.sql',
      '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.yml', '.yaml', '.toml', '.ini', '.cfg', '.conf'
    ],
    maxSize: 2 * 1024 * 1024, // 2MB
    supported: true,
    description: '支持语法高亮、代码折叠、行号'
  },

  // Markdown 预览
  {
    type: PreviewType.MARKDOWN,
    mimeTypes: ['text/markdown', 'text/x-markdown'],
    extensions: ['.md', '.markdown', '.mdown', '.mkdn', '.mkd'],
    maxSize: 1 * 1024 * 1024, // 1MB
    supported: true,
    description: '支持实时渲染、目录导航、数学公式'
  },

  // Office 文档预览
  {
    type: PreviewType.OFFICE,
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    extensions: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
    maxSize: 20 * 1024 * 1024, // 20MB
    supported: false, // 需要第三方服务或库
    description: '需要集成 Office Online 或 OnlyOffice'
  },

  // 压缩包预览
  {
    type: PreviewType.ARCHIVE,
    mimeTypes: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/gzip',
      'application/x-tar'
    ],
    extensions: ['.zip', '.rar', '.7z', '.gz', '.tar', '.bz2'],
    maxSize: 100 * 1024 * 1024, // 100MB
    supported: false, // 需要解压缩库
    description: '支持查看文件列表、解压单个文件'
  }
];

// 获取文件预览类型
export function getPreviewType(filename: string, mimeType?: string): PreviewType {
  const ext = getFileExtension(filename).toLowerCase();
  
  for (const config of PREVIEW_CONFIGS) {
    // 优先根据 MIME 类型判断
    if (mimeType && config.mimeTypes.includes(mimeType.toLowerCase())) {
      return config.type;
    }
    
    // 其次根据文件扩展名判断
    if (config.extensions.includes(ext)) {
      return config.type;
    }
  }
  
  return PreviewType.NOT_SUPPORTED;
}

// 检查文件是否支持预览
export function canPreview(filename: string, mimeType?: string, fileSize?: number): boolean {
  const previewType = getPreviewType(filename, mimeType);
  
  if (previewType === PreviewType.NOT_SUPPORTED) {
    return false;
  }
  
  const config = PREVIEW_CONFIGS.find(c => c.type === previewType);
  if (!config || !config.supported) {
    return false;
  }
  
  // 检查文件大小限制
  if (fileSize && config.maxSize && fileSize > config.maxSize) {
    return false;
  }
  
  return true;
}

// 获取文件扩展名
function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(lastDot) : '';
}

// 获取预览配置
export function getPreviewConfig(type: PreviewType): PreviewConfig | undefined {
  return PREVIEW_CONFIGS.find(config => config.type === type);
}
