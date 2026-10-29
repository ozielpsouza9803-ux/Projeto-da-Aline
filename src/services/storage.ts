import { Showcase, Product, Banner, ClickRecord, CommissionRecord, AdminSettings } from '../types';
import { getSupabaseClient } from './supabaseClient';

const INITIAL_SHOWCASES: Showcase[] = [
  {
    id: 'natura-1',
    name: 'Natura',
    slug: 'natura',
    description: 'Consultoria oficial Natura. Perfumaria exclusiva, Chronos, Ekos e cuidados diários.',
    logoUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=1200&auto=format&fit=crop&q=80',
    category: 'Perfumaria & Cosméticos',
    affiliateBaseUrl: 'https://www.natura.com.br/consultoria/omnibrand',
    commissionRate: 9.5,
    isActive: true,
    themeColor: 'from-orange-500 to-amber-600',
    createdAt: '2026-01-15'
  },
  {
    id: 'boticario-2',
    name: 'O Boticário',
    slug: 'boticario',
    description: 'Revenda autorizada O Boticário. Malbec, Lily, Cuide-se Bem e make B.',
    logoUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1200&auto=format&fit=crop&q=80',
    category: 'Beleza & Cuidados Pessoais',
    affiliateBaseUrl: 'https://www.boticario.com.br/vitrine/omnibrand',
    commissionRate: 8.0,
    isActive: true,
    themeColor: 'from-blue-600 to-indigo-700',
    createdAt: '2026-01-20'
  },
  {
    id: 'eudora-3',
    name: 'Eudora',
    slug: 'eudora',
    description: 'Eudora Chega Lá. Maquiagens de alta performance, Deo Colônias e sofisticação.',
    logoUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=1200&auto=format&fit=crop&q=80',
    category: 'Maquiagem & Perfumaria',
    affiliateBaseUrl: 'https://www.eudora.com.br/omnibrand',
    commissionRate: 10.0,
    isActive: true,
    themeColor: 'from-purple-600 to-pink-600',
    createdAt: '2026-02-01'
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    showcaseId: 'natura-1',
    name: 'Ekos Castanha Polpa Hidratante Corporal 400ml',
    sku: 'NAT-EKOS-01',
    description: 'Hidratação nutritiva para o corpo com óleo de castanha. Restaura a barreira da pele.',
    price: 79.90,
    promotionalPrice: 64.90,
    category: 'Corpo e Banho',
    photos: [
      'https://images.unsplash.com/photo-1608248597359-f17b15f4eb6b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80'
    ],
    affiliateUrl: 'https://www.natura.com.br/p/ekos-castanha-400ml?consultoria=omnibrand',
    isActive: true,
    clicksCount: 342,
    conversionsCount: 28,
    createdAt: '2026-01-16'
  },
  {
    id: 'prod-2',
    showcaseId: 'natura-1',
    name: 'Kaiak Masculino Desodorante Colônia 100ml',
    sku: 'NAT-KAI-02',
    description: 'O clássico da perfumaria brasileira. Notas aquosas, bergamota e especiarias.',
    price: 149.90,
    promotionalPrice: 119.90,
    category: 'Perfumaria',
    photos: [
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80'
    ],
    affiliateUrl: 'https://www.natura.com.br/p/kaiak-tradicional?consultoria=omnibrand',
    isActive: true,
    clicksCount: 512,
    conversionsCount: 45,
    createdAt: '2026-01-18'
  },
  {
    id: 'prod-3',
    showcaseId: 'boticario-2',
    name: 'Malbec Desodorante Colônia 100ml',
    sku: 'BOT-MAL-01',
    description: 'O primeiro deo colônia do mundo feito com álcool vínico macerado em barris de carvalho.',
    price: 189.90,
    category: 'Perfumaria',
    photos: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=600&auto=format&fit=crop&q=80'
    ],
    affiliateUrl: 'https://www.boticario.com.br/malbec-colonia?vitrine=omnibrand',
    isActive: true,
    clicksCount: 890,
    conversionsCount: 76,
    createdAt: '2026-01-21'
  },
  {
    id: 'prod-4',
    showcaseId: 'boticario-2',
    name: 'Creme Hidratante Desodorante Corporal Lily 250g',
    sku: 'BOT-LIL-02',
    description: 'Fragrância marcante e única com óleo essencial de flores de lírio obtido por enfleurage.',
    price: 109.90,
    promotionalPrice: 95.90,
    category: 'Hidratantes',
    photos: [
      'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80'
    ],
    affiliateUrl: 'https://www.boticario.com.br/lily-creme?vitrine=omnibrand',
    isActive: true,
    clicksCount: 420,
    conversionsCount: 39,
    createdAt: '2026-01-22'
  },
  {
    id: 'prod-5',
    showcaseId: 'eudora-3',
    name: 'Soul Kiss Me Batom Líquido Matte',
    sku: 'EUD-BAT-01',
    description: 'Efeito super matte que não resseca os lábios. Alta fixação por até 12 horas.',
    price: 39.90,
    promotionalPrice: 29.90,
    category: 'Maquiagem',
    photos: [
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80'
    ],
    affiliateUrl: 'https://www.eudora.com.br/soul-kiss-me?vitrine=omnibrand',
    isActive: true,
    clicksCount: 230,
    conversionsCount: 31,
    createdAt: '2026-02-02'
  }
];

const INITIAL_BANNERS: Banner[] = [
  {
    id: 'ban-1',
    showcaseId: 'natura-1',
    title: 'Ciclo de Inverno Natura',
    subtitle: 'Até 40% OFF em Perfumaria e Cuidados Diários',
    imageUrl: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=1200&auto=format&fit=crop&q=80',
    ctaText: 'Aproveitar Ofertas',
    ctaUrl: 'https://www.natura.com.br',
    order: 1,
    isActive: true
  },
  {
    id: 'ban-2',
    showcaseId: 'boticario-2',
    title: 'Lançamentos Malbec & Lily',
    subtitle: 'O presente perfeito para quem você ama com frete grátis',
    imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1200&auto=format&fit=crop&q=80',
    ctaText: 'Ver Coleção',
    ctaUrl: 'https://www.boticario.com.br',
    order: 1,
    isActive: true
  },
  {
    id: 'ban-3',
    showcaseId: 'eudora-3',
    title: 'Eudora Glow & Make',
    subtitle: 'Realce sua beleza com a linha profissional',
    imageUrl: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=1200&auto=format&fit=crop&q=80',
    ctaText: 'Comprar Agora',
    ctaUrl: 'https://www.eudora.com.br',
    order: 1,
    isActive: true
  }
];

const INITIAL_CLICKS: ClickRecord[] = [
  {
    id: 'clk-1',
    timestamp: '2026-10-28 14:32',
    showcaseId: 'boticario-2',
    productId: 'prod-3',
    productName: 'Malbec Desodorante Colônia 100ml',
    device: 'Mobile',
    source: 'Instagram Stories',
    converted: true,
    commissionEarned: 15.19
  },
  {
    id: 'clk-2',
    timestamp: '2026-10-28 14:15',
    showcaseId: 'natura-1',
    productId: 'prod-2',
    productName: 'Kaiak Masculino Desodorante Colônia',
    device: 'Desktop',
    source: 'WhatsApp Group',
    converted: true,
    commissionEarned: 11.39
  },
  {
    id: 'clk-3',
    timestamp: '2026-10-28 13:50',
    showcaseId: 'natura-1',
    productId: 'prod-1',
    productName: 'Ekos Castanha Polpa Hidratante',
    device: 'Mobile',
    source: 'Direct Link',
    converted: false
  }
];

const INITIAL_COMMISSIONS: CommissionRecord[] = [
  {
    id: 'com-1',
    date: '2026-10-28',
    showcaseId: 'boticario-2',
    orderId: 'BOT-883920',
    productName: 'Malbec Desodorante Colônia 100ml',
    saleAmount: 189.90,
    commissionRate: 8.0,
    commissionAmount: 15.19,
    status: 'Aprovado'
  },
  {
    id: 'com-2',
    date: '2026-10-28',
    showcaseId: 'natura-1',
    orderId: 'NAT-442190',
    productName: 'Kaiak Masculino Desodorante Colônia',
    saleAmount: 119.90,
    commissionRate: 9.5,
    commissionAmount: 11.39,
    status: 'Pago'
  }
];

const INITIAL_SETTINGS: AdminSettings = {
  siteName: 'OmniBrand Afiliados',
  adminEmail: 'admin@omnibrand.com.br',
  currency: 'BRL',
  supabaseUrl: '',
  supabaseAnonKey: '',
  storageProvider: 'local',
  autoApproveCommissions: true
};

export const storageService = {
  getShowcases: (): Showcase[] => {
    const data = localStorage.getItem('omnibrand_showcases');
    return data ? JSON.parse(data) : INITIAL_SHOWCASES;
  },
  saveShowcases: async (items: Showcase[]) => {
    localStorage.setItem('omnibrand_showcases', JSON.stringify(items));
    // Optional Supabase sync if connected
    const client = getSupabaseClient();
    if (client) {
      try {
        for (const item of items) {
          await client.from('showcases').upsert({
            id: item.id,
            name: item.name,
            slug: item.slug,
            description: item.description,
            logo_url: item.logoUrl,
            banner_url: item.bannerUrl,
            category: item.category,
            affiliate_base_url: item.affiliateBaseUrl,
            commission_rate: item.commissionRate,
            is_active: item.isActive,
            theme_color: item.themeColor,
            created_at: item.createdAt
          });
        }
      } catch (err) {
        console.warn('Supabase showcases sync note:', err);
      }
    }
  },

  getProducts: (): Product[] => {
    const data = localStorage.getItem('omnibrand_products');
    return data ? JSON.parse(data) : INITIAL_PRODUCTS;
  },
  saveProducts: async (items: Product[]) => {
    localStorage.setItem('omnibrand_products', JSON.stringify(items));
    const client = getSupabaseClient();
    if (client) {
      try {
        for (const item of items) {
          await client.from('products').upsert({
            id: item.id,
            showcase_id: item.showcaseId,
            name: item.name,
            sku: item.sku,
            description: item.description,
            price: item.price,
            promotional_price: item.promotionalPrice,
            category: item.category,
            photos: item.photos,
            affiliate_url: item.affiliateUrl,
            is_active: item.isActive,
            clicks_count: item.clicksCount,
            conversions_count: item.conversionsCount,
            created_at: item.createdAt
          });
        }
      } catch (err) {
        console.warn('Supabase products sync note:', err);
      }
    }
  },

  getBanners: (): Banner[] => {
    const data = localStorage.getItem('omnibrand_banners');
    return data ? JSON.parse(data) : INITIAL_BANNERS;
  },
  saveBanners: async (items: Banner[]) => {
    localStorage.setItem('omnibrand_banners', JSON.stringify(items));
    const client = getSupabaseClient();
    if (client) {
      try {
        for (const item of items) {
          await client.from('banners').upsert({
            id: item.id,
            showcase_id: item.showcaseId,
            title: item.title,
            subtitle: item.subtitle,
            image_url: item.imageUrl,
            cta_text: item.ctaText,
            cta_url: item.ctaUrl,
            order: item.order,
            is_active: item.isActive
          });
        }
      } catch (err) {
        console.warn('Supabase banners sync note:', err);
      }
    }
  },

  getClicks: (): ClickRecord[] => {
    const data = localStorage.getItem('omnibrand_clicks');
    return data ? JSON.parse(data) : INITIAL_CLICKS;
  },
  saveClicks: (items: ClickRecord[]) => {
    localStorage.setItem('omnibrand_clicks', JSON.stringify(items));
  },

  getCommissions: (): CommissionRecord[] => {
    const data = localStorage.getItem('omnibrand_commissions');
    return data ? JSON.parse(data) : INITIAL_COMMISSIONS;
  },
  saveCommissions: (items: CommissionRecord[]) => {
    localStorage.setItem('omnibrand_commissions', JSON.stringify(items));
  },

  getSettings: (): AdminSettings => {
    const data = localStorage.getItem('omnibrand_settings');
    return data ? JSON.parse(data) : INITIAL_SETTINGS;
  },
  saveSettings: (settings: AdminSettings) => {
    localStorage.setItem('omnibrand_settings', JSON.stringify(settings));
  },

  resetDefaults: () => {
    localStorage.setItem('omnibrand_showcases', JSON.stringify(INITIAL_SHOWCASES));
    localStorage.setItem('omnibrand_products', JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem('omnibrand_banners', JSON.stringify(INITIAL_BANNERS));
    localStorage.setItem('omnibrand_clicks', JSON.stringify(INITIAL_CLICKS));
    localStorage.setItem('omnibrand_commissions', JSON.stringify(INITIAL_COMMISSIONS));
    localStorage.setItem('omnibrand_settings', JSON.stringify(INITIAL_SETTINGS));
  }
};
