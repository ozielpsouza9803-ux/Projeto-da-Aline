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
  stockQuantity?: number;
  stockStatus?: 'available' | 'low' | 'out_of_stock';
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
  primaryButtonColor?: string;
  showcasePosition?: 'above_banner' | 'below_banner';
}

// ==========================================
// Assistente de Gerência com IA - Tipagens (Etapa 1)
// ==========================================

export type AdminActionType =
  | 'update_price'
  | 'set_promotion'
  | 'update_photos'
  | 'create_banner'
  | 'update_banner'
  | 'update_carousel'
  | 'create_product';

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export interface PriceProposalData {
  price: number;
  promotionalPrice?: number;
}

export interface PromotionProposalData {
  price: number;
  promotionalPrice?: number;
  discountPercentage?: number;
  savingsAmount?: number;
}

export interface PhotosProposalData {
  photos: string[];
}

export interface BannerProposalData {
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
  order: number;
  isActive: boolean;
  showcaseId: string;
}

export interface CarouselProposalData {
  showcaseId?: string;
  bannerOrder?: { bannerId: string; order: number }[];
  showcasePosition?: 'above_banner' | 'below_banner';
  featuredShowcaseIds?: string[];
}

export interface AdminActionProposal<TBefore = any, TAfter = any> {
  id: string;
  type: AdminActionType;
  title: string;
  entityType: 'product' | 'banner' | 'showcase';
  entityId: string;
  entityName: string;
  justification: string;
  previousData: TBefore;
  proposedData: TAfter;
  status: ProposalStatus;
  createdAt: string;
  reviewedAt?: string;
  feedback?: string;
}

export interface ReplenishmentItem {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  showcaseId: string;
  showcaseName?: string;
  currentStock: number;
  stockStatus: 'available' | 'low' | 'out_of_stock';
  reorderThreshold: number;
  suggestedQuantity: number;
  unitPrice: number;
  estimatedCost: number;
  alertReason: string;
  priority: 'baixa' | 'media' | 'alta' | 'critica';
}

export interface ReplenishmentReport {
  id: string;
  generatedAt: string;
  totalAlerts: number;
  outOfStockCount: number;
  lowStockCount: number;
  totalEstimatedInvestment: number;
  items: ReplenishmentItem[];
  summaryNote: string;
}

// ==========================================
// Perfis Visuais dos Chatbots
// ==========================================

export interface ChatbotProfile {
  id: string; // 'public-support' | 'admin-assistant'
  name: string;
  role: string;
  description: string;
  avatarUrl: string;
  defaultAvatarUrl: string;
  updatedAt?: string;
}

export interface CustomerAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
}

export interface CustomerProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  whatsapp: string;
  address: CustomerAddress;
  avatarUrl?: string;
  isVip?: boolean;
  createdAt: string;
  updatedAt: string;
}


