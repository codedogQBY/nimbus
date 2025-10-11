'use client';

import { 
  Card, 
  CardBody, 
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@heroui/react';
import { UserPlusIcon, MoreVerticalIcon, ShieldCheckIcon, UserIcon, EyeIcon } from 'lucide-react';

export default function UsersPage() {
  // Mock数据
  const users = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      avatarUrl: null,
      isOwner: true,
      isActive: true,
      roles: ['Owner'],
      createdAt: new Date(),
    },
  ];

  const getRoleBadgeColor = (role: string): "success" | "primary" | "warning" | "default" => {
    switch (role) {
      case 'Owner':
        return 'success';
      case 'Admin':
        return 'primary';
      case 'Editor':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-olive-800">用户管理</h1>
          <p className="text-sm text-dark-olive-600 mt-1">管理系统用户和权限</p>
        </div>

        <Button
          startContent={<UserPlusIcon className="w-4 h-4" />}
          className="bg-amber-brown-500 hover:bg-amber-brown-600 text-white"
        >
          邀请用户
        </Button>
      </div>

      {/* 用户列表 */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardBody className="p-0">
          <Table aria-label="用户列表">
            <TableHeader>
              <TableColumn>用户</TableColumn>
              <TableColumn>角色</TableColumn>
              <TableColumn>状态</TableColumn>
              <TableColumn>注册时间</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.avatarUrl || undefined}
                        name={user.username}
                        size="sm"
                        className="bg-primary-200"
                      />
                      <div>
                        <p className="font-medium text-dark-olive-800 flex items-center gap-2">
                          {user.username}
                          {user.isOwner && (
                            <ShieldCheckIcon className="w-4 h-4 text-success" />
                          )}
                        </p>
                        <p className="text-xs text-default-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((role, index) => (
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
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={user.isActive ? 'success' : 'default'}
                      variant="dot"
                    >
                      {user.isActive ? '已激活' : '未激活'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-default-600">
                      {user.createdAt.toLocaleDateString('zh-CN')}
                    </span>
                  </TableCell>
                  <TableCell>
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
                          key="view"
                          startContent={<EyeIcon className="w-4 h-4" />}
                        >
                          查看详情
                        </DropdownItem>
                        <DropdownItem
                          key="roles"
                          startContent={<UserIcon className="w-4 h-4" />}
                        >
                          管理角色
                        </DropdownItem>
                        {!user.isOwner ? (
                          <DropdownItem
                            key="delete"
                            color="danger"
                            startContent={<MoreVerticalIcon className="w-4 h-4" />}
                          >
                            删除用户
                          </DropdownItem>
                        ) : null}
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}

