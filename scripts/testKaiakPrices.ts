import { chatbotQueryService, invalidateChatbotCatalogCache } from '../src/services/chatbotQueryService';

async function runKaiakPriceTests() {
  console.log('================================================================');
  console.log('   TESTES AUTOMATIZADOS DE CONSISTÊNCIA DE PREÇOS (KAIAK)       ');
  console.log('================================================================\n');

  // Clear cache to ensure clean test state
  invalidateChatbotCatalogCache();

  let passed = 0;
  let failed = 0;

  // Helper check for broken parenthesis
  const hasBrokenParenthesis = (str: string) => {
    return /R\$\s*[\d,.]+\)(?!\s*\()/g.test(str) && !str.includes('(Preço');
  };

  // TESTE 1: Pergunta sobre Preço
  console.log('--- TESTE 1: Pergunta direta de Preço ("Qual é o preço do Kaiak?") ---');
  const resp1 = await chatbotQueryService.generateFallbackResponse('Qual é o preço do Kaiak?');
  console.log(`[Resposta obtida]:\n${resp1}\n`);

  const t1HasCurrentPrice = resp1.includes('R$ 119,90');
  const t1HasNormalPrice = resp1.includes('R$ 149,90');
  const t1HasSavings = resp1.includes('R$ 30,00');
  const t1NotBroken = !hasBrokenParenthesis(resp1) && !resp1.includes('R$ 149,90)');

  // Strict validation: Must have R$ 119,90 as current price, R$ 149,90 as normal price, and R$ 30,00 savings
  const t1PriceCurrentExplicit = resp1.includes('Preço atual:** R$ 119,90');
  const t1PriceNormalExplicit = resp1.includes('Preço normal:** R$ 149,90');
  const t1SavingsExplicit = resp1.includes('Economia:** R$ 30,00');

  if (t1PriceCurrentExplicit && t1PriceNormalExplicit && t1SavingsExplicit && t1NotBroken) {
    console.log('PASS: TESTE 1 - Preço atual é R$ 119,90, Preço normal é R$ 149,90 e Economia é R$ 30,00 (sem saídas incompletas)!\n');
    passed++;
  } else {
    console.log(`FAIL: TESTE 1 - Falhou na validação de preços:
      - Preço atual R$ 119,90 explícito: ${t1PriceCurrentExplicit}
      - Preço normal R$ 149,90 explícito: ${t1PriceNormalExplicit}
      - Economia R$ 30,00 explícita: ${t1SavingsExplicit}
      - Saída sem caracteres quebrados: ${t1NotBroken}\n`);
    failed++;
  }

  // TESTE 2: Pergunta sobre Desconto
  console.log('--- TESTE 2: Pergunta sobre Desconto ("Tem desconto no Kaiak?") ---');
  const resp2 = await chatbotQueryService.generateFallbackResponse('Tem desconto no Kaiak?');
  console.log(`[Resposta obtida]:\n${resp2}\n`);

  const t2HasCurrentPrice = resp2.includes('R$ 119,90');
  const t2HasNormalPrice = resp2.includes('R$ 149,90');
  const t2HasSavings = resp2.includes('R$ 30,00');
  const t2HasPromo = resp2.toLowerCase().includes('promocional') || resp2.toLowerCase().includes('desconto');

  if (t2HasCurrentPrice && t2HasNormalPrice && t2HasSavings && t2HasPromo) {
    console.log('PASS: TESTE 2 - Desconto do Kaiak validado: Preço atual R$ 119,90, Normal R$ 149,90 e Economia R$ 30,00!\n');
    passed++;
  } else {
    console.log(`FAIL: TESTE 2 - Falhou na validação do desconto:
      - Preço atual R$ 119,90: ${t2HasCurrentPrice}
      - Preço normal R$ 149,90: ${t2HasNormalPrice}
      - Economia R$ 30,00: ${t2HasSavings}\n`);
    failed++;
  }

  // TESTE 3: Pergunta sobre Estoque
  console.log('--- TESTE 3: Pergunta sobre Estoque ("Quantas unidades do Kaiak estão disponíveis?") ---');
  const resp3 = await chatbotQueryService.generateFallbackResponse('Quantas unidades do Kaiak estão disponíveis?');
  console.log(`[Resposta obtida]:\n${resp3}\n`);

  const t3HasUnits = resp3.includes('3 unidades') || resp3.includes('3 un');
  const t3HasCurrentPrice = resp3.includes('R$ 119,90');
  const t3HasNormalPrice = resp3.includes('R$ 149,90');
  const t3HasSavings = resp3.includes('R$ 30,00');
  const t3NotBroken = !resp3.includes('R$ 149,90)');

  if (t3HasUnits && t3HasCurrentPrice && t3HasNormalPrice && t3HasSavings && t3NotBroken) {
    console.log('PASS: TESTE 3 - Estoque (3 unidades) e preços (R$ 119,90 atual / R$ 149,90 normal / R$ 30,00 economia) validados!\n');
    passed++;
  } else {
    console.log(`FAIL: TESTE 3 - Falhou no estoque ou preços:
      - 3 unidades encontradas: ${t3HasUnits}
      - Preço atual R$ 119,90: ${t3HasCurrentPrice}
      - Preço normal R$ 149,90: ${t3HasNormalPrice}
      - Economia R$ 30,00: ${t3HasSavings}\n`);
    failed++;
  }

  // TESTE 4: Pesquisa por Marca / Perfumes da Natura
  console.log('--- TESTE 4: Pesquisa por Marca ("Quais perfumes vocês têm da Natura?") ---');
  const resp4 = await chatbotQueryService.generateFallbackResponse('Quais perfumes vocês têm da Natura?');
  console.log(`[Resposta obtida]:\n${resp4}\n`);

  const t4HasKaiak = resp4.includes('Kaiak');
  const t4HasCurrentPrice = resp4.includes('R$ 119,90');
  const t4HasNormalPrice = resp4.includes('R$ 149,90');
  const t4HasSavings = resp4.includes('R$ 30,00');
  const t4NotBroken = !resp4.includes('R$ 149,90)');
  const t4NoHidratantes = !resp4.toLowerCase().includes('castanha') && !resp4.toLowerCase().includes('batom');

  if (t4HasKaiak && t4HasCurrentPrice && t4HasNormalPrice && t4HasSavings && t4NotBroken && t4NoHidratantes) {
    console.log('PASS: TESTE 4 - Catálogo Natura retornou Kaiak com Preço atual R$ 119,90, Normal R$ 149,90, Economia R$ 30,00 e sem mistura de categorias!\n');
    passed++;
  } else {
    console.log(`FAIL: TESTE 4 - Falhou na pesquisa por marca Natura:
      - Contém Kaiak: ${t4HasKaiak}
      - Preço atual R$ 119,90: ${t4HasCurrentPrice}
      - Preço normal R$ 149,90: ${t4HasNormalPrice}
      - Economia R$ 30,00: ${t4HasSavings}
      - Sem mistura de categorias: ${t4NoHidratantes}\n`);
    failed++;
  }

  // TESTE 5: Verificação via HTTP na rota POST /api/chat
  console.log('--- TESTE 5: Rota da API POST /api/chat ("Qual é o preço do Kaiak?") ---');
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Qual é o preço do Kaiak?' }]
      })
    });

    if (!res.ok) {
      throw new Error(`Status HTTP ${res.status}`);
    }

    const data: any = await res.json();
    const reply = data.reply || '';
    console.log(`[Resposta da rota /api/chat]:\n${reply}\n`);

    const t5HasCurrentPrice = reply.includes('R$ 119,90') || reply.includes('119,90');
    const t5HasNormalPrice = reply.includes('R$ 149,90') || reply.includes('149,90');
    const t5HasSavings = reply.includes('R$ 30,00') || reply.includes('30,00');
    const t5NotBroken = !reply.includes('R$ 149,90)');

    if (t5HasCurrentPrice && t5HasNormalPrice && t5HasSavings && t5NotBroken) {
      console.log('PASS: TESTE 5 - Resposta da API /api/chat validada com sucesso com R$ 119,90, R$ 149,90 e R$ 30,00!\n');
      passed++;
    } else {
      console.log(`FAIL: TESTE 5 - Resposta da API /api/chat com valores incorretos:
        - Preço atual 119,90: ${t5HasCurrentPrice}
        - Preço normal 149,90: ${t5HasNormalPrice}
        - Economia 30,00: ${t5HasSavings}\n`);
      failed++;
    }
  } catch (err: any) {
    console.log(`FAIL: TESTE 5 - Erro ao chamar /api/chat: ${err.message}\n`);
    failed++;
  }

  console.log('================================================================');
  console.log(`   TOTAL DE TESTES EXECUTADOS: ${passed + failed}`);
  console.log(`   RESULTADOS: ${passed} PASS | ${failed} FAIL`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runKaiakPriceTests().catch(err => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});
