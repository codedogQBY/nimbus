# Nimbus 多源聚合网盘 - UI/UX 设计规范

## 1. 设计理念

### 1.1 设计原则
- **简洁明了**: 界面清晰，减少认知负担
- **一致性**: 保持组件和交互的一致性，优先使用 HeroUI 组件系统
- **可访问性**: 支持无障碍访问，遵循 WCAG 2.1 标准
- **响应式**: 适配多种设备和屏幕尺寸
- **性能优先**: 优化加载速度和交互流畅度

### 1.2 组件库策略
- **HeroUI 优先**: 所有 UI 组件优先使用 HeroUI v2 组件库
- **定制化**: 基于 HeroUI 主题系统进行品牌定制
- **扩展性**: 在 HeroUI 基础上扩展专用组件
- **一致性**: 保持与 HeroUI 设计语言的一致性

### 1.3 用户体验目标
- 新用户 5 分钟内完成首次文件上传
- 文件操作路径不超过 3 次点击
- 关键功能支持键盘快捷键
- 错误状态提供清晰的解决方案

## 2. HeroUI 主题定制

### 2.1 主题配置
基于 HeroUI 的主题系统，定制 Nimbus 专属主题。采用温暖复古的配色方案，营造舒适的文件管理体验：

```typescript
// tailwind.config.js
import { heroui } from "@heroui/react";

export default {
  content: [
    // ... 其他路径
    "./node_modules/@heroui/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // 品牌色扩展
        'cream-green': {
          50: '#f4f8f4',
          100: '#e8f0e8',
          200: '#D4E2D4',  // 主色 - 奶油绿 (60%)
          300: '#c0d4c0',
          400: '#acc6ac',
          500: '#98b898',
          600: '#7a9e7a',
          700: '#5c7e5c',
          800: '#3e5e3e',
          900: '#203e20',
        },
        'khaki': {
          50: '#faf8f4',
          100: '#f5f1e9',
          200: '#E8E1D0',  // 辅助色 - 浅卡其 (30%)
          300: '#ddd2b7',
          400: '#d2c39e',
          500: '#c7b485',
          600: '#a3956c',
          700: '#7f7653',
          800: '#5b573a',
          900: '#373821',
        },
        'amber-brown': {
          50: '#fef7ed',
          100: '#fdefd5',
          200: '#f9daa6',
          300: '#f5c276',
          400: '#eda147',
          500: '#B5651D',  // 点缀色 - 琥珀棕 (10%)
          600: '#9a5418',
          700: '#7f4313',
          800: '#64320e',
          900: '#492109',
        },
        'dark-olive': {
          50: '#f4f5f0',
          100: '#e9ebe1',
          200: '#d3d7c3',
          300: '#bdc3a5',
          400: '#a7af87',
          500: '#919b69',
          600: '#7a8554',
          700: '#636f3f',
          800: '#556B2F',  // 文字/中性色 - 深橄榄绿
          900: '#3a4a1f',
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            // 主色调 - 奶油绿系列 (60% 使用率)
            primary: {
              50: '#f4f8f4',
              100: '#e8f0e8',
              200: '#D4E2D4',
              300: '#c0d4c0',
              400: '#acc6ac',
              500: '#98b898',
              600: '#7a9e7a',
              700: '#5c7e5c',
              800: '#3e5e3e',
              900: '#203e20',
              DEFAULT: "#D4E2D4",
              foreground: "#556B2F"  // 深橄榄绿作为前景色
            },
            // 辅助色 - 浅卡其 (30% 使用率)
            secondary: {
              50: '#faf8f4',
              100: '#f5f1e9',
              200: '#E8E1D0',
              300: '#ddd2b7',
              400: '#d2c39e',
              500: '#c7b485',
              600: '#a3956c',
              700: '#7f7653',
              800: '#5b573a',
              900: '#373821',
              DEFAULT: "#E8E1D0",
              foreground: "#556B2F"
            },
            // 点缀色 - 琥珀棕 (10% 使用率：按钮、链接)
            accent: {
              50: '#fef7ed',
              100: '#fdefd5',
              200: '#f9daa6',
              300: '#f5c276',
              400: '#eda147',
              500: '#B5651D',
              600: '#9a5418',
              700: '#7f4313',
              800: '#64320e',
              900: '#492109',
              DEFAULT: "#B5651D",
              foreground: "#ffffff"
            },
            // 功能性颜色（保持标准）
            success: {
              DEFAULT: "#10b981",
              foreground: "#ffffff"
            },
            warning: {
              DEFAULT: "#f59e0b",
              foreground: "#ffffff"
            },
            danger: {
              DEFAULT: "#ef4444",
              foreground: "#ffffff"
            },
            // 背景和前景
            background: "#fefdfb", // 温暖的白色背景
            foreground: "#556B2F", // 深橄榄绿作为默认文字颜色
            content1: "#ffffff",
            content2: "#E8E1D0",
            content3: "#D4E2D4",
            content4: "#c7b485",
            // 分隔线和边框
            divider: "rgba(85, 107, 47, 0.12)", // 半透明深橄榄绿
            // 自定义语义色
            storage: {
              active: "#10b981",
              inactive: "#7f7653",
              error: "#ef4444",
              warning: "#f59e0b"
            }
          },
          layout: {
            fontSize: {
              tiny: "0.75rem",
              small: "0.875rem",
              medium: "1rem",
              large: "1.125rem",
            },
            lineHeight: {
              tiny: "1rem",
              small: "1.25rem",
              medium: "1.5rem",
              large: "1.75rem",
            },
            radius: {
              small: "6px",
              medium: "8px",
              large: "12px",
            },
            borderWidth: {
              small: "1px",
              medium: "1.5px",
              large: "2px",
            },
          },
        },
        dark: {
          colors: {
            // 暗色模式：深色背景配合温暖色调
            primary: {
              50: "#203e20",
              100: "#3e5e3e",
              200: "#5c7e5c",
              300: "#7a9e7a",
              400: "#98b898",
              500: "#acc6ac",
              600: "#c0d4c0",
              700: "#D4E2D4",
              800: "#e8f0e8",
              900: "#f4f8f4",
              DEFAULT: "#98b898",
              foreground: "#f4f8f4"
            },
            secondary: {
              DEFAULT: "#5b573a",
              foreground: "#faf8f4"
            },
            accent: {
              DEFAULT: "#eda147",
              foreground: "#ffffff"
            },
            background: "#1a1a18", // 深棕黑色背景
            foreground: "#e8f0e8", // 浅奶油绿文字
            content1: "#252522",
            content2: "#2f2f2a",
            content3: "#3a3a32",
            content4: "#44443a",
            divider: "rgba(232, 240, 232, 0.12)",
          }
        }
      }
    })
  ]
}
```

### 2.2 配色使用指南

#### 主色 (60%) - 奶油绿 `#D4E2D4`
- **使用场景**: 
  - 页面主要背景区域
  - 卡片背景
  - 侧边栏背景
  - 大面积的UI元素
- **示例**:
```tsx
<Card className="bg-primary-200">
  <CardBody>主要内容区域</CardBody>
</Card>
```

#### 辅助色 (30%) - 浅卡其 `#E8E1D0`
- **使用场景**:
  - 次要内容区块背景
  - 文件列表交替背景
  - 悬停状态背景
  - 提供纸张质感的区域
- **示例**:
```tsx
<div className="bg-secondary-200 p-4 rounded-lg">
  内容区块
</div>
```

#### 点缀色 (10%) - 琥珀棕 `#B5651D`
- **使用场景**:
  - 主要按钮（上传、确认等）
  - 重要链接
  - 选中状态
  - 需要引起注意的元素
- **示例**:
```tsx
<Button className="bg-accent hover:bg-accent-600">
  上传文件
</Button>
```

#### 文字/中性色 - 深橄榄绿 `#556B2F`
- **使用场景**:
  - 主要文字内容
  - 图标颜色
  - 边框颜色（浅色版本）
  - 与奶油绿形成优雅对比
- **示例**:
```tsx
<p className="text-foreground">
  这是主要文字内容
</p>
```

### 2.3 配色原则

1. **60-30-10 法则**
   - 60% 奶油绿：大面积背景
   - 30% 浅卡其：内容区块
   - 10% 琥珀棕：按钮和强调元素

2. **对比度要求**
   - 文字与背景对比度 ≥ 4.5:1（WCAG AA 标准）
   - 深橄榄绿 (#556B2F) 在浅色背景上有良好的可读性

3. **一致性**
   - 同类功能使用相同的配色
   - 状态变化通过色调深浅表示
   - 保持品牌色调的统一性

4. **情绪传达**
   - 温暖、自然、可靠
   - 复古而不失现代感
   - 舒适的文件管理体验

### 2.2 HeroUI 组件使用规范

#### 导航组件
使用 HeroUI 的 Navbar 系列组件：

```jsx
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@heroui/react";

<Navbar isBordered maxWidth="full">
  <NavbarContent>
    <NavbarMenuToggle className="sm:hidden" />
    <NavbarBrand>
      <Logo />
      <p className="font-bold text-inherit">Nimbus</p>
    </NavbarBrand>
  </NavbarContent>

  <NavbarContent className="hidden sm:flex gap-4" justify="center">
    <NavbarItem>
      <Link href="/files">文件</Link>
    </NavbarItem>
    <NavbarItem>
      <Link href="/shares">分享</Link>
    </NavbarItem>
  </NavbarContent>

  <NavbarContent justify="end">
    <StorageIndicator />
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Avatar
          isBordered
          as="button"
          className="transition-transform"
          src={user.avatar}
        />
      </DropdownTrigger>
      <DropdownMenu>
        <DropdownItem key="profile">个人资料</DropdownItem>
        <DropdownItem key="settings">设置</DropdownItem>
        <DropdownItem key="logout" color="danger">退出登录</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  </NavbarContent>
</Navbar>
```

#### 文件列表组件
使用 HeroUI 的 Table 和 Card 组件：

```jsx
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardBody,
  Chip,
  Button,
  ButtonGroup,
  Checkbox,
  Progress
} from "@heroui/react";

// 列表视图
<Table
  aria-label="文件列表"
  selectionMode="multiple"
  onSelectionChange={setSelectedKeys}
>
  <TableHeader>
    <TableColumn>名称</TableColumn>
    <TableColumn>大小</TableColumn>
    <TableColumn>修改时间</TableColumn>
    <TableColumn>存储源</TableColumn>
    <TableColumn>操作</TableColumn>
  </TableHeader>
  <TableBody>
    {files.map((file) => (
      <TableRow key={file.id}>
        <TableCell>
          <div className="flex items-center gap-2">
            <FileIcon type={file.type} />
            <span>{file.name}</span>
          </div>
        </TableCell>
        <TableCell>{formatFileSize(file.size)}</TableCell>
        <TableCell>{formatDate(file.updatedAt)}</TableCell>
        <TableCell>
          <Chip
            size="sm"
            color={getStorageColor(file.storageSource)}
            variant="flat"
          >
            {file.storageSource.name}
          </Chip>
        </TableCell>
        <TableCell>
          <ButtonGroup size="sm" variant="light">
            <Button startContent={<DownloadIcon />}>下载</Button>
            <Button startContent={<ShareIcon />}>分享</Button>
            <Button startContent={<MoreIcon />}>更多</Button>
          </ButtonGroup>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// 网格视图
<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
  {files.map((file) => (
    <Card key={file.id} isPressable onPress={() => handleFileClick(file)}>
      <CardBody className="flex flex-col items-center p-4">
        <FileIcon type={file.type} size="large" />
        <span className="text-sm text-center mt-2 truncate w-full">
          {file.name}
        </span>
        <span className="text-xs text-default-500">
          {formatFileSize(file.size)}
        </span>
      </CardBody>
    </Card>
  ))}
</div>
```

#### 文件上传组件
使用 HeroUI 的 Card 和 Progress 组件：

```jsx
import {
  Card,
  CardBody,
  Progress,
  Button,
  Divider
} from "@heroui/react";

<Card className="w-full">
  <CardBody>
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragOver ? "border-primary bg-primary/5" : "border-default-300"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <UploadIcon className="mx-auto mb-4 text-4xl text-default-400" />
      <p className="text-lg font-medium mb-2">
        拖拽文件到这里，或
        <Button
          color="primary"
          variant="light"
          onPress={triggerFileSelect}
        >
          选择文件
        </Button>
      </p>
      <p className="text-sm text-default-500">
        支持文件大小: 最大 5GB
      </p>
    </div>

    {uploads.length > 0 && (
      <>
        <Divider className="my-4" />
        <div className="space-y-3">
          {uploads.map((upload) => (
            <div key={upload.id} className="flex items-center gap-3">
              <FileIcon type={upload.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {upload.name}
                </p>
                <Progress
                  value={upload.progress}
                  color={upload.status === 'error' ? 'danger' : 'primary'}
                  className="mt-1"
                />
              </div>
              <Button
                size="sm"
                color="danger"
                variant="light"
                onPress={() => cancelUpload(upload.id)}
              >
                取消
              </Button>
            </div>
          ))}
        </div>
      </>
    )}
  </CardBody>
</Card>
```

#### 存储源管理组件
```jsx
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Progress,
  Button,
  Chip,
  Divider
} from "@heroui/react";

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {storageSources.map((source) => (
    <Card key={source.id}>
      <CardHeader className="flex gap-3">
        <StorageIcon provider={source.type} />
        <div className="flex flex-col">
          <p className="text-md font-semibold">{source.name}</p>
          <p className="text-small text-default-500">{source.type}</p>
        </div>
        <Chip
          color={source.isActive ? 'success' : 'default'}
          size="sm"
          variant="flat"
        >
          {source.isActive ? '在线' : '离线'}
        </Chip>
      </CardHeader>

      <CardBody>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>已使用</span>
            <span>{formatFileSize(source.used)} / {formatFileSize(source.total)}</span>
          </div>
          <Progress
            value={(source.used / source.total) * 100}
            color={source.used / source.total > 0.8 ? 'warning' : 'primary'}
          />
        </div>
      </CardBody>

      <CardFooter>
        <ButtonGroup className="w-full">
          <Button size="sm" variant="light">设置</Button>
          <Button size="sm" variant="light">测试</Button>
          <Button size="sm" color="danger" variant="light">删除</Button>
        </ButtonGroup>
      </CardFooter>
    </Card>
  ))}
</div>
```

## 3. 组件设计规范

### 3.1 导航组件

#### 顶部导航栏
- **高度**: 64px
- **背景**: 白色半透明，毛玻璃效果
- **内容**: Logo + 导航菜单 + 用户头像
- **响应式**: 移动端收起为汉堡菜单

#### 侧边栏
- **宽度**: 280px (展开) / 64px (收起)
- **内容**: 文件夹树形结构 + 存储源状态
- **特性**: 支持拖拽调整宽度

```jsx
// 导航栏组件示例
<Navbar>
  <NavbarBrand>
    <Logo /> Nimbus
  </NavbarBrand>
  <NavbarContent>
    <NavbarItem>文件</NavbarItem>
    <NavbarItem>分享</NavbarItem>
    <NavbarItem>设置</NavbarItem>
  </NavbarContent>
  <NavbarContent justify="end">
    <StorageStatus />
    <UserAvatar />
  </NavbarContent>
</Navbar>
```

### 3.2 文件列表组件

#### 视图模式
- **列表视图**: 类似 macOS Finder，显示详细信息
- **网格视图**: 大图标展示，适合图片文件
- **紧凑视图**: 密集显示，适合大量文件

#### 文件项设计
```jsx
<FileItem>
  <FileIcon type={fileType} />
  <FileInfo>
    <FileName>{name}</FileName>
    <FileDetails>
      <FileSize>{size}</FileSize>
      <FileDate>{date}</FileDate>
      <StorageSourceIndicator sources={sources} />
    </FileDetails>
  </FileInfo>
  <FileActions>
    <ActionButton icon="download" />
    <ActionButton icon="share" />
    <ActionButton icon="more" />
  </FileActions>
</FileItem>
```

### 3.3 上传组件

#### 拖拽上传区域
- **状态**: 默认 / 拖拽悬停 / 上传中 / 完成 / 错误
- **视觉反馈**: 边框颜色变化 + 图标动画
- **进度显示**: 环形进度条 + 百分比文字

```jsx
<UploadDropzone>
  <UploadIcon />
  <UploadText>
    拖拽文件到这里，或 <UploadButton>选择文件</UploadButton>
  </UploadText>
  <UploadHint>
    支持文件大小: 最大 5GB
  </UploadHint>
</UploadDropzone>
```

### 3.4 存储源管理

#### 存储源卡片
```jsx
<StorageSourceCard>
  <StorageIcon provider={provider} />
  <StorageInfo>
    <StorageName>{name}</StorageName>
    <StorageUsage>
      <ProgressBar value={used} max={total} />
      <UsageText>{used} / {total}</UsageText>
    </StorageUsage>
  </StorageInfo>
  <StorageStatus status={status} />
  <StorageActions>
    <ActionButton icon="settings" />
    <ActionButton icon="test" />
  </StorageActions>
</StorageSourceCard>
```

## 4. 交互设计规范

### 4.1 微交互设计

#### 按钮状态
- **默认**: 正常显示
- **悬停**: 背景色加深 10%，添加阴影
- **按下**: 背景色加深 20%，缩放 98%
- **禁用**: 透明度 50%，不可点击

#### 加载状态
- **骨架屏**: 用于列表加载
- **转圈动画**: 用于按钮加载
- **进度条**: 用于文件上传/下载

### 4.2 动画规范

#### 时间曲线
```css
/* 标准动画 */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* 时长 */
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
```

#### 页面转场
- **淡入淡出**: 页面切换
- **滑动**: 抽屉展开/收起
- **缩放**: 模态框打开/关闭

### 4.3 手势交互

#### 文件操作手势
- **长按**: 进入选择模式
- **双击**: 打开文件/文件夹
- **右键**: 显示上下文菜单
- **拖拽**: 移动文件

## 5. 页面布局设计

### 5.1 主界面布局

```
┌─────────────── Header (64px) ──────────────┐
│  Logo    Navigation    User    Storage     │
├────────┬──────────────────────────────────┤
│        │                                  │
│ Sidebar│         Main Content            │
│ (280px)│                                  │
│        │  ┌─────────────────────────────┐ │
│        │  │     File Operations     │ │
│        │  ├─────────────────────────────┤ │
│        │  │                             │ │
│        │  │      File List Grid         │ │
│        │  │                             │ │
│        │  └─────────────────────────────┘ │
│        │                                  │
└────────┴──────────────────────────────────┘
```

### 5.2 响应式断点

```css
/* 断点定义 */
--screen-sm: 640px;   /* 平板竖屏 */
--screen-md: 768px;   /* 平板横屏 */
--screen-lg: 1024px;  /* 桌面 */
--screen-xl: 1280px;  /* 大屏 */
```

#### 移动端适配
- **< 768px**: 隐藏侧边栏，使用底部导航
- **768px - 1024px**: 可收起侧边栏
- **> 1024px**: 完整桌面体验

## 6. 状态设计

### 6.1 空状态设计

#### 空文件夹
```jsx
<EmptyState>
  <EmptyIcon name="folder" />
  <EmptyTitle>文件夹为空</EmptyTitle>
  <EmptyDescription>
    拖拽文件到这里开始上传
  </EmptyDescription>
  <EmptyActions>
    <Button>上传文件</Button>
    <Button variant="outline">创建文件夹</Button>
  </EmptyActions>
</EmptyState>
```

### 6.2 错误状态设计

#### 网络错误
```jsx
<ErrorState>
  <ErrorIcon name="wifi-off" />
  <ErrorTitle>网络连接失败</ErrorTitle>
  <ErrorDescription>
    请检查网络连接后重试
  </ErrorDescription>
  <ErrorActions>
    <Button onClick={retry}>重试</Button>
  </ErrorActions>
</ErrorState>
```

## 7. 可访问性设计

### 7.1 键盘导航
- **Tab**: 在可聚焦元素间导航
- **Enter/Space**: 激活按钮或链接
- **Arrow Keys**: 在列表中导航
- **Escape**: 关闭模态框或菜单

### 7.2 屏幕阅读器支持
- 所有图像提供 alt 文本
- 表单控件提供 label
- 使用语义化 HTML 标签
- 提供 ARIA 标签

### 7.3 颜色对比度
- 所有文字与背景对比度 ≥ 4.5:1
- 大文字对比度 ≥ 3:1
- 不仅依赖颜色传达信息

## 8. 设计交付物

### 8.1 设计文件结构
```
design/
├── tokens/          # 设计 tokens
├── components/      # 组件设计
├── pages/          # 页面设计
├── icons/          # 图标库
├── illustrations/  # 插画素材
└── prototypes/     # 交互原型
```

### 8.2 开发协作
- 使用 Figma 进行设计协作
- 导出 Design Tokens 为 CSS 变量
- 提供组件使用文档
- 定期设计评审和反馈

## 9. 性能优化

### 9.1 图像优化
- 使用 WebP 格式
- 实现懒加载
- 提供多尺寸适配
- 压缩图像大小

### 9.2 动画优化
- 优先使用 CSS 动画
- 避免重排重绘
- 使用 transform 和 opacity
- 减少动画复杂度

## 10. 品牌识别

### 10.1 Logo 设计
- 简洁的云朵图标
- 可在各种背景下使用
- 提供多种尺寸版本
- 保持品牌一致性

### 10.2 视觉风格
- 现代简约风格
- 重视功能性
- 适度使用阴影和渐变
- 保持专业感