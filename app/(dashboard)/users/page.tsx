'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody,
  Avatar,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Divider,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Checkbox
} from '@heroui/react';
import { 
  UserPlusIcon, 
  ShieldCheckIcon, 
  UsersIcon,
  MailIcon,
  CalendarIcon,
  MoreVerticalIcon,
  UserCogIcon,
  TrashIcon,
  ClockIcon,
  CheckCircle2Icon
} from 'lucide-react';
import ky from 'ky';
import { useToast } from '@/components/toast-provider';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isBatchDeleteOpen, onOpen: onBatchDeleteOpen, onClose: onBatchDeleteClose } = useDisclosure();
  const { showSuccess, showError, showWarning } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await ky.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      }).json<any>();

      setUsers(response.users);
      setStats(response.stats);
    } catch (err) {
      console.error('加载用户失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string): "success" | "primary" | "warning" | "default" => {
    if (role.includes('所有者') || role.includes('Owner')) return 'success';
    if (role.includes('管理员') || role.includes('Admin')) return 'primary';
    if (role.includes('编辑') || role.includes('Editor')) return 'warning';
    return 'default';
  };

  const handleDeleteUser = (user: any) => {
    setDeletingUser(user);
    onDeleteOpen();
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;

    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      await ky.delete(`/api/users/${deletingUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 从列表中移除已删除的用户
      setUsers(users.filter(u => u.id !== deletingUser.id));
      
      // 更新统计数据
      if (stats) {
        setStats({
          ...stats,
          total: stats.total - 1,
          active: deletingUser.isActive ? stats.active - 1 : stats.active,
          owners: deletingUser.isOwner ? stats.owners - 1 : stats.owners,
        });
      }

      onDeleteClose();
      setDeletingUser(null);
    } catch (err: any) {
      console.error('删除用户失败:', err);
      showError('删除失败', err.response?.json?.()?.error || '删除用户失败，请稍后重试');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUserSelection = (userId: number, selected: boolean) => {
    const newSelection = new Set(selectedUsers);
    if (selected) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      // 只选择非Owner用户
      const selectableUsers = users.filter(user => !user.isOwner);
      setSelectedUsers(new Set(selectableUsers.map(user => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleBatchDelete = () => {
    if (selectedUsers.size === 0) {
      showWarning('提示', '请选择要删除的用户');
      return;
    }
    onBatchDeleteOpen();
  };

  const confirmBatchDelete = async () => {
    if (selectedUsers.size === 0) return;

    setBatchDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await ky.post('/api/users/batch-delete', {
        headers: { Authorization: `Bearer ${token}` },
        json: { userIds: Array.from(selectedUsers) },
      }).json<any>();

      // 从列表中移除已删除的用户
      setUsers(users.filter(u => !selectedUsers.has(u.id)));
      
      // 更新统计数据
      if (stats) {
        const deletedUsers = users.filter(u => selectedUsers.has(u.id));
        const deletedActiveCount = deletedUsers.filter(u => u.isActive).length;
        const deletedOwnerCount = deletedUsers.filter(u => u.isOwner).length;
        
        setStats({
          ...stats,
          total: stats.total - selectedUsers.size,
          active: stats.active - deletedActiveCount,
          owners: stats.owners - deletedOwnerCount,
        });
      }

      setSelectedUsers(new Set());
      onBatchDeleteClose();
      showSuccess('删除成功', `成功删除 ${response.deletedCount} 个用户`);
    } catch (err: any) {
      console.error('批量删除用户失败:', err);
      showError('删除失败', err.response?.json?.()?.error || '批量删除用户失败，请稍后重试');
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-dark-olive-800">用户管理</h1>
            <p className="text-xs lg:text-sm text-default-500 mt-1">管理系统用户和权限分配</p>
          </div>
          <Button
            size="sm"
            isIconOnly
            className="lg:hidden bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
          >
            <UserPlusIcon className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            startContent={<UserPlusIcon className="w-5 h-5" />}
            className="hidden lg:flex bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
          >
            邀请用户
          </Button>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Card className="bg-white">
              <CardBody className="p-4 lg:p-5">
                <div className="flex flex-col lg:flex-row items-center lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-2 lg:mb-0">
                    <UsersIcon className="w-5 h-5 lg:w-6 lg:h-6 text-amber-brown-500" />
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-default-500">总用户</p>
                    <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">{stats.total}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-white">
              <CardBody className="p-4 lg:p-5">
                <div className="flex flex-col lg:flex-row items-center lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-success-100 rounded-lg flex items-center justify-center mb-2 lg:mb-0">
                    <CheckCircle2Icon className="w-5 h-5 lg:w-6 lg:h-6 text-success" />
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-default-500">活跃</p>
                    <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">{stats.active}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-white">
              <CardBody className="p-4 lg:p-5">
                <div className="flex flex-col lg:flex-row items-center lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-warning-100 rounded-lg flex items-center justify-center mb-2 lg:mb-0">
                    <ShieldCheckIcon className="w-5 h-5 lg:w-6 lg:h-6 text-warning" />
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-default-500">管理员</p>
                    <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">{stats.owners}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-white">
              <CardBody className="p-4 lg:p-5">
                <div className="flex flex-col lg:flex-row items-center lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-2 lg:mb-0">
                    <ClockIcon className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                  </div>
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-default-500">今日活跃</p>
                    <p className="text-xl lg:text-2xl font-bold text-dark-olive-800">{stats.lastDay}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* 批量操作工具栏 */}
        {selectedUsers.size > 0 && (
          <Card className="bg-white">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    已选择 {selectedUsers.size} 个用户
                  </span>
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => setSelectedUsers(new Set())}
                  >
                    取消选择
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    onPress={handleBatchDelete}
                    isLoading={batchDeleteLoading}
                    startContent={<TrashIcon className="w-4 h-4" />}
                  >
                    批量删除
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* 用户列表 */}
        <div className="space-y-3 lg:space-y-0">
          {/* 移动端：卡片布局 */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {users.map((user) => (
              <Card key={user.id} className="bg-white">
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    {/* 选择框 */}
                    {!user.isOwner && (
                      <Checkbox
                        isSelected={selectedUsers.has(user.id)}
                        onValueChange={(selected) => handleUserSelection(user.id, selected)}
                        className="mt-1"
                      />
                    )}
                    <Avatar
                      src={user.avatarUrl || undefined}
                      name={user.username}
                      size="lg"
                      className="bg-primary-200 text-dark-olive-800 flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      {/* 用户名和Owner标识 */}
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-base font-semibold text-dark-olive-800 truncate">
                          {user.username}
                        </h4>
                        {user.isOwner && (
                          <ShieldCheckIcon className="w-4 h-4 text-success flex-shrink-0" />
                        )}
                      </div>

                      {/* 邮箱 */}
                      <div className="flex items-center gap-1.5 mb-2 text-xs text-default-500">
                        <MailIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>

                      {/* 角色和状态 */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {user.roles.map((role: string, index: number) => (
                          <Chip
                            key={index}
                            size="sm"
                            color={getRoleBadgeColor(role)}
                            variant="flat"
                          >
                            {role}
                          </Chip>
                        ))}
                        <Chip
                          size="sm"
                          color={user.isActive ? 'success' : 'default'}
                          variant="dot"
                        >
                          {user.isActive ? '活跃' : '未激活'}
                        </Chip>
                      </div>

                      {/* 时间信息 */}
                      <div className="flex items-center gap-4 text-xs text-default-400">
                        <span>注册 {new Date(user.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}</span>
                        {user.lastLoginAt && (
                          <span>登录 {new Date(user.lastLoginAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>

                    {/* 操作菜单 */}
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                        >
                          <MoreVerticalIcon className="w-4 h-4" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="用户操作">
                        <DropdownItem 
                          key="roles"
                          startContent={<UserCogIcon className="w-4 h-4" />}
                        >
                          管理角色
                        </DropdownItem>
                        {!user.isOwner ? (
                          <DropdownItem
                            key="delete"
                            color="danger"
                            startContent={<TrashIcon className="w-4 h-4" />}
                            onPress={() => handleDeleteUser(user)}
                          >
                            删除用户
                          </DropdownItem>
                        ) : null}
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* 桌面端：表格布局 */}
          <Card className="bg-white hidden lg:block">
            <CardBody className="p-0">
              {/* 表头 */}
              <div className="px-6 py-4 bg-secondary-50/50 border-b border-divider">
                <h3 className="text-base font-semibold text-dark-olive-800">用户列表</h3>
              </div>

              {/* 表头操作栏 */}
              <div className="px-6 py-3 bg-secondary-50/30 border-b border-divider">
                <div className="flex items-center gap-4">
                  <Checkbox
                    isSelected={selectedUsers.size > 0 && selectedUsers.size === users.filter(u => !u.isOwner).length}
                    isIndeterminate={selectedUsers.size > 0 && selectedUsers.size < users.filter(u => !u.isOwner).length}
                    onValueChange={handleSelectAll}
                  />
                  <span className="text-sm text-default-500">
                    {selectedUsers.size > 0 ? `已选择 ${selectedUsers.size} 个用户` : '全选'}
                  </span>
                </div>
              </div>

              {/* 用户项 */}
              <div className="divide-y divide-divider">
                {users.map((user) => (
                  <div 
                    key={user.id}
                    className="px-6 py-4 hover:bg-secondary-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* 选择框 */}
                      {!user.isOwner && (
                        <Checkbox
                          isSelected={selectedUsers.has(user.id)}
                          onValueChange={(selected) => handleUserSelection(user.id, selected)}
                        />
                      )}
                      {user.isOwner && <div className="w-5" />}
                      {/* 用户信息 */}
                      <Avatar
                        src={user.avatarUrl || undefined}
                        name={user.username}
                        size="lg"
                        className="bg-primary-200 text-dark-olive-800"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-semibold text-dark-olive-800">
                            {user.username}
                          </h4>
                          {user.isOwner && (
                            <ShieldCheckIcon className="w-4 h-4 text-success" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-default-500">
                          <span className="flex items-center gap-1">
                            <MailIcon className="w-3.5 h-3.5" />
                            {user.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      </div>

                      {/* 角色标签 */}
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((role: string, index: number) => (
                          <Chip
                            key={index}
                            size="sm"
                            color={getRoleBadgeColor(role)}
                            variant="flat"
                          >
                            {role}
                          </Chip>
                        ))}
                      </div>

                      {/* 状态 */}
                      <Chip
                        size="sm"
                        color={user.isActive ? 'success' : 'default'}
                        variant="dot"
                      >
                        {user.isActive ? '已激活' : '未激活'}
                      </Chip>

                      {/* 最后登录 */}
                      <div className="text-sm text-default-500 w-32">
                        <p className="text-xs mb-0.5">最后登录</p>
                        <p className="text-xs font-medium">
                          {user.lastLoginAt 
                            ? new Date(user.lastLoginAt).toLocaleString('zh-CN', { 
                                month: '2-digit', 
                                day: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : '从未登录'
                          }
                        </p>
                      </div>

                      {/* 操作菜单 */}
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                          >
                            <MoreVerticalIcon className="w-4 h-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="用户操作">
                          <DropdownItem 
                            key="roles"
                            startContent={<UserCogIcon className="w-4 h-4" />}
                          >
                            管理角色
                          </DropdownItem>
                          {!user.isOwner ? (
                            <DropdownItem
                              key="delete"
                              color="danger"
                              startContent={<TrashIcon className="w-4 h-4" />}
                              onPress={() => handleDeleteUser(user)}
                            >
                              删除用户
                            </DropdownItem>
                          ) : null}
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* 删除确认模态框 */}
      <Modal 
        isOpen={isDeleteOpen} 
        onClose={onDeleteClose}
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            确认删除用户
          </ModalHeader>
          <ModalBody>
            <p>
              您确定要删除用户 <strong>{deletingUser?.username}</strong> 吗？
            </p>
            <p className="text-sm text-gray-500">
              此操作将永久删除该用户及其所有相关数据（包括文件、文件夹、分享等），且无法撤销。
            </p>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="default" 
              variant="light" 
              onPress={onDeleteClose}
              disabled={deleteLoading}
            >
              取消
            </Button>
            <Button 
              color="danger" 
              onPress={confirmDeleteUser}
              isLoading={deleteLoading}
            >
              确认删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 批量删除确认模态框 */}
      <Modal 
        isOpen={isBatchDeleteOpen} 
        onClose={onBatchDeleteClose}
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            确认批量删除用户
          </ModalHeader>
          <ModalBody>
            <p>
              您确定要删除选中的 <strong>{selectedUsers.size}</strong> 个用户吗？
            </p>
            <p className="text-sm text-gray-500">
              此操作将永久删除这些用户及其所有相关数据（包括文件、文件夹、分享等），且无法撤销。
            </p>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="default" 
              variant="light" 
              onPress={onBatchDeleteClose}
              disabled={batchDeleteLoading}
            >
              取消
            </Button>
            <Button 
              color="danger" 
              onPress={confirmBatchDelete}
              isLoading={batchDeleteLoading}
            >
              确认删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
