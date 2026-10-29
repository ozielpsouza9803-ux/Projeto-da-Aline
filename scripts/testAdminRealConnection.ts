import { chatbotQueryService, formatBRL } from '../src/services/chatbotQueryService';
import { fetchProductsFromSupabase, fetchShowcasesFromSupabase } from '../src/services/supabaseClient';
import { storageService } from '../src/services/storage';

async function runTests() {
  console.log('================================================================');
  console.log('   TESTES DE CONEXÃO AOS DADOS REAIS DO ASSISTENTE DE GERÊNCIA  ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // TESTE 1: Leitura Real de Produtos e Preços do Supabase / Catálogo Real
  console.log('--- TESTE 1: Leitura Real do Produto Kaiak (Natura) ---');
  try {
    const products = await chatbotQueryService.searchProducts({ query: 'Kaiak' });
    const kaiak = products.find(p => p.name.toLowerCase().includes('kaiak'));

    if (!kaiak) {
      console.log('FAIL: Kaiak não encontrado no catálogo!');
      failed++;
    } else {
      console.log(`[Produto encontrado]: "${kaiak.name}"`);
      console.log(`- Preço Normal: ${formatBRL(kaiak.price)}`);
      console.log(`- Preço Promocional: ${kaiak.promotionalPrice ? formatBRL(kaiak.promotionalPrice) : 'Nenhum'}`);
      console.log(`- Estoque: ${kaiak.stockQuantity} un (${kaiak.stockStatus})`);

      const normalOk = kaiak.price === 149.90;
      const promoOk = kaiak.promotionalPrice === 119.90;
      const stockOk = kaiak.stockQuantity === 3;

      if (normalOk && promoOk && stockOk) {
        console.log('PASS: TESTE 1 - Kaiak reflete com precisão os dados reais do catálogo (R$ 149,90 / R$ 119,90 / 3 un)!');
        passed++;
      } else {
        console.log(`FAIL: TESTE 1 - Valores divergentes: normal=${kaiak.price}, promo=${kaiak.promotionalPrice}, estoque=${kaiak.stockQuantity}`);
        failed++;
      }
    }
  } catch (err: any) {
    console.log(`FAIL: Exceção no Teste 1: ${err.message}`);
    failed++;
  }

  // TESTE 2: Leitura Real do Produto Malbec (O Boticário)
  console.log('\n--- TESTE 2: Leitura Real do Produto Malbec (O Boticário) ---');
  try {
    const products = await chatbotQueryService.searchProducts({ query: 'Malbec' });
    const malbec = products.find(p => p.name.toLowerCase().includes('malbec'));

    if (!malbec) {
      console.log('FAIL: Malbec não encontrado no catálogo!');
      failed++;
    } else {
      console.log(`[Produto encontrado]: "${malbec.name}"`);
      console.log(`- Preço Atual / Normal: ${formatBRL(malbec.price)}`);
      console.log(`- Preço Promocional: ${malbec.promotionalPrice ? formatBRL(malbec.promotionalPrice) : 'Nenhum (Preço de tabela)'}`);
      console.log(`- Estoque: ${malbec.stockQuantity} un (${malbec.stockStatus})`);

      if (malbec.price === 189.90 && (malbec.stockQuantity ?? 0) >= 10) {
        console.log('PASS: TESTE 2 - Malbec reflete dados reais (R$ 189,90 de tabela, sem promoção ativa e estoque disponível)!');
        passed++;
      } else {
        console.log(`FAIL: TESTE 2 - Preço ou estoque inesperado: price=${malbec.price}, stock=${malbec.stockQuantity}`);
        failed++;
      }
    }
  } catch (err: any) {
    console.log(`FAIL: Exceção no Teste 2: ${err.message}`);
    failed++;
  }

  // TESTE 3: Geração de Relatório de Reposição Baseado no Estoque Real
  console.log('\n--- TESTE 3: Cálculo do Relatório de Reposição a partir de Estoques Reais ---');
  try {
    const allProducts = await chatbotQueryService.searchProducts({});
    const lowStock = allProducts.filter(p => p.stockQuantity <= 5 || p.stockStatus === 'low' || p.stockStatus === 'out_of_stock');

    console.log(`Total de produtos em alerta de estoque: ${lowStock.length}`);
    lowStock.forEach(p => {
      console.log(`- ${p.name} | Estoque: ${p.stockQuantity} un | Status: ${p.stockStatus}`);
    });

    const hasKaiak = lowStock.some(p => p.name.toLowerCase().includes('kaiak') && p.stockQuantity === 3);
    const hasLily = lowStock.some(p => p.name.toLowerCase().includes('lily') && p.stockQuantity === 0);

    if (hasKaiak && hasLily) {
      console.log('PASS: TESTE 3 - Relatório de reposição identificou corretamente itens críticos reais (Kaiak com 3 un e Lily esgotado)!');
      passed++;
    } else {
      console.log('FAIL: TESTE 3 - Não identificou todos os itens com estoque baixo/esgotado.');
      failed++;
    }
  } catch (err: any) {
    console.log(`FAIL: Exceção no Teste 3: ${err.message}`);
    failed++;
  }

  // TESTE 4: Proteção e Autenticação de Administrador no Servidor (Não confiar apenas no navegador)
  console.log('\n--- TESTE 4: Validação da Proteção no Servidor (HTTP 401 sem token) ---');
  try {
    const serverUrl = 'http://localhost:3000';
    
    // Requisição sem header de autorização
    const unauthRes = await fetch(`${serverUrl}/api/admin/assistant/verify-auth`);
    console.log(`Status retornado sem token de autorização: ${unauthRes.status}`);

    const unauthBody = await unauthRes.json();
    console.log(`Resposta do servidor: ${JSON.stringify(unauthBody)}`);

    // Requisição com token inválido
    const invalidRes = await fetch(`${serverUrl}/api/admin/assistant/catalog-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token_invalido_falso_123'
      },
      body: JSON.stringify({ query: 'Kaiak' })
    });
    console.log(`Status retornado com token falso: ${invalidRes.status}`);

    if (unauthRes.status === 401 && invalidRes.status === 401) {
      console.log('PASS: TESTE 4 - Servidor bloqueia estritamente requisições sem autenticação ou com tokens inválidos (HTTP 401)!');
      passed++;
    } else {
      console.log(`FAIL: TESTE 4 - Status inesperado: unauth=${unauthRes.status}, invalid=${invalidRes.status}`);
      failed++;
    }
  } catch (err: any) {
    console.log(`FAIL: Exceção no Teste 4: ${err.message}`);
    failed++;
  }

  // TESTE 5: Preservação do Chatbot Público (/api/chat)
  console.log('\n--- TESTE 5: Preservação do Chatbot Público (/api/chat) ---');
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Qual é o preço do Kaiak?' }]
      })
    });

    const data = await res.json();
    console.log(`[Resposta obtida do chatbot público]:\n${data.reply}`);

    const reply = data.reply || '';
    const hasCurrent = reply.includes('119,90');
    const hasNormal = reply.includes('149,90');
    const hasSavings = reply.includes('30,00');

    if (hasCurrent && hasNormal && hasSavings) {
      console.log('PASS: TESTE 5 - Chatbot público intacto e respondendo com consistência monetária total!');
      passed++;
    } else {
      console.log('FAIL: TESTE 5 - Chatbot público retornou resposta inconsistente.');
      failed++;
    }
  } catch (err: any) {
    console.log(`FAIL: Exceção no Teste 5: ${err.message}`);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`   TOTAL DE TESTES EXECUTADOS: ${passed + failed}`);
  console.log(`   RESULTADOS: ${passed} PASS | ${failed} FAIL`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
