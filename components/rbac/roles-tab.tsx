"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
} from "@heroui/react";
import {
  PlusIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  ShieldIcon,
  UsersIcon,
  KeyIcon,
  CrownIcon,
} from "lucide-react";
import ky from "ky";

interface Role {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  _count: {
    userRoles: number;
    rolePermissions: number;
  };
}

const ROLE_ICONS: Record<string, any> = {
  owner: CrownIcon,
  admin: ShieldIcon,
  editor: EditIcon,
  viewer: UsersIcon,
  guest: UsersIcon,
};

const ROLE_COLORS: Record<string, any> = {
  owner: "danger",
  admin: "primary",
  editor: "secondary",
  viewer: "success",
  guest: "default",
};

export function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    systemRoles: 0,
    customRoles: 0,
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const data = await ky
        .get("/api/rbac/roles", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .json<{ roles: Role[]; stats: any }>();

      setRoles(data.roles);
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to load roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleName: string) => {
    const IconComponent = ROLE_ICONS[roleName.toLowerCase()] || ShieldIcon;

    return <IconComponent className="w-5 h-5" />;
  };

  const getRoleColor = (roleName: string): any => {
    return ROLE_COLORS[roleName.toLowerCase()] || "default";
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg lg:text-xl font-semibold text-dark-olive-800">
            角色列表
          </h3>
          <p className="text-sm text-default-500 mt-1">
            共 {stats.total} 个角色，{stats.systemRoles} 个系统角色，
            {stats.customRoles} 个自定义角色
          </p>
        </div>
        <Button
          className="hidden lg:flex"
          color="primary"
          startContent={<PlusIcon className="w-4 h-4" />}
        >
          创建角色
        </Button>
        <Button isIconOnly className="lg:hidden" color="primary">
          <PlusIcon className="w-5 h-5" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner color="primary" size="lg" />
        </div>
      ) : (
        <>
          {/* 桌面端表格 */}
          <div className="hidden lg:block">
            <Table aria-label="角色列表">
              <TableHeader>
                <TableColumn>角色</TableColumn>
                <TableColumn>描述</TableColumn>
                <TableColumn>类型</TableColumn>
                <TableColumn>用户数</TableColumn>
                <TableColumn>权限数</TableColumn>
                <TableColumn>创建时间</TableColumn>
                <TableColumn width={80}>操作</TableColumn>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl bg-${getRoleColor(role.name)}-100 flex items-center justify-center`}
                        >
                          <div
                            className={`text-${getRoleColor(role.name)}-600`}
                          >
                            {getRoleIcon(role.name)}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-dark-olive-800">
                            {role.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-default-600 max-w-md truncate">
                        {role.description || "-"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={role.isSystem ? "primary" : "secondary"}
                        size="sm"
                        variant="flat"
                      >
                        {role.isSystem ? "系统角色" : "自定义角色"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-default-400" />
                        <span>{role._count.userRoles}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <KeyIcon className="w-4 h-4 text-default-400" />
                        <span>{role._count.rolePermissions}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-default-500">
                        {new Date(role.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreVerticalIcon className="w-4 h-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="角色操作">
                          <DropdownItem
                            key="edit"
                            startContent={<EditIcon className="w-4 h-4" />}
                          >
                            编辑角色
                          </DropdownItem>
                          <DropdownItem
                            key="permissions"
                            startContent={<KeyIcon className="w-4 h-4" />}
                          >
                            管理权限
                          </DropdownItem>
                          {!role.isSystem && (
                            <DropdownItem
                              key="delete"
                              color="danger"
                              startContent={<TrashIcon className="w-4 h-4" />}
                            >
                              删除角色
                            </DropdownItem>
                          )}
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 移动端卡片 */}
          <div className="lg:hidden space-y-3">
            {roles.map((role) => (
              <Card key={role.id} className="bg-white">
                <CardBody className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl bg-${getRoleColor(role.name)}-100 flex items-center justify-center`}
                      >
                        <div className={`text-${getRoleColor(role.name)}-600`}>
                          {getRoleIcon(role.name)}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-dark-olive-800">
                          {role.name}
                        </h4>
                        <Chip
                          className="mt-1"
                          color={role.isSystem ? "primary" : "secondary"}
                          size="sm"
                          variant="flat"
                        >
                          {role.isSystem ? "系统角色" : "自定义"}
                        </Chip>
                      </div>
                    </div>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <MoreVerticalIcon className="w-4 h-4" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="角色操作">
                        <DropdownItem
                          key="edit"
                          startContent={<EditIcon className="w-4 h-4" />}
                        >
                          编辑角色
                        </DropdownItem>
                        <DropdownItem
                          key="permissions"
                          startContent={<KeyIcon className="w-4 h-4" />}
                        >
                          管理权限
                        </DropdownItem>
                        {!role.isSystem && (
                          <DropdownItem
                            key="delete"
                            color="danger"
                            startContent={<TrashIcon className="w-4 h-4" />}
                          >
                            删除角色
                          </DropdownItem>
                        )}
                      </DropdownMenu>
                    </Dropdown>
                  </div>

                  {role.description && (
                    <p className="text-sm text-default-600 mb-3">
                      {role.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-default-500">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="w-4 h-4" />
                      <span>{role._count.userRoles} 用户</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <KeyIcon className="w-4 h-4" />
                      <span>{role._count.rolePermissions} 权限</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
