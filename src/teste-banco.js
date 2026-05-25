// Arquivo: src/teste-banco.js
const supabase = require('./config/supabase');

async function testarConexao() {
    console.log('🔄 Testando conexão com o Supabase...');
    console.log('📡 URL:', 'https://sykifrzypbsc1jwbgaza.supabase.co');

    // Tenta buscar agendamentos
    const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .limit(1);

    if (error) {
        console.log('❌ ERRO:', error.message);
        console.log('🔍 Detalhe:', error);
    } else {
        console.log('✅ Conexão OK! Banco de dados está respondendo!');
        console.log('📊 Agendamentos encontrados:', data.length);
    }
}

testarConexao();