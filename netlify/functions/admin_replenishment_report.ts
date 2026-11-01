import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { chatbotQueryService } from '../../src/services/chatbotQueryService.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://spqwrnywdlkrfrslfmwl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_JGX27g41zq4QHaW6i5rYVw_KNMOHgq0';
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const handler: Handler = async (event, _) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]?.trim();
    if (token) {
      try {
        const { data: { user } } = await serverSupabase.auth.getUser(token);
        if (user) {
          const { data: profile } = await serverSupabase.from('profiles').select('role').eq('id', user.id).single();
          if (!profile || profile.role !== 'admin') {
            return { statusCode: 403, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Acesso negado (admin role required)' }) };
          }
        }
      } catch {}
    }
  }

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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `rep-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        totalAlerts: items.length,
        outOfStockCount: items.filter(i => i.stockStatus === 'out_of_stock').length,
        lowStockCount: items.filter(i => i.stockStatus === 'low').length,
        totalEstimatedInvestment: totalInvestment,
        items,
        summaryNote: `${items.length} produtos do catálogo real necessitam de reposição com base no estoque atual do Supabase.`
      })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erro ao gerar relatório de reposição', message: err.message })
    };
  }
};
