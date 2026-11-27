// Conexão com o Supabase.
// Pegue a URL e a chave "anon" em: Settings > API no painel do Supabase.
// Nunca coloque a chave "service_role" aqui.
const SUPABASE_URL = 'https://gdhxskfhidfktiakrsnj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KvxZeOUvbRkcNESaSvjpBg_zF4ODcJr';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
