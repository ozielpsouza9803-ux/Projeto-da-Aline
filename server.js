import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { chatbotQueryService, formatBRL } from "./src/services/chatbotQueryService.js";
dotenv.config();
const app = express();
const port = process.env.PORT || 3e3;
app.use(express.json());
app.post("/api/chat", async (req, res) => {
  const startTime = Date.now();
  let catalogTime = 0;
  let geminiTime = 0;
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Formato de mensagens inv\xE1lido" });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    const tCatStart = Date.now();
    const [brands, products] = await Promise.all([
      chatbotQueryService.getAvailableBrands(),
      chatbotQueryService.searchProducts({})
    ]);
    catalogTime = Date.now() - tCatStart;
    const brandsFormatted = brands.length > 0 ? brands.map((b) => `- ${b.name} (Categoria: ${b.category})`).join("\n") : "Nenhuma marca ativa no momento.";
    const productsFormatted = products.length > 0 ? products.map((p) => {
      const hasDiscount = p.promotionalPrice !== void 0 && p.promotionalPrice !== null && p.promotionalPrice < p.price;
      const normalFormatted = formatBRL(p.price);
      const currentFormatted = formatBRL(hasDiscount ? p.promotionalPrice : p.price);
      const savingsFormatted = hasDiscount ? formatBRL(p.price - p.promotionalPrice) : null;
      const priceInfo = hasDiscount ? `Pre\xE7o Atual: ${currentFormatted} (Pre\xE7o Promocional) | Pre\xE7o Normal: ${normalFormatted} | Economia: ${savingsFormatted}` : `Pre\xE7o Atual: ${normalFormatted}`;
      return `- PRODUTO: "${p.name}" | Marca: ${p.brandName} | Categoria: ${p.category} | ${priceInfo} | Estoque: ${p.stockQuantity} un (${p.stockStatus === "available" ? "Dispon\xEDvel" : p.stockStatus === "low" ? "Estoque Baixo" : "Esgotado"}) | SKU: ${p.sku} | Descri\xE7\xE3o: ${p.description}`;
    }).join("\n") : "Nenhum produto ativo no momento.";
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    if (!apiKey) {
      const fallbackReply2 = await chatbotQueryService.generateFallbackResponse(lastUserMsg, products, brands, messages);
      const totalTime2 = Date.now() - startTime;
      console.log(`[Chatbot Performance] Catalog: ${catalogTime}ms | Fallback: ${totalTime2 - catalogTime}ms | Total: ${totalTime2}ms (No GEMINI_API_KEY)`);
      return res.json({
        reply: fallbackReply2,
        metrics: { catalogTimeMs: catalogTime, totalTimeMs: totalTime2, fallback: true }
      });
    }
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const systemInstruction = `
Voc\xEA \xE9 o Assistente de Atendimento Virtual da OmniBrand Afiliados, um consultor de compras inteligente, educado, amig\xE1vel e especializado em produtos de beleza, perfumaria e cosm\xE9ticos (Natura, O Botic\xE1rio, Eudora e marcas parceiras).

REGRAS FUNDAMENTAIS E INEGOCI\xC1VEIS:
1. **NUNCA INVENTE PRODUTOS, PRE\xC7OS, CUPONS OU DADOS DE ESTOQUE**: Utilize EXCLUSIVAMENTE as informa\xE7\xF5es do Cat\xE1logo Real do Supabase fornecidas abaixo.
2. **IDENTIFICA\xC7\xC3O DE PRODUTOS E BUSCA COM PALAVRAS ADICIONAIS**:
   - Quando o cliente perguntar "Qual \xE9 o pre\xE7o do Kaiak?", "Quanto custa o Kaiak?", "Tem desconto no Kaiak?" ou "Quantas unidades do Kaiak est\xE3o dispon\xEDveis?", extraia a palavra-chave do produto ("Kaiak") ignorando palavras adicionais ("qual \xE9 o pre\xE7o do", "tem desconto no", "quantas unidades de", "est\xE3o dispon\xEDveis").
   - Pesquise e encontre o produto correspondente ("Kaiak Desodorante Col\xF4nia Masculino" ou similar) no cat\xE1logo do Supabase.
3. **ENTENDIMENTO DE CONTEXTO E PERGUNTAS DE ACOMPANHAMENTO**:
   - Entenda e utilize todo o hist\xF3rico da conversa. Se o usu\xE1rio perguntou anteriormente sobre um produto ou marca (ex: "Quais perfumes voc\xEAs t\xEAm da Natura?") e depois faz uma pergunta de acompanhamento como "Qual \xE9 o pre\xE7o do Kaiak?", "Tem desconto?" ou "Quantas unidades est\xE3o dispon\xEDveis?", responda com base no contexto recente do produto mencionado.
4. **INFORMA\xC7\xC3O PRECISA E CONSISTENTE DE PRE\xC7O, PROMO\xC7\xC3O E ESTOQUE**:
   - **Formata\xE7\xE3o Monet\xE1ria**: Exiba SEMPRE os pre\xE7os e economias no formato brasileiro BRL, utilizando v\xEDrgula para os centavos (exemplo: R$ 119,90, R$ 149,90, R$ 30,00).
   - **Pre\xE7o Atual vs Pre\xE7o Normal**: Quando houver Pre\xE7o Promocional cadastrado para o produto (ex: Kaiak com pre\xE7o promocional de R$ 119,90 e pre\xE7o normal de R$ 149,90), informe SEMPRE que o **Pre\xE7o Atual (Promocional)** \xE9 **R$ 119,90** e o **Pre\xE7o Normal** \xE9 **R$ 149,90**.
   - **C\xE1lculo de Economia**: Em perguntas sobre desconto, promo\xE7\xE3o ou pre\xE7o, informe explicitamente a economia de **R$ 30,00** (calculada como R$ 149,90 - R$ 119,90).
   - **Estoque**: Informe a quantidade exata de unidades em estoque e a situa\xE7\xE3o (Dispon\xEDvel, Estoque Baixo ou Esgotado) exatamente como indicado no cat\xE1logo.
5. **SEPARA\xC7\xC3O R\xCDGIDA DE CATEGORIAS (PROIBIDA A MISTURA DE CATEGORIAS)**:
   - Se o usu\xE1rio pedir **PERFUMES, COL\xD4NIAS ou FRAGR\xC2NCIAS**, liste APENAS produtos da Categoria "Perfumaria". NUNCA apresente hidratantes, cremes corporais ou sabonetes.
   - Se o usu\xE1rio pedir **HIDRATANTES, CREMES ou LO\xC7\xD5ES**, liste APENAS produtos da Categoria "Corpo e Banho". NUNCA apresente perfumes.
   - Se o usu\xE1rio pedir **BATONS ou MAQUIAGEM**, liste APENAS produtos da Categoria "Maquiagem".
6. **FILTRAGEM R\xCDGIDA POR MARCA**: Ao pesquisar por uma marca (ex: Natura, O Botic\xE1rio, Eudora), limite as respostas estritamente a produtos cadastrados dessa marca.
7. **TRATAMENTO DE MARCAS N\xC3O CADASTRADAS**: Se o usu\xE1rio perguntar por uma marca inexistente no cat\xE1logo (ex: Av\xE8ne, Chanel, Avon), informe claramente que n\xE3o temos essa marca cadastrada e liste as marcas parceiras ativas.
8. **CLARIFICA\xC7\xC3O DE PERGUNTAS AMB\xCDGUAS**: Se a pergunta for vaga (ex: "me indica algo bom"), fa\xE7a uma pergunta objetiva para esclarecer as prefer\xEAncias.
9. **ACESSO ADMINISTRATIVO**: Se perguntarem sobre o painel admin ou login, explique que o acesso \xE9 feito pelo bot\xE3o "Menu" na p\xE1gina p\xFAblica e clicando em "Painel Administrativo".
10. **ATENDIMENTO HUMANO**: Se a solicita\xE7\xE3o exigir suporte direto, informe educadamente como solicitar ajuda da equipe humana.

=== CAT\xC1LOGO REAL DO SUPABASE (DADOS ATUAIS) ===
MARCAS PARCEIRAS ATIVAS:
${brandsFormatted}

PRODUTOS ATIVOS NO CAT\xC1LOGO:
${productsFormatted}
`;
    const formattedContents = [];
    for (const m of messages) {
      const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
      const content = m.content || "";
      if (!content.trim()) continue;
      if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
        formattedContents[formattedContents.length - 1].parts[0].text += `
${content}`;
      } else {
        formattedContents.push({ role, parts: [{ text: content }] });
      }
    }
    const tGeminiStart = Date.now();
    const GEMINI_TIMEOUT_MS = 3500;
    const geminiPromise = ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: formattedContents,
      config: {
        systemInstruction
      }
    });
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve(null), GEMINI_TIMEOUT_MS);
    });
    const result = await Promise.race([geminiPromise, timeoutPromise]);
    geminiTime = Date.now() - tGeminiStart;
    if (result && result.text) {
      const totalTime2 = Date.now() - startTime;
      console.log(`[Chatbot Performance] Catalog: ${catalogTime}ms | Gemini: ${geminiTime}ms | Total: ${totalTime2}ms`);
      return res.json({
        reply: result.text,
        metrics: { catalogTimeMs: catalogTime, geminiTimeMs: geminiTime, totalTimeMs: totalTime2, fallback: false }
      });
    }
    console.warn(`[Chatbot Performance] Gemini API timed out after ${geminiTime}ms or returned empty. Responding with fast fallback.`);
    const fallbackReply = await chatbotQueryService.generateFallbackResponse(lastUserMsg, products, brands, messages);
    const totalTime = Date.now() - startTime;
    return res.json({
      reply: fallbackReply,
      metrics: { catalogTimeMs: catalogTime, geminiTimeMs: geminiTime, totalTimeMs: totalTime, fallback: true, timeout: true }
    });
  } catch (error) {
    console.error("Erro na rota /api/chat:", error);
    try {
      const { messages } = req.body;
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
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
        error: "Erro tempor\xE1rio",
        reply: "Desculpe, enfrentamos uma breve instabilidade no assistente virtual. Por favor, navegue diretamente por nossas vitrines ou tente novamente em alguns instantes."
      });
    }
  }
});
const SUPABASE_URL = process.env.SUPABASE_URL || "https://spqwrnywdlkrfrslfmwl.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_JGX27g41zq4QHaW6i5rYVw_KNMOHgq0";
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
async function verifyServerAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "N\xE3o autorizado",
      message: "Token de administrador ausente no cabe\xE7alho Authorization."
    });
  }
  const token = authHeader.split(" ")[1]?.trim();
  if (!token) {
    return res.status(401).json({
      error: "N\xE3o autorizado",
      message: "Token de autoriza\xE7\xE3o vazio ou malformatado."
    });
  }
  try {
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        error: "Sess\xE3o inv\xE1lida ou expirada",
        message: "O token fornecido n\xE3o foi validado pelo Supabase Auth ou expirou."
      });
    }
    const { data: profile, error: profileError } = await serverSupabase.from("profiles").select("id, role").eq("id", user.id).single();
    if (profileError || !profile || profile.role !== "admin") {
      return res.status(403).json({
        error: "Acesso negado",
        message: "Usu\xE1rio autenticado n\xE3o possui privil\xE9gios de administrador (role admin)."
      });
    }
    req.adminUser = user;
    req.adminProfile = profile;
    next();
  } catch (err) {
    return res.status(500).json({
      error: "Erro na verifica\xE7\xE3o de autentica\xE7\xE3o",
      message: err.message || "Falha ao validar privil\xE9gios de administrador no servidor."
    });
  }
}
app.get("/api/admin/assistant/verify-auth", verifyServerAdminAuth, (req, res) => {
  const user = req.adminUser;
  return res.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      role: "admin"
    }
  });
});
app.post("/api/admin/assistant/catalog-query", verifyServerAdminAuth, async (req, res) => {
  try {
    const { query = "", brandId, category } = req.body;
    const products = await chatbotQueryService.searchProducts({ query, brandId, category });
    const formatted = products.map((p) => {
      const hasDiscount = p.promotionalPrice !== void 0 && p.promotionalPrice !== null && p.promotionalPrice < p.price;
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
        promotionalPriceFormatted: hasDiscount ? formatBRL(p.promotionalPrice) : null,
        savingsFormatted: hasDiscount ? formatBRL(p.price - p.promotionalPrice) : null,
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
  } catch (err) {
    return res.status(500).json({
      error: "Erro ao consultar cat\xE1logo",
      message: err.message
    });
  }
});
app.post("/api/admin/assistant/replenishment-report", verifyServerAdminAuth, async (_req, res) => {
  try {
    const products = await chatbotQueryService.searchProducts({});
    const lowStockItems = products.filter((p) => p.stockQuantity <= 5 || p.stockStatus === "low" || p.stockStatus === "out_of_stock");
    let totalInvestment = 0;
    const items = lowStockItems.map((p) => {
      const isOut = p.stockQuantity === 0 || p.stockStatus === "out_of_stock";
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
        alertReason: isOut ? "Produto esgotado. Afiliados est\xE3o gerando tr\xE1fego para p\xE1gina sem estoque." : `Estoque em n\xEDvel cr\xEDtico (${p.stockQuantity} un restantes). Abaixo do limite de seguran\xE7a de 5 un.`,
        priority: isOut ? "critica" : "alta"
      };
    });
    return res.json({
      id: `rep-${Date.now()}`,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      totalAlerts: items.length,
      outOfStockCount: items.filter((i) => i.stockStatus === "out_of_stock").length,
      lowStockCount: items.filter((i) => i.stockStatus === "low").length,
      totalEstimatedInvestment: totalInvestment,
      items,
      summaryNote: `${items.length} produtos do cat\xE1logo real necessitam de reposi\xE7\xE3o com base no estoque atual do Supabase.`
    });
  } catch (err) {
    return res.status(500).json({
      error: "Erro ao gerar relat\xF3rio de reposi\xE7\xE3o",
      message: err.message
    });
  }
});
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
  app.get("*", (_req, res) => {
    res.sendFile("dist/index.html", { root: "." });
  });
}
app.listen(port, () => {
  console.log(`[OmniBrand Server] Executando em http://0.0.0.0:${port}`);
});
