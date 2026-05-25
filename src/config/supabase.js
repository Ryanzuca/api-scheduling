// Arquivo: src/config/supabase.js
// Este arquivo é a "ponte" entre nosso código e o banco de dados na nuvem

const { createClient } = require('@supabase/supabase-js');

// ⚠️ SUBSTITUA pelos seus dados do Passo 4!
const SUPABASE_URL = 'https://sykifrzpybscljwbgaza.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wAc8N_S6srdrjRvoGApK8w_HhzE4QMb';

// Cria o cliente que vai conversar com o banco
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exporta para ser usado em outros arquivos
module.exports = supabase;