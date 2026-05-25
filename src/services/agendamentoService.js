// Arquivo: src/services/agendamentoService.js
// Este arquivo contém TODAS as regras de negócio da barbearia

const supabase = require('../config/supabase');

// ============================================
// VALIDAÇÕES
// ============================================

// Função para validar horário comercial (09:00 às 19:00)
function validarHorarioComercial(hora, data) {
    // Verificar se a data é no passado
    const dataAgendamento = new Date(`${data}T${hora}`);
    const agora = new Date();

    if (dataAgendamento < agora) {
        return { valido: false, mensagem: 'Não é possível agendar no passado' };
    }

    // Verificar horário comercial
    const [horaNumero] = hora.split(':').map(Number);

    if (horaNumero < 9 || horaNumero >= 19) {
        return { valido: false, mensagem: 'Horário comercial: 09:00 às 19:00' };
    }

    // Verificar horário de almoço
    const validacaoAlmoco = validarHorarioAlmoco(hora);
    if (!validacaoAlmoco.valido) {
        return validacaoAlmoco;
    }

    return { valido: true, mensagem: '' };
}

// Função para verificar horário de almoço (12:00 às 13:00)
function validarHorarioAlmoco(hora) {
    const [horaNumero] = hora.split(':').map(Number);

    // Bloquear horário de almoço (12:00 às 13:00)
    if (horaNumero >= 12 && horaNumero < 13) {
        return { valido: false, mensagem: 'Horário de almoço: 12:00 às 13:00. Escolha outro horário.' };
    }

    return { valido: true, mensagem: '' };
}

// Função para verificar se um horário está disponível
async function verificarHorarioDisponivel(data, hora, idIgnorar = null) {
    console.log(`🔍 Verificando disponibilidade para ${data} às ${hora}`);

    let query = supabase
        .from('agendamentos')
        .select('*')
        .eq('data', data)
        .eq('hora', hora)
        .eq('status', 'agendado'); // Só considera agendamentos ativos

    // Se for uma atualização (cancelamento), ignora o próprio ID
    if (idIgnorar) {
        query = query.neq('id', idIgnorar);
    }

    const { data: agendamentos, error } = await query;

    if (error) throw error;

    return agendamentos.length === 0; // Se não encontrou, está disponível
}

// ============================================
// OPERAÇÕES PRINCIPAIS (CRUD)
// ============================================

// Função para criar um novo agendamento (COM VALIDAÇÕES)
async function criarAgendamento(dados) {
    console.log('📝 Criando agendamento para:', dados.cliente_nome);

    // VALIDAÇÃO 1: Horário comercial e almoço
    const validacaoHorario = validarHorarioComercial(dados.hora, dados.data);
    if (!validacaoHorario.valido) {
        throw new Error(validacaoHorario.mensagem);
    }

    // VALIDAÇÃO 2: Verificar se o horário já está ocupado
    const disponivel = await verificarHorarioDisponivel(dados.data, dados.hora);
    if (!disponivel) {
        throw new Error('Horário já está ocupado! Escolha outro horário.');
    }

    // Se passou nas validações, cria o agendamento
    const novoAgendamento = {
        cliente_nome: dados.cliente_nome,
        cliente_telefone: dados.cliente_telefone || '',
        data: dados.data,
        hora: dados.hora,
        barbeiro: dados.barbeiro || 'João',
        status: 'agendado'
    };

    const { data: result, error } = await supabase
        .from('agendamentos')
        .insert([novoAgendamento])
        .select();

    if (error) throw error;

    console.log('✅ Agendamento criado com ID:', result[0].id);
    return result[0];
}

// Função para listar todos os agendamentos
async function listarAgendamentos() {
    console.log('📋 Buscando todos os agendamentos...');

    const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

    if (error) throw error;

    console.log(`📊 Encontrados ${data.length} agendamentos`);
    return data;
}

// Função para cancelar um agendamento
async function cancelarAgendamento(id) {
    console.log(`📝 Cancelando agendamento ID: ${id}`);

    // Primeiro verifica se o agendamento existe
    const { data: existe, error: buscaError } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('id', id)
        .single();

    if (buscaError || !existe) {
        throw new Error('Agendamento não encontrado');
    }

    if (existe.status === 'cancelado') {
        throw new Error('Agendamento já está cancelado');
    }

    // Atualiza o status
    const { data, error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', id)
        .select();

    if (error) throw error;

    console.log('✅ Agendamento cancelado com sucesso');
    return data[0];
}

// ============================================
// HORÁRIOS E DISPONIBILIDADE
// ============================================

// Função para listar horários disponíveis em uma data específica
async function listarHorariosDisponiveis(data) {
    console.log(`🔍 Buscando horários disponíveis para ${data}`);

    // Horário comercial (excluindo almoço)
    const horariosComerciais = [
        '09:00', '10:00', '11:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

    // Buscar agendamentos já existentes para esta data
    const { data: agendamentos, error } = await supabase
        .from('agendamentos')
        .select('hora')
        .eq('data', data)
        .eq('status', 'agendado');

    if (error) throw error;

    const horariosOcupados = agendamentos.map(ag => ag.hora);

    // Filtrar horários disponíveis
    const horariosDisponiveis = horariosComerciais.filter(hora =>
        !horariosOcupados.includes(hora)
    );

    console.log(`📊 Encontrados ${horariosDisponiveis.length} horários disponíveis`);
    return horariosDisponiveis;
}

// ============================================
// FILTROS E RELATÓRIOS
// ============================================

// Função para buscar agendamentos com filtros
async function buscarAgendamentosComFiltros(filtros) {
    console.log('🔍 Buscando com filtros:', filtros);

    let query = supabase
        .from('agendamentos')
        .select('*');

    // Aplicar filtro por data
    if (filtros.data) {
        query = query.eq('data', filtros.data);
    }

    // Aplicar filtro por status
    if (filtros.status && filtros.status !== 'todos') {
        query = query.eq('status', filtros.status);
    }

    // Aplicar filtro por barbeiro
    if (filtros.barbeiro) {
        query = query.eq('barbeiro', filtros.barbeiro);
    }

    // Ordenar por data e hora
    query = query.order('data', { ascending: true })
        .order('hora', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    // Calcular estatísticas
    const estatisticas = {
        total: data.length,
        agendados: data.filter(a => a.status === 'agendado').length,
        cancelados: data.filter(a => a.status === 'cancelado').length
    };

    console.log('📊 Estatísticas:', estatisticas);

    return { agendamentos: data, estatisticas };
}

// Função para gerar relatório CSV
function gerarRelatorioCSV(agendamentos) {
    const cabecalho = ['ID', 'Cliente', 'Telefone', 'Data', 'Hora', 'Barbeiro', 'Status'];

    const linhas = agendamentos.map(ag => [
        ag.id,
        ag.cliente_nome,
        ag.cliente_telefone || '',
        ag.data,
        ag.hora,
        ag.barbeiro || 'João',
        ag.status
    ]);

    const csv = [cabecalho, ...linhas]
        .map(row => row.join(','))
        .join('\n');

    return csv;
}

// ============================================
// EXPORTAÇÃO DAS FUNÇÕES
// ============================================

module.exports = {
    // Operações principais
    criarAgendamento,
    listarAgendamentos,
    cancelarAgendamento,

    // Validações
    verificarHorarioDisponivel,
    validarHorarioComercial,
    validarHorarioAlmoco,

    // Horários
    listarHorariosDisponiveis,

    // Filtros e relatórios
    buscarAgendamentosComFiltros,
    gerarRelatorioCSV
};