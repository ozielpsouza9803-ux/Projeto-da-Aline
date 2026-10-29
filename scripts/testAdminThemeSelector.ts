import { 
  adminThemeService, 
  ADMIN_THEMES, 
  ADMIN_ACCENTS, 
  DEFAULT_ADMIN_THEME, 
  AdminThemeId, 
  AdminAccentId 
} from '../src/services/adminThemeService';

async function runThemeTests() {
  console.log('================================================================');
  console.log('   TESTES AUTOMATIZADOS DO SELETOR DE APARÊNCIA DO OMNIBRAND    ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // TESTE 1: Configuração Inicial Padrão (Azul-marinho, Dourado, Escuro)
  console.log('--- TESTE 1: Validação do Tema Inicial Padrão ---');
  console.log(`- Tema Padrão: ${DEFAULT_ADMIN_THEME.themeId}`);
  console.log(`- Destaque Padrão: ${DEFAULT_ADMIN_THEME.accentId}`);
  console.log(`- Modo Padrão: ${DEFAULT_ADMIN_THEME.mode}`);

  if (
    DEFAULT_ADMIN_THEME.themeId === 'azul-marinho' &&
    DEFAULT_ADMIN_THEME.accentId === 'dourado' &&
    DEFAULT_ADMIN_THEME.mode === 'dark'
  ) {
    console.log('PASS: TESTE 1 - Tema inicial é exatamente Azul-marinho, Dourado e Modo escuro!');
    passed++;
  } else {
    console.log('FAIL: TESTE 1 - Configuração inicial divergente.');
    failed++;
  }

  // TESTE 2: Existência dos 6 Temas Exigidos
  console.log('\n--- TESTE 2: Validação dos 6 Temas Visuais ---');
  const requiredThemes: { id: AdminThemeId; name: string }[] = [
    { id: 'azul-marinho', name: 'Azul-marinho' },
    { id: 'grafite', name: 'Grafite' },
    { id: 'roxo', name: 'Roxo' },
    { id: 'verde-esmeralda', name: 'Verde-esmeralda' },
    { id: 'vinho', name: 'Vinho' },
    { id: 'azul-moderno', name: 'Azul moderno' }
  ];

  let themesOk = true;
  for (const t of requiredThemes) {
    const found = ADMIN_THEMES[t.id];
    if (!found || found.name !== t.name) {
      console.log(`FAIL: Tema ${t.name} não encontrado ou nome divergente!`);
      themesOk = false;
    } else {
      console.log(`- Tema "${found.name}": Dark Bg = ${found.dark.bg}, Light Bg = ${found.light.bg}`);
    }
  }

  if (themesOk && Object.keys(ADMIN_THEMES).length === 6) {
    console.log('PASS: TESTE 2 - Todos os 6 temas exigidos estão cadastrados e configurados!');
    passed++;
  } else {
    console.log('FAIL: TESTE 2 - Número ou nomes de temas incorretos.');
    failed++;
  }

  // TESTE 3: Existência das 6 Cores de Destaque Exigidas
  console.log('\n--- TESTE 3: Validação das 6 Cores de Destaque ---');
  const requiredAccents: { id: AdminAccentId; name: string }[] = [
    { id: 'dourado', name: 'Dourado' },
    { id: 'ciano', name: 'Ciano' },
    { id: 'lilas', name: 'Lilás' },
    { id: 'verde', name: 'Verde' },
    { id: 'rosa', name: 'Rosa' },
    { id: 'laranja', name: 'Laranja' }
  ];

  let accentsOk = true;
  for (const a of requiredAccents) {
    const found = ADMIN_ACCENTS[a.id];
    if (!found || found.name !== a.name) {
      console.log(`FAIL: Destaque ${a.name} não encontrado ou nome divergente!`);
      accentsOk = false;
    } else {
      console.log(`- Destaque "${found.name}": Hex = ${found.colorHex}`);
    }
  }

  if (accentsOk && Object.keys(ADMIN_ACCENTS).length === 6) {
    console.log('PASS: TESTE 3 - Todas as 6 cores de destaque exigidas estão cadastradas e configuradas!');
    passed++;
  } else {
    console.log('FAIL: TESTE 3 - Número ou nomes de destaques incorretos.');
    failed++;
  }

  // TESTE 4: Validação dos Modos Claro e Escuro e Geração de Estilos CSS
  console.log('\n--- TESTE 4: Geração de Estilos CSS para Modos Claro e Escuro ---');
  const darkStyles = adminThemeService.getStyles({ themeId: 'azul-marinho', accentId: 'dourado', mode: 'dark' });
  const lightStyles = adminThemeService.getStyles({ themeId: 'azul-marinho', accentId: 'dourado', mode: 'light' });

  console.log(`- Dark Background: ${(darkStyles as any)['--admin-bg']}`);
  console.log(`- Light Background: ${(lightStyles as any)['--admin-bg']}`);
  console.log(`- Accent Hex: ${(darkStyles as any)['--admin-accent']}`);

  if (
    (darkStyles as any)['--admin-bg'] !== (lightStyles as any)['--admin-bg'] &&
    (darkStyles as any)['--admin-accent'] === '#f59e0b' &&
    (lightStyles as any)['--admin-accent'] === '#f59e0b'
  ) {
    console.log('PASS: TESTE 4 - Modos claro e escuro alternam variáveis de fundo e preservam cor de destaque!');
    passed++;
  } else {
    console.log('FAIL: TESTE 4 - Falha na geração das variáveis de estilo do modo claro/escuro.');
    failed++;
  }

  // TESTE 5: Preservação do Chatbot e Rotas Existentes
  console.log('\n--- TESTE 5: Preservação da Rota de Chatbot (/api/chat) ---');
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Qual é o preço do Kaiak?' }]
      })
    });
    const data = await res.json();
    const reply = data.reply || '';
    if (reply.includes('119,90') && reply.includes('149,90')) {
      console.log('PASS: TESTE 5 - Chatbot público intacto e respondendo perfeitamente!');
      passed++;
    } else {
      console.log('FAIL: TESTE 5 - Resposta inesperada do chatbot público.');
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

  if (failed > 0) process.exit(1);
}

runThemeTests();
