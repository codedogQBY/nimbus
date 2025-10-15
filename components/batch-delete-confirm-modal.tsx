"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
} from "@heroui/react";
import { AlertTriangleIcon, FileIcon, FolderIcon } from "lucide-react";
import ky from "ky";

interface BatchDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFiles: Set<number>;
  selectedFolders: Set<number>;
  onSuccess?: () => void;
}

export function BatchDeleteConfirmModal({
  isOpen,
  onClose,
  selectedFiles,
  selectedFolders,
  onSuccess,
}: BatchDeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalCount = selectedFiles.size + selectedFolders.size;

  const handleBatchDelete = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await ky
        .post("/api/files/batch-delete", {
          headers: { Authorization: `Bearer ${token}` },
          json: {
            fileIds: Array.from(selectedFiles),
            folderIds: Array.from(selectedFolders),
          },
        })
        .json<{
          success: boolean;
          results: {
            deletedFiles: number;
            deletedFolders: number;
            errors: string[];
          };
          message: string;
        }>();

      if (response.success) {
        // 触发存储更新事件
        window.dispatchEvent(new Event("storageUpdated"));

        onSuccess?.();
        onClose();
      } else {
        throw new Error("批量删除失败");
      }
    } catch (error) {
      console.error("批量删除失败:", error);
      setError(error instanceof Error ? error.message : "删除失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError("");
      onClose();
    }
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "mx-4 my-4 sm:mx-0 sm:my-0",
        body: "py-4 px-4 sm:px-6",
        header: "px-4 sm:px-6 pt-4 sm:pt-6 pb-2",
        footer: "px-4 sm:px-6 pb-4 sm:pb-6 pt-2",
      }}
      isOpen={isOpen}
      placement="center"
      size="md"
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangleIcon className="w-5 h-5 text-danger-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground">
                确认批量删除
              </h3>
              <p className="text-sm text-default-500 mt-1">此操作无法撤销</p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 sm:p-4">
              <p className="text-sm text-danger-800 mb-3">
                您即将删除以下项目：
              </p>

              <div className="flex flex-wrap gap-2">
                {selectedFiles.size > 0 && (
                  <Chip
                    className="text-xs"
                    color="danger"
                    size="sm"
                    startContent={<FileIcon className="w-3 h-3" />}
                    variant="flat"
                  >
                    {selectedFiles.size} 个文件
                  </Chip>
                )}

                {selectedFolders.size > 0 && (
                  <Chip
                    className="text-xs"
                    color="danger"
                    size="sm"
                    startContent={<FolderIcon className="w-3 h-3" />}
                    variant="flat"
                  >
                    {selectedFolders.size} 个文件夹
                  </Chip>
                )}
              </div>

              <p className="text-xs text-danger-700 mt-3">
                总计 <strong>{totalCount}</strong> 个项目将被永久删除
              </p>
            </div>

            {selectedFolders.size > 0 && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 sm:p-4">
                <p className="text-sm text-warning-800">
                  <strong>注意：</strong>
                  删除文件夹将同时删除其中的所有文件和子文件夹
                </p>
              </div>
            )}

            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 sm:p-4">
                <p className="text-sm text-danger-800">{error}</p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
            <Button
              className="w-full sm:w-auto order-2 sm:order-1"
              isDisabled={loading}
              variant="flat"
              onPress={handleClose}
            >
              取消
            </Button>
            <Button
              className="w-full sm:w-auto order-1 sm:order-2"
              color="danger"
              isLoading={loading}
              onPress={handleBatchDelete}
            >
              {loading ? "删除中..." : `删除 ${totalCount} 个项目`}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
