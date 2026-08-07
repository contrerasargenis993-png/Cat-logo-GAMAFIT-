export interface Product {
  id: string;
  name: string;
  title?: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  badge?: string;
  available: boolean;
  stock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  whatsappPhone: string;
  currency: string;
  logo: string;
  publicCatalogUrl: string;
  adminPin?: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderCustomerInfo {
  name: string;
  notes: string;
}
