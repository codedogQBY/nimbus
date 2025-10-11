'use client';

import { useRef, useState } from 'react';
import { Button, Progress, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { UploadIcon, CheckCircle2Icon, XCircleIcon, FileIcon, FolderIcon, FilesIcon, ChevronDownIcon } from 'lucide-react';
import ky from 'ky';

interface UploadButtonProps {
  folderId?: number | null;
  onSuccess?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isIconOnly?: boolean;
}

interface UploadTask {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  relativePath?: string; // 用于文件夹上传
}

export function UploadButton({ folderId, onSuccess, className, size = 'md', isIconOnly = false }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);

  // 单文件上传
  const handleSingleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('multiple');
      fileInputRef.current.removeAttribute('webkitdirectory');
      fileInputRef.current.click();
    }
  };

  // 多文件上传
  const handleMultiFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('multiple', 'true');
      fileInputRef.current.removeAttribute('webkitdirectory');
      fileInputRef.current.click();
    }
  };

  // 文件夹上传
  const handleFolderSelect = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  const uploadFile = async (task: UploadTask, index: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', task.file);
      if (folderId) {
        formData.append('folderId', folderId.toString());
      }
      if (task.relativePath) {
        formData.append('relativePath', task.relativePath);
      }

      // 更新任务状态为上传中
      setUploadTasks(prev => {
        const newTasks = [...prev];
        newTasks[index] = { ...newTasks[index], status: 'uploading', progress: 0 };
        return newTasks;
      });

      // 使用 XMLHttpRequest 以支持进度跟踪
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadTasks(prev => {
              const newTasks = [...prev];
              newTasks[index] = { ...newTasks[index], progress };
              return newTasks;
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            setUploadTasks(prev => {
              const newTasks = [...prev];
              newTasks[index] = { ...newTasks[index], status: 'success', progress: 100 };
              return newTasks;
            });
            resolve();
          } else {
            const error = `上传失败: ${xhr.statusText}`;
            setUploadTasks(prev => {
              const newTasks = [...prev];
              newTasks[index] = { ...newTasks[index], status: 'error', error };
              return newTasks;
            });
            reject(new Error(error));
          }
        });

        xhr.addEventListener('error', () => {
          const error = '网络错误';
          setUploadTasks(prev => {
            const newTasks = [...prev];
            newTasks[index] = { ...newTasks[index], status: 'error', error };
            return newTasks;
          });
          reject(new Error(error));
        });

        xhr.open('POST', '/api/files/upload');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error('Upload error:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 检查文件大小
    const oversizedFiles = Array.from(files).filter(f => f.size > 100 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`以下文件超过100MB限制：\n${oversizedFiles.map(f => f.name).join('\n')}`);
      return;
    }

    // 创建上传任务
    const tasks: UploadTask[] = Array.from(files).map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
      relativePath: (file as any).webkitRelativePath || undefined
    }));

    setUploadTasks(tasks);
    setShowModal(true);
    setUploading(true);
    setTotalProgress(0);

    // 并发上传（最多3个同时进行）
    const concurrency = 3;
    const results: Promise<void>[] = [];
    
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      const batchPromises = batch.map((task, batchIndex) => 
        uploadFile(task, i + batchIndex)
      );
      await Promise.allSettled(batchPromises);
    }

    // 上传完成
    setUploading(false);
    
    // 计算成功率
    setTimeout(() => {
      const successCount = uploadTasks.filter(t => t.status === 'success').length;
      const totalCount = uploadTasks.length;
      
      if (successCount === totalCount) {
        setShowModal(false);
        onSuccess?.();
        window.dispatchEvent(new Event('storageUpdated'));
      }
    }, 2000);

    // 重置input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  // 计算总进度
  const calculateTotalProgress = () => {
    if (uploadTasks.length === 0) return 0;
    const total = uploadTasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(total / uploadTasks.length);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="*/*"
      />
      
      <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        // @ts-ignore - webkitdirectory is not in the standard type definition
        webkitdirectory="true"
        directory="true"
        multiple
      />
      
      {isIconOnly ? (
        <Button
          size={size}
          isIconOnly
          className={className}
          onPress={handleSingleFileSelect}
          isDisabled={uploading}
        >
          <UploadIcon className="w-4 h-4" />
        </Button>
      ) : (
        <Dropdown>
          <DropdownTrigger>
            <Button
              size={size}
              startContent={<UploadIcon className="w-4 h-4" />}
              endContent={<ChevronDownIcon className="w-3 h-3" />}
              className={className}
              isDisabled={uploading}
            >
              上传
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="上传选项">
            <DropdownItem
              key="single"
              startContent={<FileIcon className="w-4 h-4" />}
              onPress={handleSingleFileSelect}
            >
              上传文件
            </DropdownItem>
            <DropdownItem
              key="multiple"
              startContent={<FilesIcon className="w-4 h-4" />}
              onPress={handleMultiFileSelect}
            >
              上传多个文件
            </DropdownItem>
            <DropdownItem
              key="folder"
              startContent={<FolderIcon className="w-4 h-4" />}
              onPress={handleFolderSelect}
            >
              上传文件夹
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      )}

      <Modal 
        isOpen={showModal} 
        onClose={() => !uploading && setShowModal(false)}
        size="lg"
        isDismissable={!uploading}
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {uploading ? `正在上传 (${uploadTasks.filter(t => t.status === 'success').length}/${uploadTasks.length})` : '上传完成'}
          </ModalHeader>
          <ModalBody>
            {uploadTasks.length > 0 && (
              <div className="space-y-3">
                {/* 总进度 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-default-600">总进度</span>
                    <span className="text-default-500">{calculateTotalProgress()}%</span>
                  </div>
                  <Progress 
                    value={calculateTotalProgress()} 
                    color="primary"
                    size="md"
                    className="w-full"
                  />
                </div>

                {/* 文件列表 */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {uploadTasks.map((task, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 bg-default-50 rounded-lg"
                    >
                      {task.status === 'success' ? (
                        <CheckCircle2Icon className="w-5 h-5 text-success flex-shrink-0" />
                      ) : task.status === 'error' ? (
                        <XCircleIcon className="w-5 h-5 text-danger flex-shrink-0" />
                      ) : (
                        <FileIcon className="w-5 h-5 text-default-400 flex-shrink-0" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-olive-800 truncate">
                          {task.file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-default-500">
                            {(task.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {task.status === 'uploading' && (
                            <>
                              <span className="text-xs text-default-400">•</span>
                              <p className="text-xs text-primary">
                                {task.progress}%
                              </p>
                            </>
                          )}
                          {task.status === 'error' && task.error && (
                            <>
                              <span className="text-xs text-default-400">•</span>
                              <p className="text-xs text-danger truncate">
                                {task.error}
                              </p>
                            </>
                          )}
                        </div>
                        {task.status === 'uploading' && (
                          <Progress 
                            value={task.progress} 
                            color="primary"
                            size="sm"
                            className="w-full mt-2"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {!uploading && (
              <Button 
                color="primary" 
                onPress={() => {
                  setShowModal(false);
                  setUploadTasks([]);
                }}
              >
                关闭
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

