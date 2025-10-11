'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  Button,
  Progress,
  Spinner,
  Chip,
  Tooltip
} from '@heroui/react';
import { 
  DownloadIcon, 
  ExternalLinkIcon, 
  XIcon, 
  RotateCwIcon, 
  ZoomInIcon, 
  ZoomOutIcon,
  MaximizeIcon,
  MinimizeIcon,
  RefreshCwIcon,
  FileIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  FileTextIcon,
  CodeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  ShareIcon
} from 'lucide-react';

export interface PreviewComponentProps {
  file: {
    id: number;
    name: string;
    originalName: string;
    size: number;
    mimeType?: string;
    storagePath: string;
    createdAt?: string;
  };
  onClose: () => void;
}

// 文件信息头部组件
function FileInfoHeader({ file }: { file: PreviewComponentProps['file'] }) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-divider">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
          <FileIcon className="w-6 h-6 text-primary-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-dark-olive-800 truncate max-w-md">
            {file.originalName}
          </h2>
          <div className="flex items-center gap-4 text-sm text-default-500">
            <span>{formatFileSize(file.size)}</span>
            {file.createdAt && (
              <>
                <span>•</span>
                <span>{formatDate(file.createdAt)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Chip size="sm" color="primary" variant="flat">
          预览模式
        </Chip>
      </div>
    </div>
  );
}

// 工具栏组件
function Toolbar({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between p-3 bg-white border-b border-divider ${className}`}>
      {children}
    </div>
  );
}

// 图片预览组件 - 重新设计
export function ImagePreview({ file, onClose }: PreviewComponentProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose}
      size="full"
      classNames={{
        base: isFullscreen ? "m-0 max-w-none" : "max-w-7xl",
        body: "p-0"
      }}
      hideCloseButton
    >
      <ModalContent>
        <FileInfoHeader file={file} />
        
        <Toolbar>
          <div className="flex items-center gap-2">
            <Tooltip content="缩小">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={handleZoomOut}
                isDisabled={scale <= 0.25}
              >
                <ZoomOutIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <span className="text-sm text-default-500 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <Tooltip content="放大">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={handleZoomIn}
                isDisabled={scale >= 5}
              >
                <ZoomInIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <div className="w-px h-6 bg-divider mx-2" />
            
            <Tooltip content="旋转">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={handleRotate}
              >
                <RotateCwIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content="重置">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={handleReset}
              >
                <RefreshCwIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip content={isFullscreen ? "退出全屏" : "全屏"}>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <MinimizeIcon className="w-4 h-4" /> : <MaximizeIcon className="w-4 h-4" />}
              </Button>
            </Tooltip>
            
            <Tooltip content="在新窗口打开">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => window.open(file.storagePath, '_blank')}
              >
                <ExternalLinkIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content="下载">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => {
                  const link = document.createElement('a');
                  link.href = file.storagePath;
                  link.download = file.originalName;
                  link.click();
                }}
              >
                <DownloadIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={onClose}
              className="ml-2"
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        </Toolbar>
        
        <ModalBody className="flex-1 overflow-hidden">
          <div 
            ref={containerRef}
            className="w-full h-full bg-gradient-to-br from-default-50 to-default-100 flex items-center justify-center relative overflow-hidden"
            onWheel={handleWheel}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="flex flex-col items-center gap-3">
                  <Spinner size="lg" color="primary" />
                  <p className="text-sm text-default-500">加载图片中...</p>
                </div>
              </div>
            )}
            
            {error ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-danger-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-danger-700">图片加载失败</h3>
                  <p className="text-sm text-danger-500">无法显示此图片，请检查文件是否损坏</p>
                </div>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => {
                    setError(false);
                    setLoading(true);
                  }}
                >
                  重新加载
                </Button>
              </div>
            ) : (
              <img
                src={file.storagePath}
                alt={file.originalName}
                className="max-w-full max-h-full object-contain transition-all duration-200 select-none"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                  cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'pointer'
                }}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={(e) => {
                  if (!isDragging && scale === 1) {
                    handleZoomIn();
                  }
                }}
                draggable={false}
              />
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// 视频预览组件 - 重新设计
export function VideoPreview({ file, onClose }: PreviewComponentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose}
      size="5xl"
      classNames={{
        base: "max-w-6xl"
      }}
      hideCloseButton
    >
      <ModalContent>
        <FileInfoHeader file={file} />
        
        <Toolbar>
          <div className="flex items-center gap-2">
            <VideoIcon className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium text-dark-olive-800">视频播放器</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip content="在新窗口打开">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => window.open(file.storagePath, '_blank')}
              >
                <ExternalLinkIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content="下载">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => {
                  const link = document.createElement('a');
                  link.href = file.storagePath;
                  link.download = file.originalName;
                  link.click();
                }}
              >
                <DownloadIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={onClose}
              className="ml-2"
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        </Toolbar>
        
        <ModalBody className="p-0">
          <div className="w-full bg-black relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="flex flex-col items-center gap-3">
                  <Spinner size="lg" color="primary" />
                  <p className="text-sm text-white">加载视频中...</p>
                </div>
              </div>
            )}
            
            {error ? (
              <div className="aspect-video bg-danger-50 flex items-center justify-center">
                <div className="text-center">
                  <VideoIcon className="w-12 h-12 text-danger-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-danger-700">视频加载失败</h3>
                  <p className="text-sm text-danger-500 mb-4">无法播放此视频文件</p>
                  <Button
                    color="danger"
                    variant="flat"
                    onPress={() => {
                      setError(false);
                      setLoading(true);
                    }}
                  >
                    重新加载
                  </Button>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={file.storagePath}
                controls
                className="w-full aspect-video"
                preload="metadata"
                onLoadStart={() => setLoading(true)}
                onCanPlay={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
              >
                您的浏览器不支持视频播放
              </video>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// PDF 预览组件 - 重新设计
export function PDFPreview({ file, onClose }: PreviewComponentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose}
      size="full"
      classNames={{
        base: "max-w-7xl",
        body: "p-0"
      }}
      hideCloseButton
    >
      <ModalContent>
        <FileInfoHeader file={file} />
        
        <Toolbar>
          <div className="flex items-center gap-2">
            <FileTextIcon className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium text-dark-olive-800">PDF 查看器</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip content="在新窗口打开">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => window.open(file.storagePath, '_blank')}
              >
                <ExternalLinkIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content="下载">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => {
                  const link = document.createElement('a');
                  link.href = file.storagePath;
                  link.download = file.originalName;
                  link.click();
                }}
              >
                <DownloadIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={onClose}
              className="ml-2"
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        </Toolbar>
        
        <ModalBody className="flex-1 overflow-hidden">
          <div className="w-full h-full relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <div className="flex flex-col items-center gap-3">
                  <Spinner size="lg" color="primary" />
                  <p className="text-sm text-default-500">加载 PDF 中...</p>
                </div>
              </div>
            )}
            
            {error ? (
              <div className="h-full flex items-center justify-center bg-danger-50">
                <div className="text-center">
                  <FileTextIcon className="w-12 h-12 text-danger-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-danger-700">PDF 加载失败</h3>
                  <p className="text-sm text-danger-500 mb-4">无法显示此 PDF 文件</p>
                  <Button
                    color="danger"
                    variant="flat"
                    onPress={() => {
                      setError(false);
                      setLoading(true);
                    }}
                  >
                    重新加载
                  </Button>
                </div>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                src={file.storagePath}
                className="w-full h-full border-0"
                title={file.originalName}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
              />
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// 音频预览组件 - 重新设计
export function AudioPreview({ file, onClose }: PreviewComponentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose}
      size="lg"
      classNames={{
        base: "max-w-2xl"
      }}
      hideCloseButton
    >
      <ModalContent>
        <FileInfoHeader file={file} />
        
        <Toolbar>
          <div className="flex items-center gap-2">
            <MusicIcon className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium text-dark-olive-800">音频播放器</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip content="在新窗口打开">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => window.open(file.storagePath, '_blank')}
              >
                <ExternalLinkIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content="下载">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => {
                  const link = document.createElement('a');
                  link.href = file.storagePath;
                  link.download = file.originalName;
                  link.click();
                }}
              >
                <DownloadIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={onClose}
              className="ml-2"
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        </Toolbar>
        
        <ModalBody className="p-8">
          <div className="text-center">
            {loading && (
              <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" color="primary" />
                <p className="text-sm text-default-500">加载音频中...</p>
              </div>
            )}
            
            {error ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center">
                  <MusicIcon className="w-8 h-8 text-danger-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-danger-700">音频加载失败</h3>
                  <p className="text-sm text-danger-500">无法播放此音频文件</p>
                </div>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => {
                    setError(false);
                    setLoading(true);
                  }}
                >
                  重新加载
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                  <MusicIcon className="w-12 h-12 text-primary-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-dark-olive-800 mb-1">
                    {file.originalName}
                  </h3>
                  <p className="text-sm text-default-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                
                <audio
                  ref={audioRef}
                  src={file.storagePath}
                  controls
                  className="w-full max-w-md"
                  preload="metadata"
                  onLoadStart={() => setLoading(true)}
                  onCanPlay={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError(true);
                  }}
                >
                  您的浏览器不支持音频播放
                </audio>
              </div>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}