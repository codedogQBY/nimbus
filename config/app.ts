/**
 * 应用配置
 * 管理应用级别的配置选项
 */

export const appConfig = {
  /**
   * 是否启用直接URL访问
   * 启用后，文件将直接从存储源CDN访问，提高性能但可能影响访问控制
   */
  enableDirectUrl: process.env.ENABLE_DIRECT_URL === 'true',

  /**
   * 应用基础URL
   */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  /**
   * 端口配置
   */
  port: parseInt(process.env.PORT || '3000', 10),

  /**
   * 环境配置
   */
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  /**
   * 文件上传配置
   */
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5368709120', 10), // 5GB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES || '*',

  /**
   * JWT配置
   */
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
} as const;

export type AppConfig = typeof appConfig;