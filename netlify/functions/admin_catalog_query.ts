import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { chatbotQueryService, formatBRL } from '../../src/services/chatbotQueryService.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://spqwrnywdlkrfrslfmwl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_JGX27g41zq4QHaW6i5rYVw_KNMOHgq0';
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const handler: Handler = async (event, _) => {
  if (event.httpMethod !== 'POST') {
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
    const body = event.body ? JSON.parse(event.body) : {};
    const { query = '', brandId, category } = body;
    const products = await chatbotQueryService.searchProducts({ query, brandId, category });

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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, total: formatted.length, products: formatted })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erro ao consultar catálogo', message: err.message })
    };
  }
};
