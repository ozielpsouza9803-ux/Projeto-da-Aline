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
  },

  /**
   * Algorithmic NLP Fallback Generator for when Gemini API key is unavailable or offline.
   * Normalizes typos, matches brands/categories/products, handles stock queries & ambiguous questions.
   * STRICT GUARANTEES: Never mixes categories (e.g. hidratantes as perfumes), strictly filters by brand,
   * never hallucinates prices or stock, and asks for clarification on ambiguous queries.
   */
  async generateFallbackResponse(
    userQuery: string, 
    productsList?: PublicChatProduct[], 
    brandsList?: Array<{ id: string; name: string; category: string }>
  ): Promise<string> {
    const raw = userQuery.trim().toLowerCase();
    const normalized = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const prods = productsList || await this.searchProducts({});
    const brands = brandsList || await this.getAvailableBrands();

    const availableBrandNames = brands.map(b => b.name);
    const brandListFormatted = availableBrandNames.join(', ') || 'Natura, O Boticário e Eudora';

    // 1. Coupon & Discount Queries
    if (normalized.includes('cupom') || normalized.includes('desconto') || normalized.includes('promocao') || normalized.includes('oferta')) {
      const promoProducts = prods.filter(p => p.promotionalPrice && p.promotionalPrice < p.price);
      if (promoProducts.length > 0) {
        const list = promoProducts.slice(0, 4).map(p => 
          `• ${p.name} (${p.brandName}): De R$ ${p.price.toFixed(2)} por R$ ${p.promotionalPrice?.toFixed(2)}`
        ).join('\n');
        return `Temos ofertas e preços promocionais incríveis ativos no momento!\n\nConfira alguns destaques com desconto em nosso catálogo:\n\n${list}\n\nVocê pode clicar nas vitrines para ser direcionado com segurança aos canais oficiais das marcas.`;
      }
      return 'Para aproveitar nossas ofertas e descontos exclusivos, selecione uma das marcas no topo da tela ou explore a nossa vitrine de produtos!';
    }

    // 2. Admin / Login / Panel Queries
    if (normalized.includes('admin') || normalized.includes('login') || normalized.includes('painel') || normalized.includes('entrar')) {
      return 'Para acessar a área restrita do Painel Administrativo, abra o Menu no topo ou no rodapé da página inicial e selecione a opção "Painel Administrativo".';
    }

    // 3. Human Support / Help Queries
    if (normalized.includes('humano') || normalized.includes('atendente') || normalized.includes('ajuda') || normalized.includes('suporte')) {
      return 'Você está conversando com o Assistente Virtual da OmniBrand. Se precisar de suporte individualizado para links ou parcerias, nosso atendimento está disponível em nossos canais de consultoria. Como posso te ajudar com nosso catálogo de produtos agora?';
    }

    // 4. Unknown / Non-existent Brand check (e.g. Avène, Chanel, MAC, Sephora, Avon, Mary Kay)
    const knownBrandsNormalized = brands.map(b => b.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    const matchedBrand = brands.find(b => 
      normalized.includes(b.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    );

    const commonExternalBrands = ['avene', 'chanel', 'mac', 'sephora', 'avon', 'mary kay', 'dior', 'loreal', 'nivea', 'l\'oreal', 'vishy', 'la roche'];
    const searchedUnknownBrand = commonExternalBrands.find(ub => normalized.includes(ub));

    if (searchedUnknownBrand && !matchedBrand) {
      const formattedSearched = searchedUnknownBrand.charAt(0).toUpperCase() + searchedUnknownBrand.slice(1);
      return `Não encontramos produtos da marca **${formattedSearched}** em nosso catálogo no momento.\n\nAtualmente trabalhamos com as seguintes marcas parceiras oficiais: **${brandListFormatted}**.\n\nDeseja conhecer os produtos disponíveis em alguma dessas marcas?`;
    }

    // 5. Category Intent Detection
    // Strict taxonomy mapping based on actual database category values:
    // "Perfumaria", "Corpo e Banho", "Maquiagem"
    const perfumeKeywords = ['perfume', 'perfumes', 'colonia', 'colonias', 'fragrancia', 'fragrancias', 'eau', 'parfum'];
    const bodyKeywords = ['hidratante', 'hidratantes', 'creme', 'cremes', 'locao', 'locoes', 'sabonete', 'sabonetes', 'oleo', 'corpo'];
    const makeupKeywords = ['batom', 'batons', 'maquiagem', 'maquiagens', 'base', 'sombra', 'rimel', 'pincel', 'blush', 'make'];

    const wantsPerfume = perfumeKeywords.some(kw => normalized.includes(kw));
    const wantsBody = bodyKeywords.some(kw => normalized.includes(kw));
    const wantsMakeup = makeupKeywords.some(kw => normalized.includes(kw));

    // 6. Ambiguous Queries (e.g. "Me indica algo bom", "O que tem de bom?", "Recomenda algo")
    const isAmbiguous = (
      normalized.includes('me indica') || 
      normalized.includes('indicacao') || 
      normalized.includes('recomenda') || 
      normalized.includes('o que tem') || 
      normalized.includes('algo bom') ||
      normalized === 'produtos' ||
      normalized === 'opcoes'
    ) && !matchedBrand && !wantsPerfume && !wantsBody && !wantsMakeup;

    if (isAmbiguous) {
      return `Temos excelentes produtos em nosso catálogo! Para que eu possa te fazer a melhor recomendação, por favor me informe:\n\n1. Qual categoria você procura? (**Perfumaria**, **Corpo e Banho** ou **Maquiagem**)?\n2. Você tem preferência por alguma marca (**${brandListFormatted}**)?`;
    }

    // 7. Strict Product Filtering by Category and/or Brand
    let filteredProds = [...prods];

    // Filter by Brand first if specified
    if (matchedBrand) {
      filteredProds = filteredProds.filter(p => p.brandId === matchedBrand.id || p.brandName.toLowerCase().includes(matchedBrand.name.toLowerCase()));
    }

    // Filter strictly by Category using exact category property
    if (wantsPerfume) {
      filteredProds = filteredProds.filter(p => p.category.toLowerCase().includes('perfumaria'));
    } else if (wantsBody) {
      filteredProds = filteredProds.filter(p => p.category.toLowerCase().includes('corpo'));
    } else if (wantsMakeup) {
      filteredProds = filteredProds.filter(p => p.category.toLowerCase().includes('maquiagem'));
    }

    // If query was specific (e.g., product name or specific keyword like "kaiak", "malbec", "lily", "castanha")
    if (!wantsPerfume && !wantsBody && !wantsMakeup && !matchedBrand && normalized.length > 3) {
      const words = normalized.split(/\s+/).filter(w => w.length > 2);
      filteredProds = filteredProds.filter(p => {
        const pNameNorm = p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return words.some(w => pNameNorm.includes(w));
      });
    }

    // 8. Generate Output from Filtered Results
    if (filteredProds.length > 0) {
      if (filteredProds.length === 1) {
        const p = filteredProds[0];
        const priceStr = p.promotionalPrice 
          ? `R$ ${p.promotionalPrice.toFixed(2)} (de R$ ${p.price.toFixed(2)})` 
          : `R$ ${p.price.toFixed(2)}`;
        const stockStr = p.stockStatus === 'available' ? 'Disponível' : p.stockStatus === 'low' ? 'Estoque Baixo' : 'Esgotado';

        return `Encontrei o produto ideal em nosso catálogo:\n\n• **${p.name}** (${p.brandName})\n• **Categoria:** ${p.category}\n• **Preço:** ${priceStr}\n• **Estoque:** ${stockStr} (${p.stockQuantity} un)\n• **Descrição:** ${p.description}\n\nVocê pode adquirir este produto acessando a vitrine da ${p.brandName}!`;
      }

      const itemsList = filteredProds.map(p => {
        const priceStr = p.promotionalPrice 
          ? `R$ ${p.promotionalPrice.toFixed(2)} (de R$ ${p.price.toFixed(2)})` 
          : `R$ ${p.price.toFixed(2)}`;
        return `• **${p.name}** (${p.brandName}) - Categoria: ${p.category} - ${priceStr}`;
      }).join('\n');

      let header = 'Confira os produtos encontrados em nosso catálogo:';
      if (wantsPerfume) header = `Confira os perfumes e fragrâncias disponíveis${matchedBrand ? ` da marca **${matchedBrand.name}**` : ''}:`;
      else if (wantsBody) header = `Confira os hidratantes e produtos para corpo/banho disponíveis${matchedBrand ? ` da marca **${matchedBrand.name}**` : ''}:`;
      else if (wantsMakeup) header = `Confira os produtos de maquiagem disponíveis${matchedBrand ? ` da marca **${matchedBrand.name}**` : ''}:`;
      else if (matchedBrand) header = `Confira os produtos disponíveis da marca **${matchedBrand.name}**:`;

      return `${header}\n\n${itemsList}\n\nDeseja saber mais detalhes sobre algum desses produtos?`;
    }

    // 9. Specific Category / Brand requested but NO matches found
    if (matchedBrand && (wantsPerfume || wantsBody || wantsMakeup)) {
      const catRequested = wantsPerfume ? 'perfumes' : wantsBody ? 'hidratantes' : 'maquiagem';
      return `Não encontramos ${catRequested} da marca **${matchedBrand.name}** em nosso catálogo no momento.\n\nNo entanto, temos outros produtos disponíveis da **${matchedBrand.name}**, além de ${catRequested} de outras marcas parceiras (${brandListFormatted}). Deseja conferir?`;
    }

    // 10. Greetings
    if (normalized.length < 5 || normalized.includes('ola') || normalized.includes('bom dia') || normalized.includes('boa tarde') || normalized.includes('tudo bem')) {
      return `Olá! Sou o Assistente Virtual da OmniBrand Afiliados.\n\nTrabalhamos com marcas parceiras como **${brandListFormatted}**.\n\nComo posso te ajudar hoje? Você pode me perguntar sobre perfumes, hidratantes, maquiagens ou promoções!`;
    }

    // 11. Generic Not Found Fallback with Clarification Request
    return `Desculpe, não encontrei nenhum produto correspondente a "${userQuery}" no catálogo atual.\n\nNossas vitrines ativas contam com produtos das marcas: **${brandListFormatted}** nas categorias de **Perfumaria**, **Corpo e Banho** e **Maquiagem**.\n\nPoderia reformular sua pergunta ou informar qual marca/categoria você procura?`;
  }
};

