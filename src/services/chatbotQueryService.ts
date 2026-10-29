import { Product, Showcase } from '../types';
import { storageService } from './storage';
import { fetchProductsFromSupabase, fetchShowcasesFromSupabase } from './supabaseClient';

export interface PublicChatProduct {
  id: string;
  name: string;
  brandName: string;
  brandId: string;
  sku: string;
  description: string;
  price: number;
  promotionalPrice?: number;
  category: string;
  mainPhoto: string;
  photos: string[];
  affiliateUrl: string;
  stockQuantity: number;
  stockStatus: 'available' | 'low' | 'out_of_stock';
  isAvailable: boolean;
}

export interface ChatbotSearchParams {
  query?: string;
  brandId?: string;
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  inStockOnly?: boolean;
}

/**
 * Calculates standardized stock status based on stockQuantity
 */
export function calculateStockStatus(quantity: number = 0): 'available' | 'low' | 'out_of_stock' {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= 5) return 'low';
  return 'available';
}

/**
 * Normalizes a Product model into a safe, public-facing PublicChatProduct object.
 * Strictly excludes sensitive analytics (clicksCount, conversionsCount, admin credentials).
 */
export function normalizePublicChatProduct(product: Product, showcases: Showcase[]): PublicChatProduct {
  const brand = showcases.find(s => s.id === product.showcaseId);
  const brandName = brand ? brand.name : 'Marca Geral';
  const qty = product.stockQuantity ?? (product.isActive ? 10 : 0);
  const status = calculateStockStatus(qty);

  return {
    id: product.id,
    name: product.name,
    brandName,
    brandId: product.showcaseId,
    sku: product.sku || `SKU-${product.id.slice(0, 6)}`,
    description: product.description,
    price: product.price,
    promotionalPrice: product.promotionalPrice,
    category: product.category,
    mainPhoto: product.photos?.[0] || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80',
    photos: product.photos || [],
    affiliateUrl: product.affiliateUrl,
    stockQuantity: qty,
    stockStatus: status,
    isAvailable: qty > 0 && product.isActive
  };
}

/**
 * Public Data Layer for Chatbot: Searches real products in Supabase / Local Storage
 */
export const chatbotQueryService = {
  /**
   * Returns available active brands for chatbot context
   */
  async getAvailableBrands(): Promise<Array<{ id: string; name: string; category: string }>> {
    let showcases = await fetchShowcasesFromSupabase();
    if (!showcases || showcases.length === 0) {
      showcases = storageService.getShowcases();
    }
    return showcases
      .filter(s => s.isActive)
      .map(s => ({
        id: s.id,
        name: s.name,
        category: s.category
      }));
  },

  /**
   * Searches public products by keyword, brand, price range, and availability
   */
  async searchProducts(params: ChatbotSearchParams = {}): Promise<PublicChatProduct[]> {
    let products = await fetchProductsFromSupabase();
    if (!products || products.length === 0) {
      products = storageService.getProducts();
    }

    let showcases = await fetchShowcasesFromSupabase();
    if (!showcases || showcases.length === 0) {
      showcases = storageService.getShowcases();
    }

    // Filter active products first
    let publicProducts = products
      .filter(p => p.isActive)
      .map(p => normalizePublicChatProduct(p, showcases || []));

    // Filter by Brand ID
    if (params.brandId && params.brandId !== 'all') {
      publicProducts = publicProducts.filter(p => p.brandId === params.brandId);
    }

    // Filter by Keyword (Name, SKU, Description, Category)
    if (params.query && params.query.trim().length > 0) {
      const q = params.query.toLowerCase().trim();
      publicProducts = publicProducts.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // Filter by Category
    if (params.category && params.category !== 'all') {
      publicProducts = publicProducts.filter(p => 
        p.category.toLowerCase() === params.category?.toLowerCase()
      );
    }

    // Filter by Price Range
    if (params.maxPrice !== undefined) {
      publicProducts = publicProducts.filter(p => {
        const effectivePrice = p.promotionalPrice ?? p.price;
        return effectivePrice <= (params.maxPrice as number);
      });
    }

    if (params.minPrice !== undefined) {
      publicProducts = publicProducts.filter(p => {
        const effectivePrice = p.promotionalPrice ?? p.price;
        return effectivePrice >= (params.minPrice as number);
      });
    }

    // Filter by Stock Availability
    if (params.inStockOnly) {
      publicProducts = publicProducts.filter(p => p.isAvailable);
    }

    return publicProducts;
  },

  /**
   * Retrieves single product details by ID safely for public chat
   */
  async getProductById(productId: string): Promise<PublicChatProduct | null> {
    let products = await fetchProductsFromSupabase();
    if (!products || products.length === 0) {
      products = storageService.getProducts();
    }

    let showcases = await fetchShowcasesFromSupabase();
    if (!showcases || showcases.length === 0) {
      showcases = storageService.getShowcases();
    }

    const prod = products.find(p => p.id === productId);
    if (!prod || !prod.isActive) return null;

    return normalizePublicChatProduct(prod, showcases || []);
  }
};
