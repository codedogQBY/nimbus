'use client';

import { useRef, useState } from 'react';
import { Button, Progress, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { UploadIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react';
import ky from 'ky';

interface UploadButtonProps {
  folderId?: number | null;
  onSuccess?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isIconOnly?: boolean;
}

export function UploadButton({ folderId, onSuccess, className, size = 'md', isIconOnly = false }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // 检查文件大小（最大100MB）
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('文件大小不能超过100MB');
      setUploadStatus('error');
      setShowModal(true);
      return;
    }

    setShowModal(true);
    setUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) {
        formData.append('folderId', folderId.toString());
      }

      // 模拟进度（实际应该使用 XMLHttpRequest 或 fetch 的 onProgress）
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await ky.post('/api/files/upload', {
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }).json();

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
      
      setTimeout(() => {
        setShowModal(false);
        setUploading(false);
        setUploadStatus('idle');
        onSuccess?.();
        // 触发存储更新事件
        window.dispatchEvent(new Event('storageUpdated'));
      }, 1500);
    } catch (error: any) {
      setUploadStatus('error');
      setUploadError(error.message || '上传失败');
      setUploading(false);
    }

    // 重置input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      
      <Button
        size={size}
        isIconOnly={isIconOnly}
        startContent={!isIconOnly ? <UploadIcon className="w-4 h-4" /> : undefined}
        className={className}
        onPress={handleFileSelect}
        isDisabled={uploading}
      >
        {isIconOnly ? <UploadIcon className="w-4 h-4" /> : '上传'}
      </Button>

      <Modal 
        isOpen={showModal} 
        onClose={() => !uploading && setShowModal(false)}
        size="sm"
        isDismissable={!uploading}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {uploadStatus === 'uploading' && '正在上传'}
            {uploadStatus === 'success' && '上传成功'}
            {uploadStatus === 'error' && '上传失败'}
          </ModalHeader>
          <ModalBody>
            {uploadStatus === 'uploading' && (
              <div className="space-y-3">
                <Progress 
                  value={uploadProgress} 
                  color="primary"
                  size="md"
                  className="w-full"
                />
                <p className="text-sm text-default-500 text-center">
                  {uploadProgress}%
                </p>
              </div>
            )}
            {uploadStatus === 'success' && (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2Icon className="w-12 h-12 text-success" />
                <p className="text-sm text-default-600">文件上传成功！</p>
              </div>
            )}
            {uploadStatus === 'error' && (
              <div className="flex flex-col items-center gap-3 py-4">
                <XCircleIcon className="w-12 h-12 text-danger" />
                <p className="text-sm text-danger">{uploadError}</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {uploadStatus === 'error' && (
              <Button 
                color="primary" 
                onPress={() => setShowModal(false)}
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

