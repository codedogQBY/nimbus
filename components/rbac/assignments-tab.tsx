'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Spinner,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  RadioGroup,
  Radio,
} from '@heroui/react';
import {
  SearchIcon,
  UserIcon,
  ShieldIcon,
  CrownIcon,
} from 'lucide-react';
import ky from 'ky';

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  is_owner: boolean;
  is_active: boolean;
  userRoles: Array<{
    role: {
      id: number;
      name: string;
    };
  }>;
}

const ROLE_COLORS: Record<string, any> = {
  owner: 'danger',
  admin: 'primary',
  editor: 'secondary',
  viewer: 'success',
  guest: 'default',
};

export function AssignmentsTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Record<number, Set<string>>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = await ky.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      }).json<{ users: User[] }>();

      setUsers(data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId: number, keys: any) => {
    setSelectedRoles(prev => ({
      ...prev,
      [userId]: new Set(Array.from(keys))
    }));
  };

  const openAssignModal = (user: User) => {
    setCurrentUser(user);
    setSelectedRole('');
    onOpen();
  };

  const handleAssignRole = async (userId: number) => {
    const roleKeys = selectedRoles[userId];
    if (!roleKeys || roleKeys.size === 0) {
      alert('请先选择角色');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const roleKey = Array.from(roleKeys)[0]; // 取第一个（单选）
      
      await ky.post('/api/rbac/assign', {
        headers: { Authorization: `Bearer ${token}` },
        json: {
          userId,
          roleName: roleKey,
        },
      }).json();

      alert('角色分配成功');
      loadUsers(); // 重新加载用户列表
      
      // 清除选择
      setSelectedRoles(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    } catch (error: any) {
      console.error('Assign role error:', error);
      alert('角色分配失败：' + (error.message || '未知错误'));
    }
  };

  const handleModalAssign = async () => {
    if (!currentUser || !selectedRole) {
      alert('请选择角色');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      await ky.post('/api/rbac/assign', {
        headers: { Authorization: `Bearer ${token}` },
        json: {
          userId: currentUser.id,
          roleName: selectedRole,
        },
      }).json();

      alert('角色分配成功');
      onClose();
      loadUsers(); // 重新加载用户列表
    } catch (error: any) {
      console.error('Assign role error:', error);
      alert('角色分配失败：' + (error.message || '未知错误'));
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* 顶部搜索栏 */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="搜索用户..."
            startContent={<SearchIcon className="w-4 h-4 text-default-400" />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            classNames={{
              input: "text-sm",
              inputWrapper: "h-10"
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" color="primary" />
        </div>
      ) : (
        <>
          {/* 桌面端表格 */}
          <div className="hidden lg:block">
            <Table aria-label="用户角色分配">
              <TableHeader>
                <TableColumn>用户</TableColumn>
                <TableColumn>邮箱</TableColumn>
                <TableColumn>当前角色</TableColumn>
                <TableColumn>状态</TableColumn>
                <TableColumn width={300}>操作</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatar_url || undefined}
                          name={user.username}
                          size="sm"
                          className="flex-shrink-0"
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-dark-olive-800">
                            {user.username}
                          </span>
                          {user.is_owner && (
                            <CrownIcon className="w-4 h-4 text-warning-500" />
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-default-600">{user.email}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(user.userRoles || []).map((ur) => (
                          <Chip
                            key={ur.role.id}
                            size="sm"
                            variant="flat"
                            color={ROLE_COLORS[ur.role.name.toLowerCase()] || 'default'}
                          >
                            {ur.role.name}
                          </Chip>
                        ))}
                        {(!user.userRoles || user.userRoles.length === 0) && (
                          <Chip size="sm" variant="flat" color="default">
                            无角色
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={user.is_active ? 'success' : 'default'}
                      >
                        {user.is_active ? '活跃' : '未激活'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          placeholder="分配角色"
                          size="sm"
                          className="w-40"
                          disabled={user.is_owner}
                          aria-label="选择角色"
                          selectionMode="single"
                          selectedKeys={selectedRoles[user.id] || new Set()}
                          onSelectionChange={(keys) => handleRoleChange(user.id, keys)}
                        >
                          <SelectItem key="admin">管理员</SelectItem>
                          <SelectItem key="editor">编辑者</SelectItem>
                          <SelectItem key="viewer">查看者</SelectItem>
                          <SelectItem key="guest">访客</SelectItem>
                        </Select>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          disabled={user.is_owner}
                          onPress={() => handleAssignRole(user.id)}
                        >
                          分配
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 移动端卡片 */}
          <div className="lg:hidden space-y-3">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="bg-white">
                <CardBody className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar
                      src={user.avatar_url || undefined}
                      name={user.username}
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-dark-olive-800 truncate">
                          {user.username}
                        </h4>
                        {user.is_owner && (
                          <CrownIcon className="w-4 h-4 text-warning-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-default-600 truncate">{user.email}</p>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={user.is_active ? 'success' : 'default'}
                        className="mt-2"
                      >
                        {user.is_active ? '活跃' : '未激活'}
                      </Chip>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-default-500 mb-2">当前角色：</p>
                    <div className="flex flex-wrap gap-2">
                      {(user.userRoles || []).map((ur) => (
                        <Chip
                          key={ur.role.id}
                          size="sm"
                          variant="flat"
                          color={ROLE_COLORS[ur.role.name.toLowerCase()] || 'default'}
                        >
                          {ur.role.name}
                        </Chip>
                      ))}
                      {(!user.userRoles || user.userRoles.length === 0) && (
                        <Chip size="sm" variant="flat" color="default">
                          无角色
                        </Chip>
                      )}
                    </div>
                  </div>

                  {!user.is_owner && (
                    <Button
                      size="sm"
                      color="primary"
                      fullWidth
                      onPress={() => openAssignModal(user)}
                    >
                      分配角色
                    </Button>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark-olive-800 mb-2">
                没有找到用户
              </h3>
              <p className="text-sm text-default-500">
                请尝试其他搜索关键词
              </p>
            </div>
          )}
        </>
      )}

      {/* 角色分配Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <ShieldIcon className="w-5 h-5 text-primary-500" />
              <span>分配角色</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {currentUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                  <Avatar
                    src={currentUser.avatar_url || undefined}
                    name={currentUser.username}
                    size="md"
                  />
                  <div>
                    <p className="font-semibold text-dark-olive-800">{currentUser.username}</p>
                    <p className="text-sm text-default-500">{currentUser.email}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-dark-olive-800 mb-2">当前角色：</p>
                  <div className="flex flex-wrap gap-2">
                    {(currentUser.userRoles || []).map((ur) => (
                      <Chip
                        key={ur.role.id}
                        size="sm"
                        variant="flat"
                        color={ROLE_COLORS[ur.role.name.toLowerCase()] || 'default'}
                      >
                        {ur.role.name}
                      </Chip>
                    ))}
                    {(!currentUser.userRoles || currentUser.userRoles.length === 0) && (
                      <Chip size="sm" variant="flat" color="default">
                        无角色
                      </Chip>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-dark-olive-800 mb-3">选择新角色：</p>
                  <RadioGroup
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                  >
                    <Radio value="admin" description="拥有管理权限">
                      管理员
                    </Radio>
                    <Radio value="editor" description="可编辑文件和分享">
                      编辑者
                    </Radio>
                    <Radio value="viewer" description="只读权限">
                      查看者
                    </Radio>
                    <Radio value="guest" description="临时访问权限">
                      访客
                    </Radio>
                  </RadioGroup>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onClose}
            >
              取消
            </Button>
            <Button
              color="primary"
              onPress={handleModalAssign}
              isDisabled={!selectedRole}
            >
              确认分配
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

