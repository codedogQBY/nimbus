import { StorageSource, FolderContents, FileInfo } from './base';
import { storageManager } from './manager';
import prisma from '../prisma';

export interface SyncResult {
  success: boolean;
  results: SourceSyncResult[];
  affectedSources: number;
}

export interface SourceSyncResult {
  sourceId: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface MergedFolderContents extends FolderContents {
  sourceStatus: SourceStatus[];
  sourcesQueried: number;
  sourcesOnline: number;
}

export interface SourceStatus {
  sourceId: number;
  sourceName: string;
  status: 'online' | 'offline' | 'error';
  error?: string;
  fileCount: number;
  folderCount: number;
}

/**
 * 文件夹同步管理器
 * 负责在所有存储源间同步文件夹结构
 */
export class FolderSyncManager {
  /**
   * 在所有存储源中同步创建文件夹
   */
  async createFolderAcrossSources(folderPath: string): Promise<SyncResult> {
    const storageSources = await prisma.storageSource.findMany({
      where: { isActive: true },
    });

    const results: SourceSyncResult[] = [];

    for (const sourceRecord of storageSources) {
      try {
        const source = await storageManager.getStorageSource(sourceRecord.id);
        await source.ensureFolderPath(folderPath);

        results.push({
          sourceId: sourceRecord.id,
          success: true,
          timestamp: new Date(),
        });
      } catch (error) {
        results.push({
          sourceId: sourceRecord.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
        });
      }
    }

    return {
      success: results.every(r => r.success),
      results,
      affectedSources: storageSources.length,
    };
  }

  /**
   * 合并所有存储源的文件夹内容
   */
  async mergeFolderContents(folderPath: string): Promise<MergedFolderContents> {
    const storageSources = await prisma.storageSource.findMany({
      where: { isActive: true },
    });

    const allFiles: (FileInfo & { sourceId: number; sourceName: string; sourceType: string })[] = [];
    const allFolders = new Map<string, FileInfo>();
    const sourceStatus: SourceStatus[] = [];

    await Promise.allSettled(
      storageSources.map(async (sourceRecord) => {
        try {
          const source = await storageManager.getStorageSource(sourceRecord.id);
          const contents = await source.listFolder(folderPath);

          // 添加文件（带源信息）
          contents.files.forEach(file => {
            allFiles.push({
              ...file,
              sourceId: sourceRecord.id,
              sourceName: sourceRecord.name,
              sourceType: sourceRecord.type,
            });
          });

          // 合并文件夹（去重）
          contents.folders.forEach(folder => {
            if (!allFolders.has(folder.path)) {
              allFolders.set(folder.path, folder);
            }
          });

          sourceStatus.push({
            sourceId: sourceRecord.id,
            sourceName: sourceRecord.name,
            status: 'online',
            fileCount: contents.files.length,
            folderCount: contents.folders.length,
          });
        } catch (error) {
          sourceStatus.push({
            sourceId: sourceRecord.id,
            sourceName: sourceRecord.name,
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
            fileCount: 0,
            folderCount: 0,
          });
        }
      })
    );

    const folders = Array.from(allFolders.values());

    return {
      files: allFiles,
      folders,
      totalFiles: allFiles.length,
      totalSize: allFiles.reduce((sum, f) => sum + f.size, 0),
      sourceStatus,
      sourcesQueried: storageSources.length,
      sourcesOnline: sourceStatus.filter(s => s.status === 'online').length,
    };
  }

  /**
   * 同步文件夹重命名操作
   */
  async renameFolderAcrossSources(oldPath: string, newPath: string): Promise<SyncResult> {
    const storageSources = await prisma.storageSource.findMany({
      where: { isActive: true },
    });

    const results: SourceSyncResult[] = [];

    for (const sourceRecord of storageSources) {
      try {
        const source = await storageManager.getStorageSource(sourceRecord.id);

        // 检查旧文件夹是否存在
        const exists = await source.folderExists(oldPath);
        if (exists) {
          await source.moveFolder(oldPath, newPath);
        } else {
          // 如果不存在，创建新文件夹以保持同步
          await source.ensureFolderPath(newPath);
        }

        results.push({
          sourceId: sourceRecord.id,
          success: true,
          timestamp: new Date(),
        });
      } catch (error) {
        results.push({
          sourceId: sourceRecord.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
        });
      }
    }

    return {
      success: results.every(r => r.success),
      results,
      affectedSources: storageSources.length,
    };
  }

  /**
   * 删除文件夹（跨所有存储源）
   */
  async deleteFolderAcrossSources(
    folderPath: string,
    recursive: boolean = false
  ): Promise<SyncResult> {
    const storageSources = await prisma.storageSource.findMany({
      where: { isActive: true },
    });

    const results: SourceSyncResult[] = [];

    for (const sourceRecord of storageSources) {
      try {
        const source = await storageManager.getStorageSource(sourceRecord.id);
        
        const exists = await source.folderExists(folderPath);
        if (exists) {
          await source.deleteFolder(folderPath, recursive);
        }

        results.push({
          sourceId: sourceRecord.id,
          success: true,
          timestamp: new Date(),
        });
      } catch (error) {
        results.push({
          sourceId: sourceRecord.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
        });
      }
    }

    return {
      success: results.every(r => r.success),
      results,
      affectedSources: storageSources.length,
    };
  }
}

// 单例实例
export const folderSyncManager = new FolderSyncManager();

