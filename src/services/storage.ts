import { Showcase, Product, Banner, ClickRecord, CommissionRecord, AdminSettings } from '../types';

export const SEED_NATURA_ID = '11111111-1111-4111-a111-111111111111';
export const SEED_BOTICARIO_ID = '22222222-2222-4222-a222-222222222222';
export const SEED_EUDORA_ID = '33333333-3333-4333-a333-333333333333';

const INITIAL_SHOWCASES: Showcase[] = [
  {
    id: SEED_NATURA_ID,
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
    id: SEED_BOTICARIO_ID,
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
    id: SEED_EUDORA_ID,
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
    id: 'a0000000-0000-4000-a000-000000000001',
    showcaseId: SEED_NATURA_ID,
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
    id: 'a0000000-0000-4000-a000-000000000002',
    showcaseId: SEED_NATURA_ID,
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
    id: 'a0000000-0000-4000-a000-000000000003',
    showcaseId: SEED_BOTICARIO_ID,
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
    id: 'a0000000-0000-4000-a000-000000000004',
    showcaseId: SEED_BOTICARIO_ID,
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
    id: 'a0000000-0000-4000-a000-000000000005',
    showcaseId: SEED_EUDORA_ID,
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
    id: 'b0000000-0000-4000-a000-000000000001',
    showcaseId: SEED_NATURA_ID,
    title: 'Ciclo de Inverno Natura',
    subtitle: 'Até 40% OFF em Perfumaria e Cuidados Diários',
    imageUrl: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=1200&auto=format&fit=crop&q=80',
    ctaText: 'Aproveitar Ofertas',
    ctaUrl: 'https://www.natura.com.br',
    order: 1,
    isActive: true
  },
  {
    id: 'b0000000-0000-4000-a000-000000000002',
    showcaseId: SEED_BOTICARIO_ID,
    title: 'Lançamentos Malbec & Lily',
    subtitle: 'O presente perfeito para quem você ama com frete grátis',
    imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1200&auto=format&fit=crop&q=80',
    ctaText: 'Ver Coleção',
    ctaUrl: 'https://www.boticario.com.br',
    order: 1,
    isActive: true
  },
  {
    id: 'b0000000-0000-4000-a000-000000000003',
    showcaseId: SEED_EUDORA_ID,
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
    id: 'c0000000-0000-4000-a000-000000000001',
    timestamp: '2026-10-28 14:32',
    showcaseId: SEED_BOTICARIO_ID,
    productId: 'a0000000-0000-4000-a000-000000000003',
    productName: 'Malbec Desodorante Colônia 100ml',
    device: 'Mobile',
    source: 'Instagram Stories',
    converted: true,
    commissionEarned: 15.19
  },
  {
    id: 'c0000000-0000-4000-a000-000000000002',
    timestamp: '2026-10-28 14:15',
    showcaseId: SEED_NATURA_ID,
    productId: 'a0000000-0000-4000-a000-000000000002',
    productName: 'Kaiak Masculino Desodorante Colônia',
    device: 'Desktop',
    source: 'WhatsApp Group',
    converted: true,
    commissionEarned: 11.39
  }
];

const INITIAL_COMMISSIONS: CommissionRecord[] = [
  {
    id: 'com-1',
    date: '2026-10-28',
    showcaseId: SEED_BOTICARIO_ID,
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
    showcaseId: SEED_NATURA_ID,
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
  supabaseUrl: 'https://spqwrnywdlkrfrslfmwl.supabase.co',
  supabaseAnonKey: 'sb_publishable_JGX27g41zq4QHaW6i5rYVw_KNMOHgq0',
  storageProvider: 'supabase',
  autoApproveCommissions: true,
  primaryButtonColor: '#f97316',
  showcasePosition: 'below_banner'
};

export const storageService = {
  getShowcases: (): Showcase[] => {
    const data = localStorage.getItem('omnibrand_showcases');
    if (!data) return INITIAL_SHOWCASES;
    try {
      const parsed = JSON.parse(data);
      // Ensure IDs are valid UUID format
      if (parsed.length > 0 && !parsed[0].id.includes('-')) return INITIAL_SHOWCASES;
      return parsed;
    } catch {
      return INITIAL_SHOWCASES;
    }
  },
  saveShowcases: (items: Showcase[]) => {
    localStorage.setItem('omnibrand_showcases', JSON.stringify(items));
  },

  getProducts: (): Product[] => {
    const data = localStorage.getItem('omnibrand_products');
    if (!data) return INITIAL_PRODUCTS;
    try {
      const parsed = JSON.parse(data);
      if (parsed.length > 0 && !parsed[0].id.includes('-')) return INITIAL_PRODUCTS;
      return parsed;
    } catch {
      return INITIAL_PRODUCTS;
    }
  },
  saveProducts: (items: Product[]) => {
    localStorage.setItem('omnibrand_products', JSON.stringify(items));
  },

  getBanners: (): Banner[] => {
    const data = localStorage.getItem('omnibrand_banners');
    if (!data) return INITIAL_BANNERS;
    try {
      const parsed = JSON.parse(data);
      if (parsed.length > 0 && !parsed[0].id.includes('-')) return INITIAL_BANNERS;
      return parsed;
    } catch {
      return INITIAL_BANNERS;
    }
  },
  saveBanners: (items: Banner[]) => {
    localStorage.setItem('omnibrand_banners', JSON.stringify(items));
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

  getAdminCredentials: () => {
    const data = localStorage.getItem('omnibrand_admin_creds');
    return data ? JSON.parse(data) : { email: 'admin@omnibrand.com.br', username: 'admin', password: 'admin' };
  },
  saveAdminCredentials: (creds: { email?: string; username?: string; password?: string }) => {
    const current = storageService.getAdminCredentials();
    const updated = { ...current, ...creds };
    localStorage.setItem('omnibrand_admin_creds', JSON.stringify(updated));
    return updated;
  },

  resetDefaults: () => {
    localStorage.setItem('omnibrand_showcases', JSON.stringify(INITIAL_SHOWCASES));
    localStorage.setItem('omnibrand_products', JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem('omnibrand_banners', JSON.stringify(INITIAL_BANNERS));
    localStorage.setItem('omnibrand_clicks', JSON.stringify(INITIAL_CLICKS));
    localStorage.setItem('omnibrand_commissions', JSON.stringify(INITIAL_COMMISSIONS));
    localStorage.setItem('omnibrand_settings', JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem('omnibrand_admin_creds', JSON.stringify({ email: 'admin@omnibrand.com.br', username: 'admin', password: 'admin' }));
  }
};
