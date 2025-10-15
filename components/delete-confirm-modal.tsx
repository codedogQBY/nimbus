"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { AlertTriangleIcon } from "lucide-react";
import ky from "ky";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number;
  itemName: string;
  type: "file" | "folder";
  onSuccess?: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  itemId,
  itemName,
  type,
  onSuccess,
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const endpoint =
        type === "file" ? `/api/files/${itemId}` : `/api/folders/${itemId}`;

      await ky
        .delete(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .json();

      // 触发存储更新事件（仅文件删除时）
      if (type === "file") {
        window.dispatchEvent(new Event("storageUpdated"));
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "删除失败");
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
      isDismissable={!loading}
      isOpen={isOpen}
      size="sm"
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center text-danger">
          <AlertTriangleIcon className="w-5 h-5" />
          确认删除
        </ModalHeader>
        <ModalBody>
          <p className="text-sm">
            确定要删除{type === "file" ? "文件" : "文件夹"}
            <span className="font-semibold mx-1">{itemName}</span>
            吗？
          </p>
          {type === "folder" && (
            <p className="text-xs text-warning mt-2">
              ⚠️ 警告：删除文件夹将同时删除其中的所有文件和子文件夹！
            </p>
          )}
          {error && <p className="text-xs text-danger mt-2">{error}</p>}
        </ModalBody>
        <ModalFooter>
          <Button isDisabled={loading} variant="flat" onPress={handleClose}>
            取消
          </Button>
          <Button color="danger" isLoading={loading} onPress={handleDelete}>
            删除
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
