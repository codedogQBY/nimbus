/**
 * 直接URL工具函数
 * 用于处理文件的直接访问URL相关逻辑
 */

/**
 * 检查是否应该使用直接URL
 * @param useDirectUrl 是否使用直接URL（组件级别控制）
 * @returns 是否使用直接URL
 */
export async function shouldUseDirectUrl(): Promise<boolean> {
  try {
    // 首先检查配置是否启用直接URL
    const configResponse = await fetch('/api/debug/config');
    if (!configResponse.ok) {
      console.log('Failed to fetch config, falling back to proxy URLs');
      return false;
    }
    
    const config = await configResponse.json();
    if (!config.enableDirectUrl) {
      console.log('Direct URL disabled in config, falling back to proxy URLs');
      return false;
    }
    
    // 检查用户是否已认证
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, falling back to proxy URLs');
      return false;
    }
    
    const authResponse = await fetch('/api/files', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (authResponse.status === 401) {
      console.log('User not authenticated, falling back to proxy URLs');
      return false;
    }
    
    console.log('User authenticated and direct URL enabled');
    return true;
  } catch (error) {
    console.log('Error checking direct URL availability:', error);
    return false;
  }
}

/**
 * 构建文件访问URL
 * @param fileId 文件ID
 * @param useDirectUrl 是否使用直接URL
 * @returns 文件访问URL
 */
export function buildFileUrl(fileId: string, useDirectUrl: boolean = false): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  if (useDirectUrl) {
    // 如果使用直接URL，返回直接URL API端点
    return `${baseUrl}/api/files/${fileId}/direct-url`;
  } else {
    // 否则返回代理下载端点
    return `${baseUrl}/api/files/${fileId}/download`;
  }
}

/**
 * 构建文件下载URL（带direct参数）
 * @param fileId 文件ID
 * @param useDirectUrl 是否使用直接URL
 * @returns 文件下载URL
 */
export function buildDownloadUrl(fileId: string, useDirectUrl: boolean = false): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const downloadUrl = `${baseUrl}/api/files/${fileId}/download`;
  
  if (useDirectUrl) {
    return `${downloadUrl}?direct=true`;
  } else {
    return downloadUrl;
  }
}

/**
 * 获取文件的直接URL（用于AuthenticatedImage组件）
 * @param fileId 文件ID
 * @returns Promise<string | null> 直接URL
 */
export async function getDirectUrl(fileId: string): Promise<string | null> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found for direct URL request');
      return null;
    }
    
    const response = await fetch(`/api/files/${fileId}/direct-url`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.log(`Failed to get direct URL for file ${fileId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
     return data.url;
  } catch (error) {
    console.log(`Error getting direct URL for file ${fileId}:`, error);
    return null;
  }
}