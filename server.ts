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

// API route for Chatbot
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  let catalogTime = 0;
  let geminiTime = 0;

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Formato de mensagens inválido' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Measure Catalog Fetch Time (with in-memory TTL cache)
    const tCatStart = Date.now();
    const [brands, products] = await Promise.all([
      chatbotQueryService.getAvailableBrands(),
      chatbotQueryService.searchProducts({})
    ]);
    catalogTime = Date.now() - tCatStart;

    // Format real catalog snapshot for AI System Instruction
    const brandsFormatted = brands.length > 0 
      ? brands.map(b => `- ${b.name} (Categoria: ${b.category})`).join('\n')
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

          return `- PRODUTO: "${p.name}" | Marca: ${p.brandName} | Categoria: ${p.category} | ${priceInfo} | Estoque: ${p.stockQuantity} un (${p.stockStatus === 'available' ? 'Disponível' : p.stockStatus === 'low' ? 'Estoque Baixo' : 'Esgotado'}) | SKU: ${p.sku} | Descrição: ${p.description}`;
        }).join('\n')
      : 'Nenhum produto ativo no momento.';

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';

    // 2. If GEMINI_API_KEY is not available in environment, use fast algorithmic search fallback
    if (!apiKey) {
      const fallbackReply = await chatbotQueryService.generateFallbackResponse(lastUserMsg, products, brands, messages);
      const totalTime = Date.now() - startTime;
      console.log(`[Chatbot Performance] Catalog: ${catalogTime}ms | Fallback: ${totalTime - catalogTime}ms | Total: ${totalTime}ms (No GEMINI_API_KEY)`);
      return res.json({ 
        reply: fallbackReply,
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
Você é o Assistente de Atendimento Virtual da OmniBrand Afiliados, um consultor de compras inteligente, educado, amigável e especializado em produtos de beleza, perfumaria e cosméticos (Natura, O Boticário, Eudora e marcas parceiras).

REGRAS FUNDAMENTAIS E INEGOCIÁVEIS:
1. **NUNCA INVENTE PRODUTOS, PREÇOS, CUPONS OU DADOS DE ESTOQUE**: Utilize EXCLUSIVAMENTE as informações do Catálogo Real do Supabase fornecidas abaixo.
2. **IDENTIFICAÇÃO DE PRODUTOS E BUSCA COM PALAVRAS ADICIONAIS**:
   - Quando o cliente perguntar "Qual é o preço do Kaiak?", "Quanto custa o Kaiak?", "Tem desconto no Kaiak?" ou "Quantas unidades do Kaiak estão disponíveis?", extraia a palavra-chave do produto ("Kaiak") ignorando palavras adicionais ("qual é o preço do", "tem desconto no", "quantas unidades de", "estão disponíveis").
   - Pesquise e encontre o produto correspondente ("Kaiak Desodorante Colônia Masculino" ou similar) no catálogo do Supabase.
3. **ENTENDIMENTO DE CONTEXTO E PERGUNTAS DE ACOMPANHAMENTO**:
   - Entenda e utilize todo o histórico da conversa. Se o usuário perguntou anteriormente sobre um produto ou marca (ex: "Quais perfumes vocês têm da Natura?") e depois faz uma pergunta de acompanhamento como "Qual é o preço do Kaiak?", "Tem desconto?" ou "Quantas unidades estão disponíveis?", responda com base no contexto recente do produto mencionado.
4. **INFORMAÇÃO PRECISA E CONSISTENTE DE PREÇO, PROMOÇÃO E ESTOQUE**:
   - **Formatação Monetária**: Exiba SEMPRE os preços e economias no formato brasileiro BRL, utilizando vírgula para os centavos (exemplo: R$ 119,90, R$ 149,90, R$ 30,00).
   - **Preço Atual vs Preço Normal**: Quando houver Preço Promocional cadastrado para o produto (ex: Kaiak com preço promocional de R$ 119,90 e preço normal de R$ 149,90), informe SEMPRE que o **Preço Atual (Promocional)** é **R$ 119,90** e o **Preço Normal** é **R$ 149,90**.
   - **Cálculo de Economia**: Em perguntas sobre desconto, promoção ou preço, informe explicitamente a economia de **R$ 30,00** (calculada como R$ 149,90 - R$ 119,90).
   - **Estoque**: Informe a quantidade exata de unidades em estoque e a situação (Disponível, Estoque Baixo ou Esgotado) exatamente como indicado no catálogo.
5. **SEPARAÇÃO RÍGIDA DE CATEGORIAS (PROIBIDA A MISTURA DE CATEGORIAS)**:
   - Se o usuário pedir **PERFUMES, COLÔNIAS ou FRAGRÂNCIAS**, liste APENAS produtos da Categoria "Perfumaria". NUNCA apresente hidratantes, cremes corporais ou sabonetes.
   - Se o usuário pedir **HIDRATANTES, CREMES ou LOÇÕES**, liste APENAS produtos da Categoria "Corpo e Banho". NUNCA apresente perfumes.
   - Se o usuário pedir **BATONS ou MAQUIAGEM**, liste APENAS produtos da Categoria "Maquiagem".
6. **FILTRAGEM RÍGIDA POR MARCA**: Ao pesquisar por uma marca (ex: Natura, O Boticário, Eudora), limite as respostas estritamente a produtos cadastrados dessa marca.
7. **TRATAMENTO DE MARCAS NÃO CADASTRADAS**: Se o usuário perguntar por uma marca inexistente no catálogo (ex: Avène, Chanel, Avon), informe claramente que não temos essa marca cadastrada e liste as marcas parceiras ativas.
8. **CLARIFICAÇÃO DE PERGUNTAS AMBÍGUAS**: Se a pergunta for vaga (ex: "me indica algo bom"), faça uma pergunta objetiva para esclarecer as preferências.
9. **ACESSO ADMINISTRATIVO**: Se perguntarem sobre o painel admin ou login, explique que o acesso é feito pelo botão "Menu" na página pública e clicando em "Painel Administrativo".
10. **ATENDIMENTO HUMANO**: Se a solicitação exigir suporte direto, informe educadamente como solicitar ajuda da equipe humana.

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

    // 3. Gemini API Request with 3500ms Timeout Wrapper
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
      console.log(`[Chatbot Performance] Catalog: ${catalogTime}ms | Gemini: ${geminiTime}ms | Total: ${totalTime}ms`);
      return res.json({ 
        reply: result.text,
        metrics: { catalogTimeMs: catalogTime, geminiTimeMs: geminiTime, totalTimeMs: totalTime, fallback: false }
      });
    }

    // Fast fallback if Gemini times out (>3.5s) or returns empty
    console.warn(`[Chatbot Performance] Gemini API timed out after ${geminiTime}ms or returned empty. Responding with fast fallback.`);
    const fallbackReply = await chatbotQueryService.generateFallbackResponse(lastUserMsg, products, brands, messages);
    const totalTime = Date.now() - startTime;
    return res.json({ 
      reply: fallbackReply,
      metrics: { catalogTimeMs: catalogTime, geminiTimeMs: geminiTime, totalTimeMs: totalTime, fallback: true, timeout: true }
    });

  } catch (error: any) {
    console.error('Erro na rota /api/chat:', error);

    // Fallback in case of API error or quota limit
    try {
      const { messages } = req.body;
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
      const [brands, products] = await Promise.all([
        chatbotQueryService.getAvailableBrands(),
        chatbotQueryService.searchProducts({})
      ]);
      const fallbackReply = await chatbotQueryService.generateFallbackResponse(lastUserMsg, products, brands, messages);
      const totalTime = Date.now() - startTime;
      return res.json({ 
        reply: fallbackReply,
        metrics: { catalogTimeMs: catalogTime, geminiTimeMs: geminiTime, totalTimeMs: totalTime, fallback: true, error: error.message }
      });
    } catch {
      return res.status(500).json({
        error: 'Erro temporário',
        reply: 'Desculpe, enfrentamos uma breve instabilidade no assistente virtual. Por favor, navegue diretamente por nossas vitrines ou tente novamente em alguns instantes.'
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
