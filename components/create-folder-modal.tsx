'use client';

import { useState } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Input 
} from '@heroui/react';
import { FolderPlusIcon } from 'lucide-react';
import ky from 'ky';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: number | null;
  onSuccess?: () => void;
}

export function CreateFolderModal({ isOpen, onClose, parentId, onSuccess }: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!folderName.trim()) {
      setError('请输入文件夹名称');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await ky.post('/api/folders', {
        headers: { Authorization: `Bearer ${token}` },
        json: {
          name: folderName.trim(),
          parentId: parentId || null,
        },
      }).json();

      setFolderName('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFolderName('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="sm"
      isDismissable={!loading}
    >
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center">
          <FolderPlusIcon className="w-5 h-5 text-amber-brown-500" />
          新建文件夹
        </ModalHeader>
        <ModalBody>
          <Input
            autoFocus
            label="文件夹名称"
            placeholder="输入文件夹名称"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleCreate();
              }
            }}
            isInvalid={!!error}
            errorMessage={error}
            isDisabled={loading}
          />
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="flat" 
            onPress={handleClose}
            isDisabled={loading}
          >
            取消
          </Button>
          <Button 
            color="primary" 
            onPress={handleCreate}
            isLoading={loading}
            className="bg-amber-brown-500"
          >
            创建
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

