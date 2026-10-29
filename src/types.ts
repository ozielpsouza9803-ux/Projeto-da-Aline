export interface Showcase {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  category: string;
  affiliateBaseUrl: string;
  commissionRate: number; // e.g. 8.5%
  isActive: boolean;
  themeColor: string; // hex or tailwind class
  createdAt: string;
}

export interface Product {
  id: string;
  showcaseId: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  promotionalPrice?: number;
  category: string;
  photos: string[]; // multiple photos
  affiliateUrl: string;
  isActive: boolean;
  clicksCount: number;
  conversionsCount: number;
  createdAt: string;
}

export interface Banner {
  id: string;
  showcaseId: string; // 'all' or specific showcase ID
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
  order: number;
  isActive: boolean;
}

export interface ClickRecord {
  id: string;
  timestamp: string;
  showcaseId: string;
  productId?: string;
  productName?: string;
  device: 'Mobile' | 'Desktop' | 'Tablet';
  source: string;
  converted: boolean;
  commissionEarned?: number;
}

export interface CommissionRecord {
  id: string;
  date: string;
  showcaseId: string;
  orderId: string;
  productName: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'Pendente' | 'Aprovado' | 'Pago';
}

export interface AdminSettings {
  siteName: string;
  adminEmail: string;
  currency: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  storageProvider: 'local' | 'supabase';
  autoApproveCommissions: boolean;
}
