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
  ShareImagePreview as ShareImagePreviewComponent,
  ShareVideoPreview as ShareVideoPreviewComponent,
  ShareAudioPreview as ShareAudioPreviewComponent,
  SharePDFPreview as SharePDFPreviewComponent,
} from "./share-preview-components";

export interface ShareFilePreviewProps {
  file: {
    id: number;
    name: string;
    originalName: string;
    size: number;
    mimeType?: string;
    storagePath?: string;
    createdAt?: string;
  };
  shareToken: string;
  onClose: () => void;
}

// 从storagePath中提取分享token
function extractShareToken(storagePath: string): string | null {
  const urlParams = new URLSearchParams(storagePath.split("?")[1] || "");

  return urlParams.get("share");
}

// 分享版本的预览组件（使用分享token而不是用户token）
function ShareImagePreview({
  file,
  shareToken,
  onClose,
}: ShareFilePreviewProps) {
  return (
    <Modal
      classNames={{
        base: "max-w-7xl",
        backdrop: "bg-black/80",
      }}
      hideCloseButton={true}
      isOpen={true}
      size="5xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark-olive-800">
                图片预览
              </h3>
              <p className="text-sm text-default-500">{file.originalName}</p>
            </div>
          </div>
          <Button isIconOnly size="sm" variant="light" onPress={onClose}>
            <XIcon className="w-4 h-4" />
          </Button>
        </ModalHeader>

        <ModalBody className="p-0">
          <ShareImagePreviewComponent
            file={file}
            shareToken={shareToken}
            onDownload={() => {
              window.open(
                `/api/files/${file.id}/serve?share=${shareToken}&download=1`,
                "_blank",
              );
            }}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function ShareVideoPreview({
  file,
  shareToken,
  onClose,
}: ShareFilePreviewProps) {
  return (
    <Modal
      classNames={{
        base: "max-w-7xl",
        backdrop: "bg-black/80",
      }}
      hideCloseButton={true}
      isOpen={true}
      size="5xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <VideoIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark-olive-800">
                视频预览
              </h3>
              <p className="text-sm text-default-500">{file.originalName}</p>
            </div>
          </div>
          <Button isIconOnly size="sm" variant="light" onPress={onClose}>
            <XIcon className="w-4 h-4" />
          </Button>
        </ModalHeader>

        <ModalBody className="p-0">
          <ShareVideoPreviewComponent
            file={file}
            shareToken={shareToken}
            onDownload={() => {
              window.open(
                `/api/files/${file.id}/serve?share=${shareToken}&download=1`,
                "_blank",
              );
            }}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function ShareAudioPreview({
  file,
  shareToken,
  onClose,
}: ShareFilePreviewProps) {
  return (
    <Modal hideCloseButton={true} isOpen={true} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <MusicIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark-olive-800">
                音频预览
              </h3>
              <p className="text-sm text-default-500">{file.originalName}</p>
            </div>
          </div>
          <Button isIconOnly size="sm" variant="light" onPress={onClose}>
            <XIcon className="w-4 h-4" />
          </Button>
        </ModalHeader>

        <ModalBody className="p-0">
          <ShareAudioPreviewComponent
            file={file}
            shareToken={shareToken}
            onDownload={() => {
              window.open(
                `/api/files/${file.id}/serve?share=${shareToken}&download=1`,
                "_blank",
              );
            }}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function SharePDFPreview({ file, shareToken, onClose }: ShareFilePreviewProps) {
  return (
    <Modal
      classNames={{
        base: "max-w-7xl",
        backdrop: "bg-black/80",
      }}
      hideCloseButton={true}
      isOpen={true}
      size="5xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <FileTextIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark-olive-800">
                PDF预览
              </h3>
              <p className="text-sm text-default-500">{file.originalName}</p>
            </div>
          </div>
          <Button isIconOnly size="sm" variant="light" onPress={onClose}>
            <XIcon className="w-4 h-4" />
          </Button>
        </ModalHeader>

        <ModalBody className="p-0">
          <SharePDFPreviewComponent
            file={file}
            shareToken={shareToken}
            onDownload={() => {
              window.open(
                `/api/files/${file.id}/serve?share=${shareToken}&download=1`,
                "_blank",
              );
            }}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
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

// 不支持预览的组件（分享版本）
function ShareUnsupportedPreview({
  file,
  shareToken,
  onClose,
}: ShareFilePreviewProps) {
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
                window.open(
                  `/api/files/${file.id}/serve?share=${shareToken}&download=1`,
                  "_blank",
                );
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

// 主分享预览管理器
export function ShareFilePreviewModal({
  file,
  shareToken,
  onClose,
}: ShareFilePreviewProps) {
  const previewType = getPreviewType(file.originalName, file.mimeType);

  // 检查是否支持预览
  if (!canPreview(file.originalName, file.mimeType, file.size)) {
    return (
      <ShareUnsupportedPreview
        file={file}
        shareToken={shareToken}
        onClose={onClose}
      />
    );
  }

  // 根据文件类型渲染对应的预览组件
  switch (previewType) {
    case PreviewType.IMAGE:
      return (
        <ShareImagePreview
          file={file}
          shareToken={shareToken}
          onClose={onClose}
        />
      );

    case PreviewType.VIDEO:
      return (
        <ShareVideoPreview
          file={file}
          shareToken={shareToken}
          onClose={onClose}
        />
      );

    case PreviewType.AUDIO:
      return (
        <ShareAudioPreview
          file={file}
          shareToken={shareToken}
          onClose={onClose}
        />
      );

    case PreviewType.PDF:
      return (
        <SharePDFPreview
          file={file}
          shareToken={shareToken}
          onClose={onClose}
        />
      );

    default:
      return (
        <ShareUnsupportedPreview
          file={file}
          shareToken={shareToken}
          onClose={onClose}
        />
      );
  }
}
