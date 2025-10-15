"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
} from "@heroui/react";
import {
  DownloadIcon,
  XIcon,
  FileIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  FileTextIcon,
  CodeIcon,
  ArchiveIcon,
  AlertTriangleIcon,
} from "lucide-react";

import { PreviewType, canPreview, getPreviewType } from "./types";
import {
  ImagePreview,
  VideoPreview,
  AudioPreview,
  PDFPreview,
} from "./preview-components";

export interface FilePreviewProps {
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

// 文件类型图标映射
const FILE_TYPE_ICONS = {
  [PreviewType.IMAGE]: ImageIcon,
  [PreviewType.VIDEO]: VideoIcon,
  [PreviewType.AUDIO]: MusicIcon,
  [PreviewType.PDF]: FileTextIcon,
  [PreviewType.TEXT]: FileTextIcon,
  [PreviewType.CODE]: CodeIcon,
  [PreviewType.MARKDOWN]: FileTextIcon,
  [PreviewType.OFFICE]: FileTextIcon,
  [PreviewType.ARCHIVE]: ArchiveIcon,
  [PreviewType.NOT_SUPPORTED]: FileIcon,
};

// 文件类型颜色映射
const FILE_TYPE_COLORS = {
  [PreviewType.IMAGE]: "text-green-500",
  [PreviewType.VIDEO]: "text-blue-500",
  [PreviewType.AUDIO]: "text-purple-500",
  [PreviewType.PDF]: "text-red-500",
  [PreviewType.TEXT]: "text-gray-500",
  [PreviewType.CODE]: "text-orange-500",
  [PreviewType.MARKDOWN]: "text-blue-600",
  [PreviewType.OFFICE]: "text-indigo-500",
  [PreviewType.ARCHIVE]: "text-yellow-500",
  [PreviewType.NOT_SUPPORTED]: "text-gray-400",
};

// 不支持预览的组件
function UnsupportedPreview({ file, onClose }: FilePreviewProps) {
  const previewType = getPreviewType(file.originalName, file.mimeType);
  const Icon = FILE_TYPE_ICONS[previewType] || FileIcon;
  const iconColor = FILE_TYPE_COLORS[previewType] || "text-gray-400";

  return (
    <Modal
      classNames={{
        base: "max-w-lg",
      }}
      hideCloseButton={true}
      isOpen={true}
      size="md"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br from-default-100 to-default-200 flex items-center justify-center`}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark-olive-800">
                不支持预览
              </h3>
              <p className="text-sm text-default-500">{file.originalName}</p>
            </div>
          </div>
          <Button isIconOnly size="sm" variant="light" onPress={onClose}>
            <XIcon className="w-4 h-4" />
          </Button>
        </ModalHeader>

        <ModalBody className="text-center py-8">
          <div className="w-20 h-20 bg-gradient-to-br from-warning-100 to-warning-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangleIcon className="w-10 h-10 text-warning-500" />
          </div>

          <h4 className="text-lg font-semibold text-dark-olive-800 mb-2">
            此文件类型暂不支持在线预览
          </h4>

          <p className="text-sm text-default-500 mb-6 max-w-sm mx-auto">
            我们正在努力支持更多文件格式的预览功能。您可以下载文件后使用本地应用程序打开。
          </p>

          <div className="space-y-3">
            <Button
              className="w-full"
              color="primary"
              startContent={<DownloadIcon className="w-4 h-4" />}
              onPress={() => {
                const token = localStorage.getItem("token");
                const downloadUrl = `/api/files/${file.id}/serve?download=1&token=${encodeURIComponent(token || "")}`;

                window.open(downloadUrl, "_blank");
              }}
            >
              下载文件
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// 开发中的预览组件
function ComingSoonPreview({ file, onClose }: FilePreviewProps) {
  const previewType = getPreviewType(file.originalName, file.mimeType);
  const Icon = FILE_TYPE_ICONS[previewType] || FileIcon;
  const iconColor = FILE_TYPE_COLORS[previewType] || "text-gray-400";

  return (
    <Modal
      classNames={{
        base: "max-w-2xl",
      }}
      hideCloseButton={true}
      isOpen={true}
      size="lg"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center`}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark-olive-800">
                预览功能开发中
              </h3>
              <p className="text-sm text-default-500">{file.originalName}</p>
            </div>
          </div>
          <Button isIconOnly size="sm" variant="light" onPress={onClose}>
            <XIcon className="w-4 h-4" />
          </Button>
        </ModalHeader>

        <ModalBody className="text-center py-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className={`w-10 h-10 ${iconColor}`} />
          </div>

          <h4 className="text-lg font-semibold text-dark-olive-800 mb-2">
            预览功能即将推出
          </h4>

          <p className="text-sm text-default-500 mb-6 max-w-sm mx-auto">
            我们正在为 {previewType} 文件类型开发预览功能，敬请期待！
          </p>

          <div className="space-y-3">
            <Button
              className="w-full"
              color="primary"
              startContent={<DownloadIcon className="w-4 h-4" />}
              onPress={() => {
                const token = localStorage.getItem("token");
                const downloadUrl = `/api/files/${file.id}/serve?download=1&token=${encodeURIComponent(token || "")}`;

                window.open(downloadUrl, "_blank");
              }}
            >
              下载文件
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// 主预览管理器
export function FilePreview({ file, onClose }: FilePreviewProps) {
  const previewType = getPreviewType(file.originalName, file.mimeType);

  // 检查是否支持预览
  if (!canPreview(file.originalName, file.mimeType, file.size)) {
    return <UnsupportedPreview file={file} onClose={onClose} />;
  }

  // 根据文件类型渲染对应的预览组件
  switch (previewType) {
    case PreviewType.IMAGE:
      return <ImagePreview file={file} onClose={onClose} />;

    case PreviewType.VIDEO:
      return <VideoPreview file={file} onClose={onClose} />;

    case PreviewType.AUDIO:
      return <AudioPreview file={file} onClose={onClose} />;

    case PreviewType.PDF:
      return <PDFPreview file={file} onClose={onClose} />;

    case PreviewType.TEXT:
    case PreviewType.CODE:
    case PreviewType.MARKDOWN:
      return <ComingSoonPreview file={file} onClose={onClose} />;

    case PreviewType.OFFICE:
    case PreviewType.ARCHIVE:
      return <ComingSoonPreview file={file} onClose={onClose} />;

    default:
      return <UnsupportedPreview file={file} onClose={onClose} />;
  }
}

// 预览图标组件 - 更美观的版本
export function getPreviewIcon(
  filename: string,
  mimeType?: string,
): React.ReactNode {
  const previewType = getPreviewType(filename, mimeType);
  const Icon = FILE_TYPE_ICONS[previewType];
  const iconColor = FILE_TYPE_COLORS[previewType];

  if (previewType === PreviewType.NOT_SUPPORTED) {
    return null;
  }

  return (
    <div className="flex items-center justify-center w-6 h-6">
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </div>
  );
}

// 检查文件是否有预览图标
export function hasPreviewIcon(filename: string, mimeType?: string): boolean {
  const previewType = getPreviewType(filename, mimeType);

  return previewType !== PreviewType.NOT_SUPPORTED;
}

// 获取预览状态信息
export function getPreviewStatus(
  filename: string,
  mimeType?: string,
): {
  supported: boolean;
  type: PreviewType;
  status: "ready" | "coming-soon" | "not-supported";
} {
  const previewType = getPreviewType(filename, mimeType);
  const supported = canPreview(filename, mimeType);

  let status: "ready" | "coming-soon" | "not-supported" = "not-supported";

  if (supported) {
    if (
      [
        PreviewType.IMAGE,
        PreviewType.VIDEO,
        PreviewType.AUDIO,
        PreviewType.PDF,
      ].includes(previewType)
    ) {
      status = "ready";
    } else {
      status = "coming-soon";
    }
  }

  return {
    supported,
    type: previewType,
    status,
  };
}
