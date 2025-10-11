# 🎨 Nimbus 配色测试指南

## 已修复的问题

1. ✅ 删除了 `tailwind.config.ts`（重复配置）
2. ✅ 更新了 `tailwind.config.js` 使用完整的配色方案
3. ✅ 更新了 `globals.css` 添加了 CSS 变量

## 🔄 重启开发服务器

```bash
# 如果开发服务器正在运行，先停止（Ctrl+C）
# 然后重新启动：
pnpm dev
```

## ✅ 验证配色

访问 http://localhost:3000 后，你应该看到：

### 认证页面（/login, /register）
- ✅ **背景**: 奶油绿渐变 (cream-green)
- ✅ **卡片**: 白色/浅卡其背景
- ✅ **按钮**: 琥珀棕色 (#B5651D)
- ✅ **文字**: 深橄榄绿 (#556B2F)

### Dashboard页面（/files, /storage, /users）
- ✅ **页面背景**: 奶油绿-50 (#f4f8f4)
- ✅ **导航栏**: 白色半透明，毛玻璃效果
- ✅ **卡片**: 白色/60% 透明度
- ✅ **标题**: 深橄榄绿-800
- ✅ **按钮**: 琥珀棕色

## 🎨 配色使用示例

### 在组件中使用配色

```tsx
// 1. 使用主色（奶油绿）
<div className="bg-primary-200 text-primary-foreground">
  主要内容
</div>

// 2. 使用辅助色（浅卡其）
<div className="bg-secondary-200 text-secondary-foreground">
  辅助内容
</div>

// 3. 使用点缀色（琥珀棕）
<Button className="bg-amber-brown-500 hover:bg-amber-brown-600 text-white">
  重要按钮
</Button>

// 4. 使用文字色（深橄榄绿）
<p className="text-dark-olive-800">
  主要文字内容
</p>

// 5. 使用自定义品牌色
<div className="bg-cream-green-100">奶油绿背景</div>
<div className="bg-khaki-200">浅卡其背景</div>
<div className="text-amber-brown-500">琥珀棕文字</div>
```

## 🐛 如果配色仍未生效

### 1. 清除缓存
```bash
# 删除 .next 目录
rm -rf .next

# 重新启动
pnpm dev
```

### 2. 检查浏览器
- 强制刷新：Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)
- 清除浏览器缓存
- 打开开发者工具查看 CSS 是否正确加载

### 3. 检查 Tailwind 配置
```bash
# 验证 tailwind.config.js 内容
cat tailwind.config.js | grep -A 5 "cream-green"

# 应该看到完整的颜色定义
```

### 4. 检查 HeroUI 版本
```bash
pnpm list @heroui/react

# 应该显示 v2.8.5 或更高版本
```

## 🎯 预期效果

正确配置后，你应该看到：

1. **登录页面**：
   - 背景：温暖的奶油绿渐变
   - 卡片：白色，圆角阴影
   - 登录按钮：琥珀棕色
   - 文字：深橄榄绿

2. **Dashboard**：
   - 导航栏：白色半透明
   - 页面背景：浅奶油绿
   - 卡片：白色/80%透明度
   - 所有按钮：琥珀棕色点缀

3. **整体感觉**：
   - 温暖、自然、舒适
   - 复古而不失现代感
   - 高对比度，可读性好

如果看到以上效果，说明配色已经成功应用！ 🎉
