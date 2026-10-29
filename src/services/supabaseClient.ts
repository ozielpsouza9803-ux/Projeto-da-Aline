import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Showcase, Product, Banner, ClickRecord, CommissionRecord } from '../types';
import { generateUUID } from '../utils/uuid';

export const SUPABASE_URL = 'https://spqwrnywdlkrfrslfmwl.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_JGX27g41zq4QHaW6i5rYVw_KNMOHgq0';
export const STORAGE_BUCKET = 'storefront-media';

// Direct Singleton Client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export const getSupabaseClient = (): SupabaseClient => supabase;

// Detailed Table Connection Verification Helper for all 6 tables
export interface TableConnectionResult {
  tableName: string;
  status: 'APPROVED' | 'FAILED' | 'UNVERIFIED';
  count: number;
  message: string;
}

export const testAllSupabaseTables = async (): Promise<{
  allPassed: boolean;
  tables: TableConnectionResult[];
  message: string;
}> => {
  const tableNames = ['profiles', 'brands', 'products', 'product_images', 'banners', 'affiliate_clicks'];
  const results: TableConnectionResult[] = [];

  for (const table of tableNames) {
    try {
      const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
      if (error) {
        results.push({
          tableName: table,
          status: 'FAILED',
          count: 0,
          message: `Erro ao consultar tabela '${table}': ${error.message} (Código ${error.code || 'N/A'})`
        });
      } else {
        results.push({
          tableName: table,
          status: 'APPROVED',
          count: count || 0,
          message: `Conexão bem-sucedida. ${count || 0} registros encontrados.`
        });
      }
    } catch (err: any) {
      results.push({
        tableName: table,
        status: 'FAILED',
        count: 0,
        message: `Exceção ao conectar à tabela '${table}': ${err.message || err}`
      });
    }
  }

  const allPassed = results.every(r => r.status === 'APPROVED');
  return {
    allPassed,
    tables: results,
    message: allPassed 
      ? 'Todas as 6 tabelas (profiles, brands, products, product_images, banners, affiliate_clicks) estão 100% conectadas e operacionais no Supabase!'
      : 'Algumas tabelas apresentaram problemas de conexão ou RLS.'
  };
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const res = await testAllSupabaseTables();
  return {
    success: res.allPassed,
    message: res.message
  };
};

// ==========================================
// SUPABASE AUTH & ADMIN ROLE HELPERS
// ==========================================
export const signInAdmin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUpAdmin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signOutAdmin = async () => {
  localStorage.removeItem('omnibrand_local_admin_session');
  try {
    const { error } = await supabase.auth.signOut();
    if (error) console.warn('Supabase signout note:', error.message);
  } catch {}
};

export const resetAdminPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  });
  if (error) throw error;
  return data;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const checkIsAdminRole = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (error || !data) return false;
    return data.role === 'admin';
  } catch {
    return false;
  }
};

// ==========================================
// STORAGE UPLOAD HELPER ("storefront-media")
// ==========================================
export const uploadMediaToSupabase = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const mimeType = file.type || (fileExt === 'png' ? 'image/png' : 'image/jpeg');
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${Date.now()}_${cleanFileName}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.warn('Supabase Storage Upload note:', uploadError.message);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err: any) {
    console.warn('Note: File upload to Supabase Storage requires authenticated admin or fallback:', err);
    throw new Error(err.message || 'Erro ao fazer upload da imagem.');
  }
};

// ==========================================
// REAL DATABASE OPERATIONS MATCHING EXACT SCHEMA
// ==========================================

// 1. BRANDS (table: brands | cols: id, name, slug, description, logo_url, is_active, created_at)
export const fetchShowcasesFromSupabase = async (): Promise<Showcase[] | null> => {
  try {
    const { data, error } = await supabase.from('brands').select('id, name, slug, description, logo_url, is_active, created_at');
    if (error) {
      console.warn('Supabase fetch brands note:', error.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    return data.map((item: any) => ({
      id: String(item.id),
      name: item.name || '',
      slug: item.slug || item.name.toLowerCase().replace(/\s+/g, '-'),
      description: item.description || '',
      logoUrl: item.logo_url || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=1200&auto=format&fit=crop&q=80',
      category: 'Perfumaria & Cosméticos',
      affiliateBaseUrl: 'https://www.natura.com.br',
      commissionRate: 8.5,
      isActive: item.is_active !== undefined ? Boolean(item.is_active) : true,
      themeColor: 'from-orange-500 to-amber-600',
      createdAt: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }));
  } catch (err) {
    console.warn('Exception fetching brands from Supabase:', err);
    return null;
  }
};

export const upsertShowcaseToSupabase = async (showcase: Showcase): Promise<{ success: boolean; rls?: boolean }> => {
  const payload = {
    id: showcase.id,
    name: showcase.name,
    slug: showcase.slug,
    description: showcase.description,
    logo_url: showcase.logoUrl,
    is_active: showcase.isActive
  };

  const { error } = await supabase.from('brands').upsert(payload);
  if (error) {
    if (error.code === '42501') {
      console.warn('Note: Modificação na tabela brands requer sessão de admin no Supabase (RLS 42501). Salvamento efetuado no ambiente local.');
      return { success: false, rls: true };
    }
    console.warn('Note: Upsert brand error:', error.message);
    return { success: false };
  }
  return { success: true };
};

export const deleteShowcaseFromSupabase = async (id: string): Promise<{ success: boolean; rls?: boolean }> => {
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) {
    if (error.code === '42501') {
      console.warn('Note: Exclusão na tabela brands requer sessão de admin (RLS 42501).');
      return { success: false, rls: true };
    }
    console.warn('Note: Delete brand error:', error.message);
    return { success: false };
  }
  return { success: true };
};

// 2. PRODUCTS & PRODUCT_IMAGES
// products cols: id, brand_id, name, description, price, category, affiliate_url, is_active, created_at
// product_images cols: id, product_id, image_url, created_at
export const fetchProductsFromSupabase = async (): Promise<Product[] | null> => {
  try {
    const { data: prodData, error: prodErr } = await supabase.from('products').select('id, brand_id, name, description, price, category, affiliate_url, is_active, created_at');
    if (prodErr) {
      console.warn('Supabase fetch products note:', prodErr.message);
      return null;
    }
    if (!prodData || prodData.length === 0) return null;

    // Fetch product images
    const { data: imgData } = await supabase.from('product_images').select('id, product_id, image_url');

    const imagesByProductId: Record<string, string[]> = {};
    if (imgData) {
      imgData.forEach((img: any) => {
        const pId = String(img.product_id);
        if (!imagesByProductId[pId]) imagesByProductId[pId] = [];
        if (img.image_url) imagesByProductId[pId].push(img.image_url);
      });
    }

    return prodData.map((item: any) => {
      const pId = String(item.id);
      const galleryPhotos = imagesByProductId[pId] || [];
      return {
        id: pId,
        showcaseId: String(item.brand_id || '11111111-1111-4111-a111-111111111111'),
        name: item.name || '',
        sku: `SKU-${pId.substring(0, 8)}`,
        description: item.description || '',
        price: Number(item.price || 0),
        promotionalPrice: undefined,
        category: item.category || 'Geral',
        photos: galleryPhotos.length > 0 ? galleryPhotos : ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80'],
        affiliateUrl: item.affiliate_url || 'https://www.natura.com.br',
        isActive: item.is_active !== undefined ? Boolean(item.is_active) : true,
        clicksCount: 0,
        conversionsCount: 0,
        createdAt: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      };
    });
  } catch (err) {
    console.warn('Exception fetching products from Supabase:', err);
    return null;
  }
};

export const upsertProductToSupabase = async (product: Product): Promise<{ success: boolean; rls?: boolean }> => {
  const payload = {
    id: product.id,
    brand_id: product.showcaseId,
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    affiliate_url: product.affiliateUrl,
    is_active: product.isActive
  };

  const { error } = await supabase.from('products').upsert(payload);
  if (error) {
    if (error.code === '42501') {
      console.warn('Note: Salvamento de produto no Supabase requer sessão de admin (RLS 42501). Salvamento mantido localmente.');
      return { success: false, rls: true };
    }
    console.warn('Note: Upsert product error:', error.message);
    return { success: false };
  }

  // Insert photos into product_images
  if (product.photos && product.photos.length > 0) {
    for (let i = 0; i < product.photos.length; i++) {
      const imgUrl = product.photos[i];
      try {
        await supabase.from('product_images').upsert({
          id: `${product.id}-img-${i}`,
          product_id: product.id,
          image_url: imgUrl
        });
      } catch (err) {
        // ignore image note
      }
    }
  }

  return { success: true };
};

export const deleteProductFromSupabase = async (id: string): Promise<{ success: boolean; rls?: boolean }> => {
  try {
    await supabase.from('product_images').delete().eq('product_id', id);
  } catch {}
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    if (error.code === '42501') {
      console.warn('Note: Exclusão de produto no Supabase requer sessão de admin (RLS 42501).');
      return { success: false, rls: true };
    }
    console.warn('Note: Delete product error:', error.message);
    return { success: false };
  }
  return { success: true };
};

// 3. BANNERS (table: banners | cols: id, brand_id, title, subtitle, image_url, is_active, created_at)
export const fetchBannersFromSupabase = async (): Promise<Banner[] | null> => {
  try {
    const { data, error } = await supabase.from('banners').select('id, brand_id, title, subtitle, image_url, is_active, created_at');
    if (error) {
      console.warn('Supabase fetch banners note:', error.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    return data.map((item: any, index: number) => ({
      id: String(item.id),
      showcaseId: String(item.brand_id || '11111111-1111-4111-a111-111111111111'),
      title: item.title || 'Banner Promocional',
      subtitle: item.subtitle || 'Confira as melhores ofertas',
      imageUrl: item.image_url || 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=1200&auto=format&fit=crop&q=80',
      ctaText: 'Aproveitar Oferta',
      ctaUrl: 'https://www.natura.com.br',
      order: index + 1,
      isActive: item.is_active !== undefined ? Boolean(item.is_active) : true
    }));
  } catch (err) {
    console.warn('Exception fetching banners from Supabase:', err);
    return null;
  }
};

export const upsertBannerToSupabase = async (banner: Banner): Promise<{ success: boolean; rls?: boolean }> => {
  const payload = {
    id: banner.id,
    brand_id: banner.showcaseId,
    title: banner.title,
    subtitle: banner.subtitle,
    image_url: banner.imageUrl,
    is_active: banner.isActive
  };

  const { error } = await supabase.from('banners').upsert(payload);
  if (error) {
    if (error.code === '42501') {
      console.warn('Note: Salvamento de banner no Supabase requer sessão de admin (RLS 42501). Salvamento mantido localmente.');
      return { success: false, rls: true };
    }
    console.warn('Note: Upsert banner error:', error.message);
    return { success: false };
  }
  return { success: true };
};

export const deleteBannerFromSupabase = async (id: string): Promise<{ success: boolean; rls?: boolean }> => {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) {
    if (error.code === '42501') {
      console.warn('Note: Exclusão de banner no Supabase requer sessão de admin (RLS 42501).');
      return { success: false, rls: true };
    }
    console.warn('Note: Delete banner error:', error.message);
    return { success: false };
  }
  return { success: true };
};

// 4. AFFILIATE_CLICKS (table: affiliate_clicks | cols: id, brand_id, product_id, source)
export const recordClickInSupabase = async (brandId: string, productId?: string, source: string = 'Direto'): Promise<void> => {
  try {
    const validProductId = productId && productId.includes('-') ? productId : null;
    await supabase.from('affiliate_clicks').insert({
      id: generateUUID(),
      brand_id: brandId,
      product_id: validProductId,
      source: source
    });
  } catch (err) {
    console.warn('Note: Click recording in Supabase:', err);
  }
};
