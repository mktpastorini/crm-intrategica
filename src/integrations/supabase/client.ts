
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://gfuoipqwmhfrqhmkqyxp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdW9pcHF3bWhmcnFobWtxeXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTYzNzEsImV4cCI6MjA2NDU3MjM3MX0.Y4GnTkvLF-tLDqJX7jZosouYYDESs7n2oV6XUseJV7w";

// Configurar cliente Supabase com opções de autenticação
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Teste de conexão
console.log('Supabase client inicializado');
console.log('URL:', SUPABASE_URL);
console.log('Key presente:', !!SUPABASE_PUBLISHABLE_KEY);

// Testar conexão básica
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Erro ao verificar sessão:', error);
  } else {
    console.log('Conexão com Supabase estabelecida:', !!data.session);
  }
}).catch(console.error);
