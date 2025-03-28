export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Next.js + HeroUI",
  description: "Make beautiful websites regardless of your design experience.",
  navItems: [
    {
      label: "Demo",
      href: "/about",
    }
  ],
  navMenuItems: [
    {
      label: "Thông tin cá nhân",
      href: "/user_info",
    }
  ],
  navMenuItemsAdmin:[
    {
      label: "Quản lý tài khoản",
      href: "/admin/account_management",
    },
    {
      label: "Quản lý sản phẩm",
      href: "/admin/product_management",
    }
  ],
  navMenuItemsProduct:[
    {
      label: "Thêm sản phẩm",
      href:"/admin/product_management/add_product",
    }
  ],
  links: {
    github: "https://github.com/nongtiensonpro/Yellow_Cat_Web",
  },
};
