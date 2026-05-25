const supabase = require('./src/config/supabase');

async function testar() {
    const { data, error } = await supabase
        .from('agendamentos')
        .select('*');
    
    console.log('Dados:', data);
    console.log('Erro:', error);
}

testar();
