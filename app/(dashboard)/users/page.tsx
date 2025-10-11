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
  Spinner
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

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

        {/* 用户列表 */}
        <div className="space-y-3 lg:space-y-0">
          {/* 移动端：卡片布局 */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {users.map((user) => (
              <Card key={user.id} className="bg-white">
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
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

              {/* 用户项 */}
              <div className="divide-y divide-divider">
                {users.map((user) => (
                  <div 
                    key={user.id}
                    className="px-6 py-4 hover:bg-secondary-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
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
    </div>
  );
}
