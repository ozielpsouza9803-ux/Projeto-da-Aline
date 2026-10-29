import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AdminSettings } from '../types';

let cachedClient: SupabaseClient | null = null;
let currentUrl = '';
let currentKey = '';

export const getSupabaseClient = (settings?: AdminSettings): SupabaseClient | null => {
  const url = settings?.supabaseUrl || localStorage.getItem('omnibrand_supabase_url') || '';
  const key = settings?.supabaseAnonKey || localStorage.getItem('omnibrand_supabase_key') || '';

  if (!url || !key || url.includes('your-project') || key.includes('eyJhbGciOi')) {
    return null; // Not configured yet
  }

  if (cachedClient && currentUrl === url && currentKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key);
    currentUrl = url;
    currentKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const testSupabaseConnection = async (url: string, key: string): Promise<{ success: boolean; message: string }> => {
  if (!url || !key) {
    return { success: false, message: 'URL e Chave Anon do Supabase são obrigatórias.' };
  }

  try {
    const client = createClient(url, key);
    // Test query on showcases or general ping
    const { error } = await client.from('showcases').select('id').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "public.showcases" does not exist') || error.code === '42P01') {
        return { 
          success: true, 
          message: 'Conexão estabelecida com sucesso! Porém, a tabela "showcases" ainda não foi criada no banco. Execute o script SQL fornecido.' 
        };
      }
      return { success: false, message: `Erro ao conectar: ${error.message}` };
    }

    return { success: true, message: 'Conexão com o Supabase estabelecida e testada com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Falha na conexão: ${err.message || err}` };
  }
};

export const uploadImageToSupabaseStorage = async (file: File, bucketName: string = 'product-images'): Promise<string | null> => {
  const settings = JSON.parse(localStorage.getItem('omnibrand_settings') || '{}');
  const client = getSupabaseClient(settings);

  if (!client) {
    console.warn('Supabase client not configured. Falling back to local data URL.');
    return null;
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await client.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return null;
    }

    const { data } = client.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error('Error uploading image to Supabase storage:', err);
    return null;
  }
};
