import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { chatbotQueryService } from './src/services/chatbotQueryService.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API route for Chatbot
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Formato de mensagens inválido' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Fetch real-time catalog data from Supabase / fallback storage
    const [brands, products] = await Promise.all([
      chatbotQueryService.getAvailableBrands(),
      chatbotQueryService.searchProducts({})
    ]);

    // Format real catalog snapshot for AI System Instruction
    const brandsFormatted = brands.length > 0 
      ? brands.map(b => `- ${b.name} (Categoria: ${b.category})`).join('\n')
      : 'Nenhuma marca ativa no momento.';

    const productsFormatted = products.length > 0
      ? products.map(p => 
          `- PRODUTO: "${p.name}" | Marca: ${p.brandName} | Categoria: ${p.category} | Preço Normal: R$ ${p.price.toFixed(2)}${p.promotionalPrice ? ` | Preço Promocional: R$ ${p.promotionalPrice.toFixed(2)}` : ''} | Estoque: ${p.stockQuantity} un (${p.stockStatus === 'available' ? 'Disponível' : p.stockStatus === 'low' ? 'Estoque Baixo' : 'Esgotado'}) | SKU: ${p.sku} | Descrição: ${p.description}`
        ).join('\n')
      : 'Nenhum produto ativo no momento.';

    // If GEMINI_API_KEY is not available in environment, use the intelligent algorithmic search fallback
    if (!apiKey) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
      const fallbackReply = await chatbotQueryService.generateFallbackResponse(lastUserMsg, products, brands);
      return res.json({ reply: fallbackReply });
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
1. **NUNCA INVENTE PRODUTOS, PREÇOS, CUPONS OU DADOS DE ESTOQUE**: Você deve utilizar EXCLUSIVAMENTE as informações do Catálogo Real do Supabase fornecidas abaixo.
2. **SEPARAÇÃO RÍGIDA DE CATEGORIAS (PROIBIDA A MISTURA DE CATEGORIAS)**:
   - Se o usuário pedir **PERFUMES, COLÔNIAS ou FRAGRÂNCIAS**, liste APENAS produtos da Categoria "Perfumaria". NUNCA apresente hidratantes, cremes corporais ou sabonetes (mesmo que a descrição do hidratante diga que ele possui perfume ou fragrância).
   - Se o usuário pedir **HIDRATANTES, CREMES ou LOÇÕES**, liste APENAS produtos da Categoria "Corpo e Banho". NUNCA apresente perfumes ou colônias.
   - Se o usuário pedir **BATONS ou MAQUIAGEM**, liste APENAS produtos da Categoria "Maquiagem".
3. **FILTRAGEM RÍGIDA POR MARCA**: Ao pesquisar por uma marca (ex: Natura, O Boticário, Eudora), limite as respostas estritamente a produtos cadastrados dessa marca.
4. **TRATAMENTO DE MARCAS OU PRODUTOS NÃO CADASTRADOS**: Se o usuário perguntar por uma marca inexistente no catálogo (ex: Avène, Chanel, Avon), informe claramente que não temos essa marca cadastrada no momento e liste as marcas parceiras ativas.
5. **CLARIFICAÇÃO DE PERGUNTAS AMBÍGUAS**: Se a pergunta for vaga (ex: "me indica algo bom", "o que você tem de bom?"), faça uma pergunta objetiva para esclarecer as preferências de categoria (perfumes, hidratantes corporais ou maquiagem) e marca.
6. **TOLERÂNCIA A ERROS DE DIGITAÇÃO**: Entenda variações e erros comuns (ex: "baton", "perfeume", "shampor", "sabonet").
7. **COMPARAÇÃO E RECOMENDAÇÃO**: Quando o cliente pedir comparações, apresente os dados reais em tópicos organizados, com nome do produto, preço, promoção e disponibilidade de estoque.
8. **PRODUTOS ESGOTADOS**: Se um produto estiver com estoque zerado ou esgotado, avise o cliente e sugira um produto similar disponível do catálogo.
9. **ACESSO ADMINISTRATIVO**: Se perguntarem sobre o painel admin ou login, explique que o acesso é feito pelo botão "Menu" no topo/rodapé da página pública e clicando em "Painel Administrativo".
10. **ATENDIMENTO HUMANO**: Se a solicitação exigir suporte direto, informe educadamente como solicitar ajuda da equipe humana.

=== CATÁLOGO REAL DO SUPABASE (DADOS ATUAIS) ===
MARCAS PARCEIRAS ATIVAS:
${brandsFormatted}

PRODUTOS ATIVOS NO CATÁLOGO:
${productsFormatted}
`;

    // Format chat conversation messages for Gemini API
    const formattedContents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
      }
    });

    const replyText = response.text || 'Desculpe, não consegui formatar a resposta no momento. Como posso te ajudar com nossos produtos?';
    return res.json({ reply: replyText });

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
      const fallbackReply = await chatbotQueryService.generateFallbackResponse(lastUserMsg, products, brands);
      return res.json({ reply: fallbackReply });
    } catch {
      return res.status(500).json({
        error: 'Erro temporário',
        reply: 'Desculpe, enfrentamos uma breve instabilidade no assistente virtual. Por favor, navegue diretamente por nossas vitrines ou tente novamente em alguns instantes.'
      });
    }
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
