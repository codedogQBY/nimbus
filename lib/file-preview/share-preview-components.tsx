"use client";

import React, { useState, useEffect } from "react";
import { Button, Spinner } from "@heroui/react";
import {
  DownloadIcon,
  RotateCwIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RefreshCwIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  FileTextIcon,
} from "lucide-react";

import { ShareAuthenticatedImage } from "@/components/share-authenticated-image";
import { getPreviewType, PreviewType } from "@/lib/file-preview/types";

export interface SharePreviewComponentProps {
  file: {
    id: number;
    name: string;
    originalName: string;
    size: number;
    mimeType?: string;
  };
  shareToken: string;
  onDownload?: () => void;
}

// 图片预览组件（分享版本）
export function ShareImagePreview({
  file,
  shareToken,
  onDownload,
}: SharePreviewComponentProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
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
        y: e.clientY - dragStart.y,
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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-divider">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button
            isIconOnly
            isDisabled={scale <= 0.25}
            size="sm"
            variant="light"
            onPress={handleZoomOut}
          >
            <ZoomOutIcon className="w-4 h-4" />
          </Button>

          <span className="text-sm text-default-500 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <Button
            isIconOnly
            isDisabled={scale >= 5}
            size="sm"
            variant="light"
            onPress={handleZoomIn}
          >
            <ZoomInIcon className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-divider mx-2" />

          <Button isIconOnly size="sm" variant="light" onPress={handleRotate}>
            <RotateCwIcon className="w-4 h-4" />
          </Button>

          <Button isIconOnly size="sm" variant="light" onPress={handleReset}>
            <RefreshCwIcon className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button isIconOnly size="sm" variant="light" onPress={onDownload}>
            <DownloadIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 图片显示区域 */}
      <div
        className="w-full h-[600px] bg-gradient-to-br from-default-50 to-default-100 flex items-center justify-center relative overflow-hidden"
        onWheel={handleWheel}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <Spinner color="primary" size="lg" />
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
              <h3 className="text-lg font-semibold text-danger-700">
                图片加载失败
              </h3>
              <p className="text-sm text-danger-500">
                无法显示此图片，请检查文件是否损坏
              </p>
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
          <ShareAuthenticatedImage
            alt={file.originalName}
            className="max-w-full max-h-full object-contain transition-all duration-200 select-none"
            draggable={false}
            shareToken={shareToken}
            src={`/api/files/${file.id}/serve?share=${shareToken}`}
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
              cursor:
                scale > 1 ? (isDragging ? "grabbing" : "grab") : "pointer",
            }}
            onClick={(e) => {
              if (!isDragging && scale === 1) {
                handleZoomIn();
              }
            }}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            onLoad={() => setLoading(false)}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        )}
      </div>
    </div>
  );
}

// 视频预览组件（分享版本）
export function ShareVideoPreview({
  file,
  shareToken,
  onDownload,
}: SharePreviewComponentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>("");

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true);
        setError(false);

        const videoUrl = `/api/files/${file.id}/serve?share=${shareToken}`;
        const response = await fetch(videoUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        setVideoSrc(blobUrl);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load share video:", err);
        setError(true);
        setLoading(false);
      }
    };

    loadVideo();

    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [file.id, shareToken]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-divider">
        <div className="flex items-center gap-2">
          <VideoIcon className="w-5 h-5 text-primary-500" />
          <span className="text-sm font-medium text-dark-olive-800">
            视频播放器
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button isIconOnly size="sm" variant="light" onPress={onDownload}>
            <DownloadIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 视频播放区域 */}
      <div className="w-full bg-black relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <Spinner color="primary" size="lg" />
              <p className="text-sm text-white">加载视频中...</p>
            </div>
          </div>
        )}

        {error ? (
          <div className="aspect-video bg-danger-50 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <VideoIcon className="w-12 h-12 text-danger-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-danger-700">
                视频加载失败
              </h3>
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
        ) : videoSrc ? (
          <video
            controls
            className="w-full h-auto max-h-[70vh]"
            preload="metadata"
            src={videoSrc}
            onCanPlay={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            onLoadStart={() => setLoading(true)}
          >
            <track default kind="captions" label="English" srcLang="en" />
            您的浏览器不支持视频播放
          </video>
        ) : null}
      </div>
    </div>
  );
}

// 音频预览组件（分享版本）
export function ShareAudioPreview({
  file,
  shareToken,
  onDownload,
}: SharePreviewComponentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string>("");

  useEffect(() => {
    const loadAudio = async () => {
      try {
        setLoading(true);
        setError(false);

        const audioUrl = `/api/files/${file.id}/serve?share=${shareToken}`;
        const response = await fetch(audioUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        setAudioSrc(blobUrl);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load share audio:", err);
        setError(true);
        setLoading(false);
      }
    };

    loadAudio();

    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [file.id, shareToken]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden p-6">
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MusicIcon className="w-5 h-5 text-primary-500" />
          <span className="text-sm font-medium text-dark-olive-800">
            音频播放器
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button isIconOnly size="sm" variant="light" onPress={onDownload}>
            <DownloadIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 音频播放区域 */}
      <div className="text-center">
        {loading && (
          <div className="flex flex-col items-center gap-4">
            <Spinner color="primary" size="lg" />
            <p className="text-sm text-default-500">加载音频中...</p>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center">
              <MusicIcon className="w-8 h-8 text-danger-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-danger-700">
                音频加载失败
              </h3>
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
        ) : audioSrc ? (
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
              controls
              className="w-full max-w-md"
              preload="metadata"
              src={audioSrc}
              onCanPlay={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              onLoadStart={() => setLoading(true)}
            >
              <track default kind="captions" label="English" srcLang="en" />
              您的浏览器不支持音频播放
            </audio>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// PDF预览组件（分享版本）
export function SharePDFPreview({
  file,
  shareToken,
  onDownload,
}: SharePreviewComponentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pdfSrc, setPdfSrc] = useState<string>("");

  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(false);

        const pdfUrl = `/api/files/${file.id}/serve?share=${shareToken}`;
        const response = await fetch(pdfUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        setPdfSrc(blobUrl);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load share PDF:", err);
        setError(true);
        setLoading(false);
      }
    };

    loadPDF();

    return () => {
      if (pdfSrc) {
        URL.revokeObjectURL(pdfSrc);
      }
    };
  }, [file.id, shareToken]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-divider">
        <div className="flex items-center gap-2">
          <FileTextIcon className="w-5 h-5 text-primary-500" />
          <span className="text-sm font-medium text-dark-olive-800">
            PDF 查看器
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button isIconOnly size="sm" variant="light" onPress={onDownload}>
            <DownloadIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF显示区域 */}
      <div className="w-full h-[700px] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="flex flex-col items-center gap-3">
              <Spinner color="primary" size="lg" />
              <p className="text-sm text-default-500">加载 PDF 中...</p>
            </div>
          </div>
        )}

        {error ? (
          <div className="h-full flex items-center justify-center bg-danger-50">
            <div className="text-center">
              <FileTextIcon className="w-12 h-12 text-danger-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-danger-700">
                PDF 加载失败
              </h3>
              <p className="text-sm text-danger-500 mb-4">
                无法显示此 PDF 文件
              </p>
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
        ) : pdfSrc ? (
          <iframe
            allow="fullscreen"
            className="w-full h-full border-0"
            src={pdfSrc}
            title={file.originalName}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            onLoad={() => setLoading(false)}
          />
        ) : null}
      </div>
    </div>
  );
}

// 通用的分享文件预览组件
export function ShareFilePreview({
  file,
  shareToken,
  onDownload,
}: SharePreviewComponentProps) {
  const fileName = file.originalName || file.name || "";
  const previewType = getPreviewType(fileName, file.mimeType);

  switch (previewType) {
    case PreviewType.IMAGE:
      return (
        <ShareImagePreview
          file={file}
          shareToken={shareToken}
          onDownload={onDownload}
        />
      );

    case PreviewType.VIDEO:
      return (
        <ShareVideoPreview
          file={file}
          shareToken={shareToken}
          onDownload={onDownload}
        />
      );

    case PreviewType.AUDIO:
      return (
        <ShareAudioPreview
          file={file}
          shareToken={shareToken}
          onDownload={onDownload}
        />
      );

    case PreviewType.PDF:
      return (
        <SharePDFPreview
          file={file}
          shareToken={shareToken}
          onDownload={onDownload}
        />
      );

    default:
      // 不支持预览的文件类型，返回null，让父组件显示默认的下载界面
      return null;
  }
}
