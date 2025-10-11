import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库种子...');

  // 1. 创建预设角色
  console.log('📝 创建预设角色...');
  
  const ownerRole = await prisma.role.upsert({
    where: { name: 'owner' },
    update: {},
    create: {
      name: 'owner',
      displayName: '所有者',
      description: '系统所有者，拥有所有权限',
      isSystem: true,
      priority: 100,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      displayName: '管理员',
      description: '管理文件和用户，配置存储源',
      isSystem: true,
      priority: 80,
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: 'editor' },
    update: {},
    create: {
      name: 'editor',
      displayName: '编辑者',
      description: '上传、编辑、删除文件',
      isSystem: true,
      priority: 60,
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: 'viewer' },
    update: {},
    create: {
      name: 'viewer',
      displayName: '查看者',
      description: '只读访问，可下载文件',
      isSystem: true,
      priority: 40,
    },
  });

  const guestRole = await prisma.role.upsert({
    where: { name: 'guest' },
    update: {},
    create: {
      name: 'guest',
      displayName: '访客',
      description: '临时访问指定内容',
      isSystem: true,
      priority: 20,
    },
  });

  console.log('✅ 角色创建完成');

  // 2. 创建权限
  console.log('📝 创建权限...');

  const permissions = [
    // 文件权限
    { name: 'files.upload', resource: 'files', action: 'upload', displayName: '上传文件', description: '允许上传新文件' },
    { name: 'files.download', resource: 'files', action: 'download', displayName: '下载文件', description: '允许下载文件' },
    { name: 'files.delete', resource: 'files', action: 'delete', displayName: '删除文件', description: '允许删除文件' },
    { name: 'files.rename', resource: 'files', action: 'rename', displayName: '重命名文件', description: '允许重命名文件' },
    { name: 'files.move', resource: 'files', action: 'move', displayName: '移动文件', description: '允许移动文件到其他文件夹' },
    { name: 'files.share', resource: 'files', action: 'share', displayName: '分享文件', description: '允许创建文件分享链接' },
    { name: 'files.view', resource: 'files', action: 'view', displayName: '查看文件', description: '允许查看文件列表和详情' },
    
    // 文件夹权限
    { name: 'folders.create', resource: 'folders', action: 'create', displayName: '创建文件夹', description: '允许创建新文件夹' },
    { name: 'folders.delete', resource: 'folders', action: 'delete', displayName: '删除文件夹', description: '允许删除文件夹' },
    { name: 'folders.rename', resource: 'folders', action: 'rename', displayName: '重命名文件夹', description: '允许重命名文件夹' },
    { name: 'folders.move', resource: 'folders', action: 'move', displayName: '移动文件夹', description: '允许移动文件夹' },
    
    // 存储源权限
    { name: 'storage.view', resource: 'storage', action: 'view', displayName: '查看存储源', description: '允许查看存储源信息' },
    { name: 'storage.manage', resource: 'storage', action: 'manage', displayName: '管理存储源', description: '允许添加、编辑、删除存储源' },
    { name: 'storage.test', resource: 'storage', action: 'test', displayName: '测试存储源', description: '允许测试存储源连接' },
    
    // 用户权限
    { name: 'users.view', resource: 'users', action: 'view', displayName: '查看用户', description: '允许查看用户列表' },
    { name: 'users.manage', resource: 'users', action: 'manage', displayName: '管理用户', description: '允许添加、编辑、删除用户' },
    { name: 'users.assign_roles', resource: 'users', action: 'assign_roles', displayName: '分配角色', description: '允许为用户分配角色' },
    
    // 系统设置权限
    { name: 'settings.view', resource: 'settings', action: 'view', displayName: '查看设置', description: '允许查看系统设置' },
    { name: 'settings.manage', resource: 'settings', action: 'manage', displayName: '管理设置', description: '允许修改系统设置' },
    
    // 分享权限
    { name: 'shares.view', resource: 'shares', action: 'view', displayName: '查看分享', description: '允许查看分享列表' },
    { name: 'shares.manage', resource: 'shares', action: 'manage', displayName: '管理分享', description: '允许管理所有分享链接' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  console.log('✅ 权限创建完成');

  // 3. 为角色分配权限
  console.log('📝 分配角色权限...');

  // Owner: 所有权限
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: ownerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: ownerRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Admin: 除系统设置管理外的所有权限
  const adminPermissions = await prisma.permission.findMany({
    where: {
      name: {
        not: 'settings.manage',
      },
    },
  });
  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Editor: 文件和文件夹的基本操作权限
  const editorPermissionNames = [
    'files.upload', 'files.download', 'files.delete', 'files.rename', 'files.move', 'files.view',
    'folders.create', 'folders.delete', 'folders.rename', 'folders.move',
    'storage.view', 'shares.view'
  ];
  const editorPermissions = await prisma.permission.findMany({
    where: {
      name: {
        in: editorPermissionNames,
      },
    },
  });
  for (const permission of editorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: editorRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: editorRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Viewer: 只读权限
  const viewerPermissionNames = ['files.view', 'files.download', 'storage.view'];
  const viewerPermissions = await prisma.permission.findMany({
    where: {
      name: {
        in: viewerPermissionNames,
      },
    },
  });
  for (const permission of viewerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: viewerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: viewerRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Guest: 最小权限
  const guestPermissionNames = ['files.view', 'files.download'];
  const guestPermissions = await prisma.permission.findMany({
    where: {
      name: {
        in: guestPermissionNames,
      },
    },
  });
  for (const permission of guestPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: guestRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: guestRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ 角色权限分配完成');
  console.log('🎉 数据库种子完成！');
}

main()
  .catch((e) => {
    console.error('❌ 种子失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

