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
      label: "Quản lý Brand",
      href:"/admin/product_management/brands",
      toot_tip:"Thương hiệu của sản phẩm, giúp người dùng nhận diện và tin tưởng sản phẩm."
    },
    {
      label: "Quản lý Category",
      href: "/admin/product_management/categories",
      toot_tip:"Các danh mục chứa sản phẩm nhằm phân loại chúng theo các đặc điểm chung."
    },
    {
      label: "Quản lý Attribute",
      href: "/admin/product_management/attributes",
      toot_tip:"Các đặc điểm hoặc tính chất của sản phẩm (ví dụ: màu sắc, kích thước)."
    }
  ],
  links: {
    github: "https://github.com/nongtiensonpro/Yellow_Cat_Web",
  },
};
