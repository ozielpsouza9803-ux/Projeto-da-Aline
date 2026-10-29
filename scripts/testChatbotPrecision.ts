import { chatbotQueryService } from '../src/services/chatbotQueryService';

async function runPrecisionTests() {
  console.log('====================================================');
  console.log('   TESTE DE PRECISÃO DO CHATBOT OMNIBRAND AFILIADOS  ');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  // Test 1: Perfumes Query
  console.log('--- TESTE 1: Pesquisa por PERFUMES ("Quais os perfumes disponíveis?") ---');
  const resp1 = await chatbotQueryService.generateFallbackResponse('Quais os perfumes disponíveis?');
  console.log(`[Resposta]:\n${resp1}\n`);
  
  const t1HasPerfumes = resp1.includes('Kaiak') || resp1.includes('Malbec');
  const t1HasHidratantes = resp1.toLowerCase().includes('castanha') || resp1.toLowerCase().includes('lily') || resp1.toLowerCase().includes('batom');
  
  if (t1HasPerfumes && !t1HasHidratantes) {
    console.log('✅ TESTE 1 PASSOU: Retornou apenas perfumes (Kaiak/Malbec) e NENHUM hidratante/batom!\n');
    passedCount++;
  } else {
    console.log('❌ TESTE 1 FALHOU: O chatbot misturou categorias em perfumes.\n');
    failedCount++;
  }

  // Test 2: Hidratantes Query
  console.log('--- TESTE 2: Pesquisa por HIDRATANTES ("Quais os hidratantes/cremes disponíveis?") ---');
  const resp2 = await chatbotQueryService.generateFallbackResponse('Quais os hidratantes/cremes disponíveis?');
  console.log(`[Resposta]:\n${resp2}\n`);

  const t2HasHidratantes = resp2.includes('Castanha') || resp2.includes('Lily');
  const t2HasPerfumes = resp2.toLowerCase().includes('kaiak') || resp2.toLowerCase().includes('malbec') || resp2.toLowerCase().includes('batom');

  if (t2HasHidratantes && !t2HasPerfumes) {
    console.log('✅ TESTE 2 PASSOU: Retornou apenas hidratantes/cremes e NENHUM perfume/batom!\n');
    passedCount++;
  } else {
    console.log('❌ TESTE 2 FALHOU: O chatbot misturou categorias em hidratantes.\n');
    failedCount++;
  }

  // Test 3: Batom / Maquiagem Query
  console.log('--- TESTE 3: Pesquisa por BATONS ("Tem batom?") ---');
  const resp3 = await chatbotQueryService.generateFallbackResponse('Tem batom?');
  console.log(`[Resposta]:\n${resp3}\n`);

  const t3HasBatom = resp3.includes('Soul Kiss Me') || resp3.toLowerCase().includes('batom');
  const t3HasPerfumesOrBody = resp3.toLowerCase().includes('kaiak') || resp3.toLowerCase().includes('malbec') || resp3.toLowerCase().includes('castanha');

  if (t3HasBatom && !t3HasPerfumesOrBody) {
    console.log('✅ TESTE 3 PASSOU: Retornou apenas batom e NENHUM perfume/hidratante!\n');
    passedCount++;
  } else {
    console.log('❌ TESTE 3 FALHOU: O chatbot misturou categorias para batom.\n');
    failedCount++;
  }

  // Test 4: Non-existent Brand
  console.log('--- TESTE 4: Pesquisa por MARCA INEXISTENTE ("Tem produtos da Avène?") ---');
  const resp4 = await chatbotQueryService.generateFallbackResponse('Tem produtos da Avène?');
  console.log(`[Resposta]:\n${resp4}\n`);

  const t4NonExistentHandled = resp4.toLowerCase().includes('não encontr') || resp4.toLowerCase().includes('não temos');
  const t4ListsActiveBrands = resp4.includes('Natura') && resp4.includes('Boticário') && resp4.includes('Eudora');

  if (t4NonExistentHandled && t4ListsActiveBrands) {
    console.log('✅ TESTE 4 PASSOU: Identificou marca não cadastrada (Avène) e listou as marcas parceiras ativas!\n');
    passedCount++;
  } else {
    console.log('❌ TESTE 4 FALHOU: Não tratou marca inexistente corretamente.\n');
    failedCount++;
  }

  // Test 5: Ambiguous Query
  console.log('--- TESTE 5: PERGUNTA AMBÍGUA ("Me indica algo bom") ---');
  const resp5 = await chatbotQueryService.generateFallbackResponse('Me indica algo bom');
  console.log(`[Resposta]:\n${resp5}\n`);

  const t5AsksClarification = resp5.toLowerCase().includes('categoria') || resp5.toLowerCase().includes('preferência') || resp5.toLowerCase().includes('perfumaria');

  if (t5AsksClarification) {
    console.log('✅ TESTE 5 PASSOU: Respondeu pergunta ambígua solicitando esclarecimento objetivo!\n');
    passedCount++;
  } else {
    console.log('❌ TESTE 5 FALHOU: Não solicitou esclarecimento para pergunta ambígua.\n');
    failedCount++;
  }

  console.log('====================================================');
  console.log(`RESUMO DOS TESTES: ${passedCount} PASSARAM | ${failedCount} FALHARAM`);
  console.log('====================================================\n');

  process.exit(0);
}

runPrecisionTests().catch(err => {
  console.error('Erro ao executar testes:', err);
  process.exit(1);
});
