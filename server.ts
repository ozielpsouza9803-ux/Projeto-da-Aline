import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { chatbotQueryService, formatBRL } from './src/services/chatbotQueryService.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Helper to extract structured recommended products from AI response or catalog match
function extractRecommendedProducts(
  rawText: string,
  catalogProducts: any[]
): { cleanReply: string; recommendedProducts: any[] } {
  let cleanReply = rawText;
  const recommendedIds = new Set<string>();

  // 1. Detect explicit technical tag: [PRODUTOS_RECOMENDADOS: id1, id2]
  const tagRegex = /\[(?:PRODUTOS_RECOMENDADOS|RECOMENDACOES):\s*([^\]]+)\]/i;
  const match = rawText.match(tagRegex);
  if (match) {
    cleanReply = rawText.replace(tagRegex, '').trim();
    const rawIds = match[1].split(',').map(id => id.trim().toLowerCase());
    for (const id of rawIds) {
      if (id) recommendedIds.add(id);
    }
  }

  let recommended = catalogProducts.filter(p => recommendedIds.has(p.id.toLowerCase()));

  // 2. Heuristic extraction if tag not present: search for products mentioned in reply
  if (recommended.length === 0) {
    const textNorm = cleanReply.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const p of catalogProducts) {
      const pNameNorm = p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const pSkuNorm = p.sku.toLowerCase();

      if (textNorm.includes(pSkuNorm)) {
        recommended.push(p);
        continue;
      }

      // Check distinctive name parts (e.g., "kaiak", "malbec", "ekos", "castanha", "lily", "soul kiss me")
      const distinctiveTokens = pNameNorm
        .split(/\s+/)
        .filter((token: string) => token.length >= 4 && !['para', 'corpo', 'banho', 'colonia', 'desodorante', 'hidratante', 'oleo', 'creme'].includes(token));

      const matchesToken = distinctiveTokens.some((token: string) => textNorm.includes(token));
      if (matchesToken) {
        recommended.push(p);
      }
    }
    // Limit to maximum 4 products
    recommended = recommended.slice(0, 4);
  }

  // Format structured products for client consumption
  const formattedProducts = recommended.map(p => {
    const hasDiscount = p.promotionalPrice !== undefined && p.promotionalPrice !== null && p.promotionalPrice < p.price;
    return {
      id: p.id,
      name: p.name,
      brandName: p.brandName,
      brandId: p.brandId,
      sku: p.sku,
      category: p.category,
      price: p.price,
      promotionalPrice: p.promotionalPrice,
      priceFormatted: formatBRL(p.price),
      promotionalPriceFormatted: hasDiscount ? formatBRL(p.promotionalPrice) : null,
      savingsFormatted: hasDiscount ? formatBRL(p.price - p.promotionalPrice) : null,
      stockQuantity: p.stockQuantity,
      stockStatus: p.stockStatus,
      isAvailable: p.isAvailable,
      mainPhoto: p.mainPhoto,
      photos: p.photos,
      affiliateUrl: p.affiliateUrl
    };
  });

  return { cleanReply, recommendedProducts: formattedProducts };
}

// API route for Chatbot
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  let catalogTime = 0;
  let geminiTime = 0;

  try {
    const { messages, commercialSettings } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Formato de mensagens inválido' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Commercial Settings (Strictly derived from real request settings; no fake defaults or assumptions)
    const rawDeliveryFee = commercialSettings?.deliveryFee;
    const hasValidDeliveryFee = typeof rawDeliveryFee === 'number' && !isNaN(rawDeliveryFee) && rawDeliveryFee >= 0;
    const deliveryFeeNum = hasValidDeliveryFee ? rawDeliveryFee : null;
    const deliveryFeeFormatted = deliveryFeeNum !== null ? formatBRL(deliveryFeeNum) : 'Necessário consultar a loja';

    const configuredWhatsApp = commercialSettings?.whatsapp?.trim() || null;
    const storeSiteName = commercialSettings?.siteName || 'OmniBrand Afiliados';

    const deliveryMethods = deliveryFeeNum !== null ? [
      { id: 'motoboy', name: 'Motoboy / Delivery', price: deliveryFeeNum, priceFormatted: deliveryFeeFormatted, description: 'Entrega na sua região' }
    ] : [
      { id: 'consult', name: 'Entrega / Frete', price: null, priceFormatted: 'Necessário consultar a loja', description: 'Taxa de entrega sob consulta' }
    ];

    const rawPaymentMethods = commercialSettings?.paymentMethods;
    const paymentMethods = Array.isArray(rawPaymentMethods) && rawPaymentMethods.length > 0 
      ? rawPaymentMethods 
      : [
          { id: 'consult_store', name: 'Condições da Loja', description: 'Formas de pagamento sujeitas à confirmação com a loja ou canal oficial da marca.' }
        ];

    const commercialContext = {
      siteName: storeSiteName,
      deliveryFee: deliveryFeeNum,
      deliveryFeeFormatted: deliveryFeeFormatted,
      deliveryMethods,
      paymentMethods,
      whatsappSupport: configuredWhatsApp,
      hasWhatsAppSupport: !!configuredWhatsApp,
      couponsPolicy: 'Não há cupons avulsos. Condições comerciais aplicadas conforme o catálogo oficial.'
    };

    // 2. Measure Catalog Fetch Time (with in-memory TTL cache)
    const tCatStart = Date.now();
    const [brands, products] = await Promise.all([
      chatbotQueryService.getAvailableBrands(),
      chatbotQueryService.searchProducts({})
    ]);
    catalogTime = Date.now() - tCatStart;

    // Format real catalog snapshot for AI System Instruction
    const brandsFormatted = brands.length > 0 
      ? brands.map(b => `- ${b.name} (ID: ${b.id} | Categoria: ${b.category})`).join('\n')
      : 'Nenhuma marca ativa no momento.';

    const productsFormatted = products.length > 0
      ? products.map(p => {
          const hasDiscount = p.promotionalPrice !== undefined && p.promotionalPrice !== null && p.promotionalPrice < p.price;
          const normalFormatted = formatBRL(p.price);
          const currentFormatted = formatBRL(hasDiscount ? p.promotionalPrice! : p.price);
          const savingsFormatted = hasDiscount ? formatBRL(p.price - p.promotionalPrice!) : null;

          const priceInfo = hasDiscount
            ? `Preço Atual: ${currentFormatted} (Preço Promocional) | Preço Normal: ${normalFormatted} | Economia: ${savingsFormatted}`
            : `Preço Atual: ${normalFormatted}`;

          return `- PRODUTO: "${p.name}" (ID: ${p.id}) | Marca: ${p.brandName} | Categoria: ${p.category} | ${priceInfo} | Estoque: ${p.stockQuantity} un (${p.stockStatus === 'available' ? 'Disponível' : p.stockStatus === 'low' ? 'Estoque Baixo' : 'Esgotado'}) | SKU: ${p.sku} | Descrição: ${p.description}`;
        }).join('\n')
      : 'Nenhum produto ativo no momento.';

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';

    // 3. Fallback when GEMINI_API_KEY is not available in environment
    if (!apiKey) {
      const fallbackReply = await chatbotQueryService.generateFallbackResponse(lastUserMsg, products, brands, messages);
      const { cleanReply, recommendedProducts } = extractRecommendedProducts(fallbackReply, products);
      const totalTime = Date.now() - startTime;
      console.log(`[Chatbot Performance] Catalog: ${catalogTime}ms | Fallback: ${totalTime - catalogTime}ms | Total: ${totalTime}ms (No GEMINI_API_KEY)`);
      return res.json({ 
        reply: cleanReply,
        recommendedProducts,
        commercialContext,
        metrics: { catalogTimeMs: catalogTime, totalTimeMs: totalTime, fallback: true }
      });
    }

    // Initialize Gemini 3.8 Flash server-side client
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `
Você é a Consultora Virtual Multimarcas da OmniBrand Afiliados, uma especialista em beleza, perfumaria e cosméticos, amigável, acolhedora, objetiva e que conhece a fundo as marcas parceiras oficiais (Natura, O Boticário, Eudora).

REGRAS COMERCIAIS E DE NEGÓCIO REAIS DA LOJA:
1. **ENTREGA E RETIRADA**:
   ${deliveryFeeNum !== null 
     ? `- Taxa de entrega confirmada: ${deliveryFeeFormatted}.`
     : `- Taxa de entrega: Nenhuma taxa padrão automática configurada. É OBRIGATÓRIO informar ao cliente que é necessário consultar a loja para confirmar o valor do frete.`}
2. **FORMAS DE PAGAMENTO E PARCELAMENTO**:
   - NUNCA presuma ou invente que Pix, cartão ou parcelamento estão disponíveis a menos que explicitamente confirmados nas configurações reais da loja. Caso contrário, informe que as formas de pagamento devem ser confirmadas com a loja ou no canal oficial da marca parceira.
3. **CUPONS E PROMOÇÕES**:
   - NUNCA invente cupons de desconto. Apenas os preços e descontos promocionais reais cadastrados no catálogo devem ser informados.
4. **SUPORTE E WHATSAPP COMERCIAL**:
   ${commercialContext.whatsappSupport 
     ? `- WhatsApp oficial para atendimento: ${commercialContext.whatsappSupport}.`
     : `- WhatsApp: Nenhum número de WhatsApp configurado ou confirmado. Não invente números de telefone.`}
5. **CONSULTORIA, COMPARAÇÃO E COMBOS MULTIMARCAS**:
   - Compare produtos entre marcas com base nas notas e categorias reais do catálogo (ex: Malbec vs Kaiak, Ekos Castanha vs Lily).
   - Quando o cliente pedir sugestões para um orçamento (ex: "até R$ 80", "presente até R$ 100"), selecione apenas produtos cujo preço real (promocional ou normal) caiba no valor estipulado.
   - Separe rigorosamente as categorias (Perfumaria, Corpo e Banho, Maquiagem).
6. **RECOMENDAÇÃO ESTRUTURADA DE PRODUTOS**:
   - Sempre que você recomendar, comparar ou citar um ou mais produtos específicos do catálogo para o cliente, inclua no FINAL absoluto da sua resposta uma linha técnica no seguinte formato exato:
     [PRODUTOS_RECOMENDADOS: id_do_produto_1, id_do_produto_2]
     (Utilize apenas os IDs reais dos produtos fornecidos no catálogo abaixo).
     Exemplo: [PRODUTOS_RECOMENDADOS: a0000000-0000-4000-a000-000000000001]
   - Se a resposta for apenas uma saudação ou esclarecimento geral sem produtos específicos, não inclua essa linha.

REGRAS DE FORMATAÇÃO E INFORMAÇÃO:
- Preços: Exiba SEMPRE no padrão brasileiro BRL (ex: R$ 119,90).
- Descontos: Apresente o Preço Normal, Preço Atual Promocional e o valor economizado.
- Estoque: Informe a quantidade real de unidades e o status (Disponível, Estoque Baixo ou Esgotado).
- Contexto: Considere o histórico da conversa e esclareça dúvidas de acompanhamento com naturalidade.

=== CATÁLOGO REAL DO SUPABASE (DADOS ATUAIS) ===
MARCAS PARCEIRAS ATIVAS:
${brandsFormatted}

PRODUTOS ATIVOS NO CATÁLOGO:
${productsFormatted}
`;

    // Format chat conversation messages for Gemini API ensuring strict user/model turn alternation
    const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    for (const m of messages) {
      const role = (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user';
      const content = m.content || '';
      if (!content.trim()) continue;

      if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
        formattedContents[formattedContents.length - 1].parts[0].text += `\n${content}`;
      } else {
        formattedContents.push({ role, parts: [{ text: content }] });
      }
    }

    // 4. Gemini API Request with 3500ms Timeout Wrapper
    const tGeminiStart = Date.now();
    const GEMINI_TIMEOUT_MS = 3500;

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
      }
    });

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), GEMINI_TIMEOUT_MS);
    });

    const result = await Promise.race([geminiPromise, timeoutPromise]);
    geminiTime = Date.now() - tGeminiStart;

    if (result && result.text) {
      const totalTime = Date.now() - startTime;
      const { cleanReply, recommendedProducts } = extractRecommendedProducts(result.text, products);
      console.log(`[Chatbot Performance] Catalog: ${catalogTime}ms | Gemini: ${geminiTime}ms | Total: ${totalTime}ms | Recommended: ${recommendedProducts.length}`);
      return res.json({ 
        reply: cleanReply,
        recommendedProducts,
        commercialContext,
        metrics: { catalogTimeMs: catalogTime, geminiTimeMs: geminiTime, totalTimeMs: totalTime, fallback: false }
      });
    }

    // Fast fallback if Gemini times out (>3.5s) or returns empty
    console.warn(`[Chatbot Performance] Gemini API timed out after ${geminiTime}ms or returned empty. Responding with fast fallback.`);
    const fallbackReply = await chatbotQueryService.generateFallbackResponse(lastUserMsg, products, brands, messages);
    const { cleanReply, recommendedProducts } = extractRecommendedProducts(fallbackReply, products);
    const totalTime = Date.now() - startTime;
    return res.json({ 
      reply: cleanReply,
      recommendedProducts,
      commercialContext,
      metrics: { catalogTimeMs: catalogTime, geminiTimeMs: geminiTime, totalTimeMs: totalTime, fallback: true, timeout: true }
    });

  } catch (error: any) {
    console.error('Erro na rota /api/chat:', error);

    // Fallback in case of API error or quota limit
    try {
      const { messages, commercialSettings } = req.body;
      const rawDeliveryFee = commercialSettings?.deliveryFee;
      const deliveryFeeNum = typeof rawDeliveryFee === 'number' && !isNaN(rawDeliveryFee) ? rawDeliveryFee : 15.00;
      const deliveryFeeFormatted = formatBRL(deliveryFeeNum);
      const commercialContext = {
        siteName: commercialSettings?.siteName || 'OmniBrand',
        deliveryFee: deliveryFeeNum,
        deliveryFeeFormatted,
        deliveryMethods: [
          { id: 'motoboy', name: 'Motoboy / Delivery', price: deliveryFeeNum, priceFormatted: deliveryFeeFormatted, description: 'Entrega na sua região' },
          { id: 'pickup', name: 'Retirada Presencial', price: 0, priceFormatted: 'Grátis', description: 'Retirada na loja física' }
        ],
        paymentMethods: [
          { id: 'pix', name: 'Pix', description: 'Aprovação imediata com chave Pix' },
          { id: 'credit_card', name: 'Cartão de Crédito', description: 'Parcelamento seguro' },
          { id: 'partner_official', name: 'Loja Oficial da Marca', description: 'Condições diretas no canal oficial (Pix, Cartão, Boleto)' }
        ],
        whatsappSupport: commercialSettings?.whatsapp?.trim() || null,
        hasWhatsAppSupport: !!commercialSettings?.whatsapp?.trim(),
        couponsPolicy: 'Os descontos estão aplicados diretamente no Preço Promocional do catálogo. Não há cupons avulsos adicionais no momento.'
      };

      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
      const [brands, products] = await Promise.all([
        chatbotQueryService.getAvailableBrands(),
        chatbotQueryService.searchProducts({})
      ]);
      const fallbackReply = await chatbotQueryService.generateFallbackResponse(lastUserMsg, products, brands, messages);
      const { cleanReply, recommendedProducts } = extractRecommendedProducts(fallbackReply, products);
      const totalTime = Date.now() - startTime;
      return res.json({ 
        reply: cleanReply,
        recommendedProducts,
        commercialContext,
        metrics: { catalogTimeMs: catalogTime, geminiTimeMs: geminiTime, totalTimeMs: totalTime, fallback: true, error: error.message }
      });
    } catch {
      return res.status(500).json({
        error: 'Erro temporário',
        reply: 'Desculpe, enfrentamos uma breve instabilidade no assistente virtual. Por favor, navegue diretamente por nossas vitrines ou tente novamente em alguns instantes.',
        recommendedProducts: [],
        commercialContext: null
      });
    }
  }
});

// ==========================================
// ASSISTENTE DE GERÊNCIA - AUTENTICAÇÃO NO SERVIDOR & CONSULTAS REAIS
// ==========================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://spqwrnywdlkrfrslfmwl.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_JGX27g41zq4QHaW6i5rYVw_KNMOHgq0';
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Middleware para verificação estrita de autenticação de administrador no servidor.
 * Valida o JWT do Supabase Auth e confirma se a role do perfil é 'admin'.
 * Não confia em permissões ou variáveis controladas apenas pelo navegador.
 */
async function verifyServerAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Não autorizado',
      message: 'Token de administrador ausente no cabeçalho Authorization.'
    });
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    return res.status(401).json({
      error: 'Não autorizado',
      message: 'Token de autorização vazio ou malformatado.'
    });
  }

  try {
    // 1. Validação do token junto ao Supabase Auth
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        error: 'Sessão inválida ou expirada',
        message: 'O token fornecido não foi validado pelo Supabase Auth ou expirou.'
      });
    }

    // 2. Verificação no banco de dados se a role é 'admin'
    const { data: profile, error: profileError } = await serverSupabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Usuário autenticado não possui privilégios de administrador (role admin).'
      });
    }

    (req as any).adminUser = user;
    (req as any).adminProfile = profile;
    next();
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro na verificação de autenticação',
      message: err.message || 'Falha ao validar privilégios de administrador no servidor.'
    });
  }
}

// Rota de verificação do status de autenticação do administrador no servidor
app.get('/api/admin/assistant/verify-auth', verifyServerAdminAuth, (req, res) => {
  const user = (req as any).adminUser;
  return res.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      role: 'admin'
    }
  });
});

// Rota de consulta real de catálogo para o Assistente de Gerência (Somente Leitura)
app.post('/api/admin/assistant/catalog-query', verifyServerAdminAuth, async (req, res) => {
  try {
    const { query = '', brandId, category } = req.body;
    const products = await chatbotQueryService.searchProducts({ query, brandId, category });
    
    // Formatar com dados reais para o painel de gerência
    const formatted = products.map(p => {
      const hasDiscount = p.promotionalPrice !== undefined && p.promotionalPrice !== null && p.promotionalPrice < p.price;
      return {
        id: p.id,
        name: p.name,
        brandName: p.brandName,
        brandId: p.brandId,
        category: p.category,
        sku: p.sku,
        description: p.description,
        price: p.price,
        promotionalPrice: p.promotionalPrice,
        priceFormatted: formatBRL(p.price),
        promotionalPriceFormatted: hasDiscount ? formatBRL(p.promotionalPrice!) : null,
        savingsFormatted: hasDiscount ? formatBRL(p.price - p.promotionalPrice!) : null,
        stockQuantity: p.stockQuantity,
        stockStatus: p.stockStatus,
        photos: p.photos,
        isAvailable: p.isAvailable
      };
    });

    return res.json({
      success: true,
      total: formatted.length,
      products: formatted
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao consultar catálogo',
      message: err.message
    });
  }
});

// Rota de geração de relatório de reposição a partir dos dados reais do Supabase (Somente Leitura)
app.post('/api/admin/assistant/replenishment-report', verifyServerAdminAuth, async (_req, res) => {
  try {
    const products = await chatbotQueryService.searchProducts({});
    const lowStockItems = products.filter(p => p.stockQuantity <= 5 || p.stockStatus === 'low' || p.stockStatus === 'out_of_stock');

    let totalInvestment = 0;
    const items = lowStockItems.map(p => {
      const isOut = p.stockQuantity === 0 || p.stockStatus === 'out_of_stock';
      const suggestedQty = isOut ? 10 : Math.max(10 - p.stockQuantity, 5);
      const unitCost = p.promotionalPrice && p.promotionalPrice < p.price ? p.promotionalPrice : p.price;
      const itemCost = unitCost * suggestedQty;
      totalInvestment += itemCost;

      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        category: p.category,
        showcaseId: p.brandId,
        showcaseName: p.brandName,
        currentStock: p.stockQuantity,
        stockStatus: p.stockStatus,
        reorderThreshold: 5,
        suggestedQuantity: suggestedQty,
        unitPrice: unitCost,
        estimatedCost: itemCost,
        alertReason: isOut
          ? 'Produto esgotado. Afiliados estão gerando tráfego para página sem estoque.'
          : `Estoque em nível crítico (${p.stockQuantity} un restantes). Abaixo do limite de segurança de 5 un.`,
        priority: isOut ? ('critica' as const) : ('alta' as const)
      };
    });

    return res.json({
      id: `rep-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      totalAlerts: items.length,
      outOfStockCount: items.filter(i => i.stockStatus === 'out_of_stock').length,
      lowStockCount: items.filter(i => i.stockStatus === 'low').length,
      totalEstimatedInvestment: totalInvestment,
      items,
      summaryNote: `${items.length} produtos do catálogo real necessitam de reposição com base no estoque atual do Supabase.`
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao gerar relatório de reposição',
      message: err.message
    });
  }
});

// Serve Vite frontend in dev or dist static files in production
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static('dist'));
  app.get('*', (_req, res) => {
    res.sendFile('dist/index.html', { root: '.' });
  });
}

app.listen(port, () => {
  console.log(`[OmniBrand Server] Executando em http://0.0.0.0:${port}`);
});
