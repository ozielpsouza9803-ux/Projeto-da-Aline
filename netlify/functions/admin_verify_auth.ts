import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://spqwrnywdlkrfrslfmwl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_JGX27g41zq4QHaW6i5rYVw_KNMOHgq0';
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const handler: Handler = async (event, _) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Não autorizado',
        message: 'Token de administrador ausente no cabeçalho Authorization.'
      })
    };
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Não autorizado',
        message: 'Token de autorização vazio ou malformatado.'
      })
    };
  }

  try {
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Sessão inválida ou expirada',
          message: 'O token fornecido não foi validado pelo Supabase Auth ou expirou.'
        })
      };
    }

    const { data: profile, error: profileError } = await serverSupabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Acesso negado',
          message: 'Usuário autenticado não possui privilégios de administrador (role admin).'
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          role: 'admin'
        }
      })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Erro na verificação de autenticação',
        message: err.message || 'Falha ao validar privilégios de administrador no servidor.'
      })
    };
  }
};
