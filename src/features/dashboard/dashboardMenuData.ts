export const dropdownData = [
  {
    name: 'wares',
    label: 'Products',
    logos: [
      '/logos/products/product2.png',
      '/logos/products/product3.png',
      '/logos/products/product4.png',
      '/logos/products/product7.png',
    ],
    description: 'Add or view all products in your inventory.',
    links: [
      { to: '/add-ware', label: 'Create Product', roles: ['admin'] },
      { to: '/wares', label: 'View All Products', roles: ['admin','user'] },
    ],
  },
  {
    name: 'brands',
    label: 'Brands',
    logos: ['/logos/brands/brand1.png',
            '/logos/brands/brand2.png',
            '/logos/brands/brand3.png',
            '/logos/brands/brand5.png',
    ],
    description: 'Manage your product brands easily.',
    links: [
      { to: '/brands/add', label: 'Create Brand', roles: ['admin'] },
      { to: '/brands', label: 'View All Brands', roles: ['admin','user'] },
    ],
  },
  {
    name: 'categories',
    label: 'Categories',
    logos: ['/logos/categories/categories2.png',
            '/logos/categories/categories4.png',
            '/logos/categories/categories5.png'
    ],
    description: 'Find and organize products by categories.',
    links: [
      { to: '/categories/add', label: 'Create Category', roles: ['admin'] },
      { to: '/categories', label: 'View All Categories', roles: ['admin','user'] },
    ],
  },
  {
    name: 'sizes',
    label: 'Sizes',
    logos: [],
    description: 'Define sizes for your products.',
    links: [
      { to: '/sizes/add', label: 'Create Size', roles: ['admin'] },
      { to: '/sizes', label: 'View All Sizes', roles: ['admin','user'] },
    ],
  },
];
