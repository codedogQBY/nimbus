"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { EditIcon } from "lucide-react";
import ky from "ky";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: number;
  currentName: string;
  type: "file" | "folder";
  onSuccess?: () => void;
}

export function RenameModal({
  isOpen,
  onClose,
  fileId,
  currentName,
  type,
  onSuccess,
}: RenameModalProps) {
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setError("");
    }
  }, [isOpen, currentName]);

  const handleRename = async () => {
    if (!newName.trim()) {
      setError("请输入名称");

      return;
    }

    if (newName.trim() === currentName) {
      onClose();

      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const endpoint =
        type === "file" ? `/api/files/${fileId}` : `/api/folders/${fileId}`;

      await ky
        .patch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          json: {
            [type === "file" ? "originalName" : "name"]: newName.trim(),
          },
        })
        .json();

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "重命名失败");
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
        <ModalHeader className="flex gap-2 items-center">
          <EditIcon className="w-5 h-5 text-amber-brown-500" />
          重命名{type === "file" ? "文件" : "文件夹"}
        </ModalHeader>
        <ModalBody>
          <Input
            errorMessage={error}
            isDisabled={loading}
            isInvalid={!!error}
            label="新名称"
            placeholder="输入新名称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !loading) {
                handleRename();
              }
            }}
          />
        </ModalBody>
        <ModalFooter>
          <Button isDisabled={loading} variant="flat" onPress={handleClose}>
            取消
          </Button>
          <Button
            className="bg-amber-brown-500"
            color="primary"
            isLoading={loading}
            onPress={handleRename}
          >
            确认
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
