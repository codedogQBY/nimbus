'use client';

import { useState } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Input,
  Switch,
  Select,
  SelectItem,
  Divider,
} from '@heroui/react';
import { Share2Icon, CopyIcon, CheckCircle2Icon } from 'lucide-react';
import ky from 'ky';

interface CreateShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number;
  itemName: string;
  type: 'file' | 'folder';
  onSuccess?: () => void;
}

export function CreateShareModal({ 
  isOpen, 
  onClose, 
  itemId, 
  itemName, 
  type, 
  onSuccess 
}: CreateShareModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  
  // 分享设置
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [enableExpiry, setEnableExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState('7');

  const handleCreate = async () => {
    if (enablePassword && !password.trim()) {
      setError('请输入分享密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // 计算过期时间
      let expiresAt = undefined;
      if (enableExpiry) {
        const days = parseInt(expiryDays);
        const date = new Date();
        date.setDate(date.getDate() + days);
        expiresAt = date.toISOString();
      }

      const response = await ky.post('/api/shares/create', {
        headers: { Authorization: `Bearer ${token}` },
        json: {
          [type === 'file' ? 'fileId' : 'folderId']: itemId,
          password: enablePassword ? password.trim() : undefined,
          expiresAt,
        },
      }).json<any>();

      setShareUrl(response.share.shareUrl);

      // 复制分享链接到剪贴板
      navigator.clipboard.writeText(response.share.shareUrl);

      setTimeout(() => {
        handleClose();
      }, 2000);

      onSuccess?.();
    } catch (err: any) {
      setError(err.message || '创建分享失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setShareUrl('');
      setPassword('');
      setEnablePassword(false);
      setEnableExpiry(false);
      setExpiryDays('7');
      setCopied(false);
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="md"
      isDismissable={!loading}
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center">
          <Share2Icon className="w-5 h-5 text-amber-brown-500" />
          创建分享链接
        </ModalHeader>
        <ModalBody>
          {!shareUrl ? (
            <div className="space-y-4">
              {/* 文件信息 */}
              <div className="bg-secondary-50 rounded-lg p-3">
                <p className="text-xs text-default-500 mb-1">
                  {type === 'file' ? '文件' : '文件夹'}
                </p>
                <p className="text-sm font-semibold text-dark-olive-800 truncate">
                  {itemName}
                </p>
              </div>

              <Divider />

              {/* 密码保护 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-dark-olive-800">密码保护</p>
                    <p className="text-xs text-default-500">需要密码才能访问</p>
                  </div>
                  <Switch
                    size="sm"
                    isSelected={enablePassword}
                    onValueChange={setEnablePassword}
                  />
                </div>
                
                {enablePassword && (
                  <Input
                    label="分享密码"
                    placeholder="输入4-16位密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    size="sm"
                    minLength={4}
                    maxLength={16}
                  />
                )}
              </div>

              <Divider />

              {/* 有效期 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-dark-olive-800">设置有效期</p>
                    <p className="text-xs text-default-500">过期后自动失效</p>
                  </div>
                  <Switch
                    size="sm"
                    isSelected={enableExpiry}
                    onValueChange={setEnableExpiry}
                  />
                </div>
                
                {enableExpiry && (
                  <Select
                    label="有效期"
                    size="sm"
                    selectedKeys={[expiryDays]}
                    onChange={(e) => setExpiryDays(e.target.value)}
                  >
                    <SelectItem key="1" value="1">1天</SelectItem>
                    <SelectItem key="3" value="3">3天</SelectItem>
                    <SelectItem key="7" value="7">7天</SelectItem>
                    <SelectItem key="30" value="30">30天</SelectItem>
                    <SelectItem key="90" value="90">90天</SelectItem>
                  </Select>
                )}
              </div>

              {error && (
                <p className="text-xs text-danger">{error}</p>
              )}
            </div>
          ) : (
            // 分享成功
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2Icon className="w-12 h-12 text-success" />
                <p className="text-sm text-default-600">分享链接已创建并复制到剪贴板！</p>
                <p className="text-xs text-default-500">2秒后自动关闭</p>
              </div>

              <div className="bg-secondary-50 rounded-lg p-3">
                <p className="text-xs text-default-500 mb-2">分享链接</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-dark-olive-700 break-all">
                    {shareUrl}
                  </code>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    color={copied ? 'success' : 'default'}
                    onPress={handleCopy}
                  >
                    {copied ? <CheckCircle2Icon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {enablePassword && (
                <div className="bg-warning-50 rounded-lg p-3">
                  <p className="text-xs text-warning-700 mb-1">⚠️ 分享密码</p>
                  <code className="text-sm font-mono text-warning-800">{password}</code>
                  <p className="text-xs text-warning-600 mt-1">请妥善保存，此密码不会再次显示</p>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {!shareUrl ? (
            <>
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
            </>
          ) : (
            <Button 
              color="primary" 
              onPress={handleClose}
              className="bg-amber-brown-500"
            >
              完成
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

