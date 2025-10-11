export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Nimbus",
  description: "个人多源聚合网盘 - 开源、安全、高效的云存储解决方案",
  navItems: [
    {
      label: "文件",
      href: "/files",
    },
    {
      label: "分享",
      href: "/shares",
    },
    {
      label: "存储源",
      href: "/storage",
    },
    {
      label: "用户",
      href: "/users",
    },
  ],
  navMenuItems: [
    {
      label: "文件管理",
      href: "/files",
    },
    {
      label: "我的分享",
      href: "/shares",
    },
    {
      label: "存储源",
      href: "/storage",
    },
    {
      label: "用户管理",
      href: "/users",
    },
    {
      label: "系统设置",
      href: "/settings",
    },
  ],
  links: {
    github: "https://github.com/yourusername/nimbus",
    docs: "/docs",
  },
};
