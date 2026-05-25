// Arquivo: src/teste-criar.js
const supabase = require('./config/supabase');

async function criarAgendamento() {
    console.log('📝 Criando agendamento de teste...');

    const agendamento = {
        cliente_nome: 'João Silva',
        cliente_telefone: '11999999999',
        data: '2026-05-25',
        hora: '14:30',
        status: 'agendado'
    };

    console.log('📦 Dados a serem salvos:', agendamento);

    const { data, error } = await supabase
        .from('agendamentos')
        .insert([agendamento])
        .select();

    if (error) {
        console.log('❌ Erro detalhado:', error);
        console.log('❌ Mensagem:', error.message);
    } else {
        console.log('✅ Agendamento criado com sucesso!');
        console.log('📋 ID:', data[0].id);
        console.log('📋 Dados salvos:', data[0]);
    }
}

criarAgendamento();