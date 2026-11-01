import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';
import { chatbotQueryService, formatBRL } from '../../src/services/chatbotQueryService.js';

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

      const distinctiveTokens = pNameNorm
        .split(/\s+/)
        .filter((token: string) => token.length >= 4 && !['para', 'corpo', 'banho', 'colonia', 'desodorante', 'hidratante', 'oleo', 'creme'].includes(token));

      const matchesToken = distinctiveTokens.some((token: string) => textNorm.includes(token));
      if (matchesToken) {
        recommended.push(p);
      }
    }
    recommended = recommended.slice(0, 4);
  }

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

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const startTime = Date.now();
  let catalogTime = 0;
  let geminiTime = 0;

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { messages, commercialSettings } = body;

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Formato de mensagens inválido' })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Commercial Settings (Strictly derived from real request settings; no fake defaults or assumptions)
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

    // Fetch real catalog from Supabase with TTL cache
    const tCatStart = Date.now();
    const [brands, products] = await Promise.all([
      chatbotQueryService.getAvailableBrands(),
      chatbotQueryService.searchProducts({})
    ]);
    catalogTime = Date.now() - tCatStart;

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

    // Fallback when GEMINI_API_KEY is not available
    if (!apiKey) {
      const fallbackReply = await chatbotQueryService.generateFallbackResponse(lastUserMsg, products, brands, messages);
      const { cleanReply, recommendedProducts } = extractRecommendedProducts(fallbackReply, products);
      const totalTime = Date.now() - startTime;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: cleanReply,
          recommendedProducts,
          commercialContext,
          metrics: { catalogTimeMs: catalogTime, totalTimeMs: totalTime, fallback: true }
        })
      };
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'netlify-function-chat' }
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
   - Compare produtos entre marcas com base nas notas e categorias reais do catálogo.
   - Quando o cliente pedir sugestões para um orçamento, selecione apenas produtos cujo preço real caiba no valor estipulado.
6. **RECOMENDAÇÃO ESTRUTURADA DE PRODUTOS**:
   - Sempre que você recomendar, comparar ou citar um ou mais produtos específicos do catálogo para o cliente, inclua no FINAL absoluto da sua resposta uma linha técnica no seguinte formato exato:
     [PRODUTOS_RECOMENDADOS: id_do_produto_1, id_do_produto_2]
     (Utilize apenas os IDs reais dos produtos fornecidos no catálogo abaixo).

=== CATÁLOGO REAL DO SUPABASE (DADOS ATUAIS) ===
MARCAS PARCEIRAS ATIVAS:
${brandsFormatted}

PRODUTOS ATIVOS NO CATÁLOGO:
${productsFormatted}
`;

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

    const tGeminiStart = Date.now();
    const GEMINI_TIMEOUT_MS = 3500;

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: { systemInstruction }
    });

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), GEMINI_TIMEOUT_MS);
    });

    const result = await Promise.race([geminiPromise, timeoutPromise]);
    geminiTime = Date.now() - tGeminiStart;

    if (result && result.text) {
      const totalTime = Date.now() - startTime;
      const { cleanReply, recommendedProducts } = extractRecommendedProducts(result.text, products);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: cleanReply,
          recommendedProducts,
          commercialContext,
          metrics: { catalogTimeMs: catalogTime, geminiTimeMs: geminiTime, totalTimeMs: totalTime, fallback: false }
        })
      };
    }

    // Fallback if Gemini timeout or empty
    const fallbackReply = await chatbotQueryService.generateFallbackResponse(lastUserMsg, products, brands, messages);
    const { cleanReply, recommendedProducts } = extractRecommendedProducts(fallbackReply, products);
    const totalTime = Date.now() - startTime;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reply: cleanReply,
        recommendedProducts,
        commercialContext,
        metrics: { catalogTimeMs: catalogTime, totalTimeMs: totalTime, fallback: true, timeout: true }
      })
    };

  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Erro ao processar chat na Netlify Function',
        message: err.message
      })
    };
  }
};
