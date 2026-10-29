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
 * Standard Brazilian Real (BRL) currency formatter.
 * Guarantees complete values (e.g. 'R$ 119,90') with comma decimal and two decimal places.
 */
export function formatBRL(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
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
 * Preserves price as normal price and promotionalPrice as promotional price without automatic swapping.
 */
export function normalizePublicChatProduct(product: Product, showcases: Showcase[]): PublicChatProduct {
  const brand = showcases.find(s => s.id === product.showcaseId);
  const brandName = brand ? brand.name : 'Marca Geral';
  const qty = product.stockQuantity ?? (product.isActive ? 10 : 0);
  const status = calculateStockStatus(qty);

  const normalPrice = Number(product.price || 0);
  let promoPrice = (product.promotionalPrice !== undefined && product.promotionalPrice !== null && Number(product.promotionalPrice) > 0)
    ? Number(product.promotionalPrice)
    : undefined;

  // If promoPrice is equal to or greater than normalPrice, it does not represent an active discount
  if (promoPrice !== undefined && promoPrice >= normalPrice) {
    promoPrice = undefined;
  }

  return {
    id: product.id,
    name: product.name,
    brandName,
    brandId: product.showcaseId,
    sku: product.sku || `SKU-${product.id.slice(0, 6)}`,
    description: product.description,
    price: normalPrice,
    promotionalPrice: promoPrice,
    category: product.category,
    mainPhoto: product.photos?.[0] || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80',
    photos: product.photos || [],
    affiliateUrl: product.affiliateUrl,
    stockQuantity: qty,
    stockStatus: status,
    isAvailable: qty > 0 && product.isActive
  };
}

// In-memory catalog cache with TTL to eliminate latency on repeated chatbot requests
let brandsCache: { data: Array<{ id: string; name: string; category: string }>; timestamp: number } | null = null;
let productsCache: { data: PublicChatProduct[]; rawProducts: Product[]; showcases: Showcase[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes TTL

export function invalidateChatbotCatalogCache() {
  brandsCache = null;
  productsCache = null;
}

/**
 * Public Data Layer for Chatbot: Searches real products in Supabase / Local Storage
 */
export const chatbotQueryService = {
  /**
   * Returns available active brands for chatbot context (cached)
   */
  async getAvailableBrands(forceRefresh = false): Promise<Array<{ id: string; name: string; category: string }>> {
    if (!forceRefresh && brandsCache && (Date.now() - brandsCache.timestamp < CACHE_TTL_MS)) {
      return brandsCache.data;
    }

    let showcases = await fetchShowcasesFromSupabase();
    if (!showcases || showcases.length === 0) {
      showcases = storageService.getShowcases();
    }
    const result = showcases
      .filter(s => s.isActive)
      .map(s => ({
        id: s.id,
        name: s.name,
        category: s.category
      }));

    brandsCache = { data: result, timestamp: Date.now() };
    return result;
  },

  /**
   * Searches public products by keyword, brand, price range, and availability (cached)
   */
  async searchProducts(params: ChatbotSearchParams = {}, forceRefresh = false): Promise<PublicChatProduct[]> {
    let publicProducts: PublicChatProduct[];

    if (!forceRefresh && productsCache && (Date.now() - productsCache.timestamp < CACHE_TTL_MS)) {
      publicProducts = [...productsCache.data];
    } else {
      let products = await fetchProductsFromSupabase();
      if (!products || products.length === 0) {
        products = storageService.getProducts();
      }

      let showcases = await fetchShowcasesFromSupabase();
      if (!showcases || showcases.length === 0) {
        showcases = storageService.getShowcases();
      }

      publicProducts = products
        .filter(p => p.isActive)
        .map(p => normalizePublicChatProduct(p, showcases || []));

      productsCache = {
        data: publicProducts,
        rawProducts: products,
        showcases: showcases || [],
        timestamp: Date.now()
      };
    }

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
   * Algorithmic NLP Fallback Generator for when Gemini API key is unavailable, offline, or timing out.
   * Normalizes typos, matches brands/categories/products, handles price, discount & stock queries accurately.
   */
  async generateFallbackResponse(
    userQuery: string, 
    productsList?: PublicChatProduct[], 
    brandsList?: Array<{ id: string; name: string; category: string }>,
    historyMessages?: Array<{ role: string; content: string }>
  ): Promise<string> {
    const raw = userQuery.trim().toLowerCase();
    const normalized = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const prods = productsList || await this.searchProducts({});
    const brands = brandsList || await this.getAvailableBrands();

    const availableBrandNames = brands.map(b => b.name);
    const brandListFormatted = availableBrandNames.join(', ') || 'Natura, O Boticário e Eudora';

    // 1. Admin / Login / Panel Queries
    if (normalized.includes('admin') || normalized.includes('login') || normalized.includes('painel') || normalized.includes('entrar')) {
      return 'Para acessar a área restrita do Painel Administrativo, abra o Menu no topo ou no rodapé da página inicial e selecione a opção "Painel Administrativo".';
    }

    // 2. Human Support / Help Queries
    if (normalized.includes('humano') || normalized.includes('atendente') || normalized.includes('ajuda') || normalized.includes('suporte')) {
      return 'Você está conversando com o Assistente Virtual da OmniBrand. Se precisar de suporte individualizado para links ou parcerias, nosso atendimento está disponível em nossos canais de consultoria. Como posso te ajudar com nosso catálogo de produtos agora?';
    }

    // 3. Unknown / Non-existent Brand check (e.g. Avène, Chanel, MAC, Sephora, Avon, Mary Kay)
    const matchedBrand = brands.find(b => 
      normalized.includes(b.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    );

    const commonExternalBrands = ['avene', 'chanel', 'mac', 'sephora', 'avon', 'mary kay', 'dior', 'loreal', 'nivea', 'l\'oreal', 'vishy', 'la roche'];
    const searchedUnknownBrand = commonExternalBrands.find(ub => normalized.includes(ub));

    if (searchedUnknownBrand && !matchedBrand) {
      const formattedSearched = searchedUnknownBrand.charAt(0).toUpperCase() + searchedUnknownBrand.slice(1);
      return `Não encontramos produtos da marca **${formattedSearched}** em nosso catálogo no momento.\n\nAtualmente trabalhamos com as seguintes marcas parceiras oficiais: **${brandListFormatted}**.\n\nDeseja conhecer os produtos disponíveis em alguma dessas marcas?`;
    }

    // 4. Intent Detection: Price, Discount, Stock
    const isPriceQuery = /\b(preco|precos|valor|valores|custa|custam|quanto)\b/i.test(normalized);
    const isDiscountQuery = /\b(desconto|descontos|promo|promocao|promocoes|oferta|ofertas|cupom)\b/i.test(normalized);
    const isStockQuery = /\b(estoque|unidade|unidades|quantas|quantos|disponivel|disponiveis|quantidade)\b/i.test(normalized);

    // Stop words to remove when extracting product terms
    const stopWords = new Set([
      'qual', 'quais', 'quanto', 'quantas', 'quantos', 'preco', 'precos', 'valor', 'valores',
      'custa', 'custam', 'tem', 'temos', 'desconto', 'descontos', 'promo', 'promocao', 'promocoes',
      'oferta', 'ofertas', 'unidade', 'unidades', 'estoque', 'disponivel', 'disponiveis', 'estao',
      'esta', 'sobre', 'para', 'com', 'nos', 'nas', 'dos', 'das', 'do', 'da', 'de', 'no', 'na',
      'voce', 'voces', 'produtos', 'produto', 'algum', 'alguma', 'saber', 'saberia', 'dizer',
      'por', 'favor', 'me', 'diz', 'tiver', 'que', 'um', 'uma', 'e', 'os', 'as'
    ]);

    const rawWords = normalized.split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(Boolean);
    const cleanWords = rawWords.filter(w => !stopWords.has(w) && w.length > 1);

    // 5. Category Intent Detection
    const perfumeKeywords = ['perfume', 'perfumes', 'colonia', 'colonias', 'fragrancia', 'fragrancias', 'eau', 'parfum'];
    const bodyKeywords = ['hidratante', 'hidratantes', 'creme', 'cremes', 'locao', 'locoes', 'sabonete', 'sabonetes', 'oleo', 'corpo'];
    const makeupKeywords = ['batom', 'batons', 'maquiagem', 'maquiagens', 'base', 'sombra', 'rimel', 'pincel', 'blush', 'make'];

    const wantsPerfume = perfumeKeywords.some(kw => normalized.includes(kw));
    const wantsBody = bodyKeywords.some(kw => normalized.includes(kw));
    const wantsMakeup = makeupKeywords.some(kw => normalized.includes(kw));

    // 6. Ambiguous Queries
    const isAmbiguous = (
      normalized.includes('me indica') || 
      normalized.includes('indicacao') || 
      normalized.includes('recomenda') || 
      normalized.includes('o que tem') || 
      normalized.includes('algo bom') ||
      normalized === 'produtos' ||
      normalized === 'opcoes'
    ) && !matchedBrand && !wantsPerfume && !wantsBody && !wantsMakeup && cleanWords.length === 0;

    if (isAmbiguous) {
      return `Temos excelentes produtos em nosso catálogo! Para que eu possa te fazer a melhor recomendação, por favor me informe:\n\n1. Qual categoria você procura? (**Perfumaria**, **Corpo e Banho** ou **Maquiagem**)?\n2. Você tem preferência por alguma marca (**${brandListFormatted}**)?`;
    }

    // 7. Product Matching & History Context Lookup
    let matchedProducts = prods.filter(p => {
      const pNameNorm = p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (cleanWords.some(w => w.length >= 3 && pNameNorm.includes(w))) return true;
      if (cleanWords.length > 0 && pNameNorm.includes(cleanWords.join(' '))) return true;
      return false;
    });

    // Fallback to conversation history if no direct product matches and query is a follow-up
    if (matchedProducts.length === 0 && historyMessages && historyMessages.length > 1) {
      const pastMessages = [...historyMessages].reverse().slice(1);
      for (const msg of pastMessages) {
        const msgNorm = msg.content.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const found = prods.find(p => {
          const pNameNorm = p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return msgNorm.includes(pNameNorm) || pNameNorm.split(/\s+/).some(w => w.length >= 4 && msgNorm.includes(w));
        });
        if (found) {
          matchedProducts = [found];
          break;
        }
      }
    }

    // Helper for BRL currency formatting with comma decimal
    const formatBRL = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

    // 8. Specific Product Intent Output (Price, Discount, Stock)
    if (matchedProducts.length === 1 || (matchedProducts.length > 1 && (isPriceQuery || isDiscountQuery || isStockQuery))) {
      const p = matchedProducts[0];
      const hasDiscount = p.promotionalPrice !== undefined && p.promotionalPrice !== null && p.promotionalPrice < p.price;
      const normalPriceStr = formatBRL(p.price);
      const currentPrice = hasDiscount ? p.promotionalPrice! : p.price;
      const currentPriceStr = formatBRL(currentPrice);
      const savingsStr = hasDiscount ? formatBRL(p.price - p.promotionalPrice!) : null;
      const stockStatusStr = p.stockStatus === 'available' ? 'Disponível' : p.stockStatus === 'low' ? 'Estoque Baixo' : 'Esgotado';

      if (isStockQuery) {
        if (hasDiscount) {
          return `Informações de estoque para **${p.name}** (${p.brandName}):\n\n• **Quantidade em estoque:** ${p.stockQuantity} unidades disponíveis\n• **Situação:** ${stockStatusStr}\n• **Preço atual:** ${currentPriceStr} (Preço Promocional)\n• **Preço normal:** ${normalPriceStr}\n• **Economia:** ${savingsStr}`;
        }
        return `Informações de estoque para **${p.name}** (${p.brandName}):\n\n• **Quantidade em estoque:** ${p.stockQuantity} unidades disponíveis\n• **Situação:** ${stockStatusStr}\n• **Preço atual:** ${currentPriceStr}`;
      }

      if (isDiscountQuery) {
        if (hasDiscount) {
          return `Sim! O produto **${p.name}** (${p.brandName}) está com preço promocional ativo:\n\n• **Preço promocional (Preço atual):** ${currentPriceStr}\n• **Preço normal:** ${normalPriceStr}\n• **Economia:** ${savingsStr}\n• **Estoque:** ${p.stockQuantity} unidades disponíveis (${stockStatusStr})`;
        } else {
          return `O produto **${p.name}** (${p.brandName}) custa **${normalPriceStr}** no momento e não possui preço promocional cadastrado atualmente.\n\n• **Estoque:** ${p.stockQuantity} unidades disponíveis (${stockStatusStr})\n\nVocê pode acompanhar nossas promoções acessando a vitrine oficial da ${p.brandName}!`;
        }
      }

      if (isPriceQuery) {
        if (hasDiscount) {
          return `O preço do **${p.name}** (${p.brandName}) é:\n\n• **Preço atual:** ${currentPriceStr} (Preço Promocional)\n• **Preço normal:** ${normalPriceStr}\n• **Economia:** ${savingsStr}\n• **Disponibilidade em estoque:** ${p.stockQuantity} unidades (${stockStatusStr})\n\nVocê pode adquirir este produto com segurança na vitrine oficial da marca.`;
        } else {
          return `O preço do **${p.name}** (${p.brandName}) é:\n\n• **Preço atual:** ${currentPriceStr}\n• **Disponibilidade em estoque:** ${p.stockQuantity} unidades (${stockStatusStr})\n\nVocê pode adquirir este produto com segurança na vitrine oficial da marca.`;
        }
      }

      if (hasDiscount) {
        return `Encontrei o produto ideal em nosso catálogo:\n\n• **${p.name}** (${p.brandName})\n• **Categoria:** ${p.category}\n• **Preço atual:** ${currentPriceStr} (Preço Promocional)\n• **Preço normal:** ${normalPriceStr}\n• **Economia:** ${savingsStr}\n• **Estoque:** ${p.stockQuantity} un (${stockStatusStr})\n• **Descrição:** ${p.description}\n\nAcesse a vitrine da ${p.brandName} para saber mais!`;
      }
      return `Encontrei o produto ideal em nosso catálogo:\n\n• **${p.name}** (${p.brandName})\n• **Categoria:** ${p.category}\n• **Preço atual:** ${currentPriceStr}\n• **Estoque:** ${p.stockQuantity} un (${stockStatusStr})\n• **Descrição:** ${p.description}\n\nAcesse a vitrine da ${p.brandName} para saber mais!`;
    }

    // 9. Category or Brand Filtering Output
    let filteredProds = [...prods];
    if (matchedBrand) {
      filteredProds = filteredProds.filter(p => p.brandId === matchedBrand.id || p.brandName.toLowerCase().includes(matchedBrand.name.toLowerCase()));
    }
    if (wantsPerfume) {
      filteredProds = filteredProds.filter(p => p.category.toLowerCase().includes('perfumaria'));
    } else if (wantsBody) {
      filteredProds = filteredProds.filter(p => p.category.toLowerCase().includes('corpo'));
    } else if (wantsMakeup) {
      filteredProds = filteredProds.filter(p => p.category.toLowerCase().includes('maquiagem'));
    }

    if (filteredProds.length > 0 && (matchedBrand || wantsPerfume || wantsBody || wantsMakeup)) {
      const itemsList = filteredProds.map(p => {
        const hasDiscount = p.promotionalPrice !== undefined && p.promotionalPrice !== null && p.promotionalPrice < p.price;
        const priceStr = hasDiscount
          ? `Preço atual: ${formatBRL(p.promotionalPrice!)} (Preço normal: ${formatBRL(p.price)} | Economia: ${formatBRL(p.price - p.promotionalPrice!)})`
          : `Preço: ${formatBRL(p.price)}`;
        return `• **${p.name}** (${p.brandName}) - Categoria: ${p.category} - ${priceStr}`;
      }).join('\n');

      let header = 'Confira os produtos encontrados em nosso catálogo:';
      if (wantsPerfume) header = `Confira os perfumes e fragrâncias disponíveis${matchedBrand ? ` da marca **${matchedBrand.name}**` : ''}:`;
      else if (wantsBody) header = `Confira os hidratantes corporais disponíveis${matchedBrand ? ` da marca **${matchedBrand.name}**` : ''}:`;
      else if (wantsMakeup) header = `Confira os produtos de maquiagem disponíveis${matchedBrand ? ` da marca **${matchedBrand.name}**` : ''}:`;
      else if (matchedBrand) header = `Confira os produtos disponíveis da marca **${matchedBrand.name}**:`;

      return `${header}\n\n${itemsList}\n\nDeseja saber mais detalhes, preços ou estoque sobre algum desses produtos?`;
    }

    // 10. Specific Category / Brand requested but NO matches found
    if (matchedBrand && (wantsPerfume || wantsBody || wantsMakeup)) {
      const catRequested = wantsPerfume ? 'perfumes' : wantsBody ? 'hidratantes' : 'maquiagem';
      return `Não encontramos ${catRequested} da marca **${matchedBrand.name}** em nosso catálogo no momento.\n\nNo entanto, temos outros produtos disponíveis da **${matchedBrand.name}**, além de ${catRequested} de outras marcas parceiras (${brandListFormatted}). Deseja conferir?`;
    }

    // 11. Greetings
    if (normalized.length < 5 || normalized.includes('ola') || normalized.includes('bom dia') || normalized.includes('boa tarde') || normalized.includes('tudo bem')) {
      return `Olá! Sou o Assistente Virtual da OmniBrand Afiliados.\n\nTrabalhamos com marcas parceiras como **${brandListFormatted}**.\n\nComo posso te ajudar hoje? Você pode me perguntar sobre perfumes, hidratantes, maquiagens, preços ou estoque!`;
    }

    // 12. Generic Not Found Fallback with Clarification Request
    return `Desculpe, não encontrei nenhum produto correspondente a "${userQuery}" no catálogo atual.\n\nNossas vitrines ativas contam com produtos das marcas: **${brandListFormatted}** nas categorias de **Perfumaria**, **Corpo e Banho** e **Maquiagem**.\n\nPoderia reformular sua pergunta ou informar qual marca/categoria você procura?`;
  }
};


