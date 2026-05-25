// Arquivo: src/controllers/agendamentoController.js
const agendamentoService = require('../services/agendamentoService');

async function criarAgendamento(req, res) {
    try {
        const dados = req.body;

        // Validação básica
        if (!dados.cliente_nome || !dados.data || !dados.hora) {
            return res.status(400).json({
                erro: 'Nome do cliente, data e hora são obrigatórios'
            });
        }

        const agendamento = await agendamentoService.criarAgendamento(dados);

        res.status(201).json({
            mensagem: 'Agendamento criado com sucesso!',
            agendamento: agendamento
        });

    } catch (error) {
        console.error('Erro ao criar:', error.message);
        res.status(400).json({ // 400 = erro do usuário, não do servidor
            erro: error.message
        });
    }
}

async function listarAgendamentos(req, res) {
    try {
        const agendamentos = await agendamentoService.listarAgendamentos();

        res.status(200).json({
            mensagem: 'Lista de agendamentos',
            agendamentos: agendamentos
        });

    } catch (error) {
        console.error('Erro ao listar:', error.message);
        res.status(500).json({
            erro: 'Erro ao listar agendamentos',
            detalhe: error.message
        });
    }
}

async function cancelarAgendamento(req, res) {
    try {
        const { id } = req.params;

        const agendamento = await agendamentoService.cancelarAgendamento(id);

        res.status(200).json({
            mensagem: 'Agendamento cancelado com sucesso!',
            agendamento: agendamento
        });

    } catch (error) {
        console.error('Erro ao cancelar:', error.message);
        res.status(400).json({
            erro: error.message
        });
    }
}

// NOVA FUNÇÃO: Listar horários disponíveis para uma data
async function listarHorariosDisponiveis(req, res) {
    try {
        const { data } = req.params;

        if (!data) {
            return res.status(400).json({ erro: 'Data é obrigatória' });
        }

        const horarios = await agendamentoService.listarHorariosDisponiveis(data);

        res.status(200).json({
            data: data,
            horarios_disponiveis: horarios
        });

    } catch (error) {
        console.error('Erro ao listar horários:', error.message);
        res.status(500).json({
            erro: 'Erro ao listar horários disponíveis'
        });
    }
}
// NOVA FUNÇÃO: Buscar agendamentos com filtros
async function buscarComFiltros(req, res) {
    try {
        const { data, status } = req.query;

        const filtros = {};
        if (data) filtros.data = data;
        if (status) filtros.status = status;

        const resultado = await agendamentoService.buscarAgendamentosComFiltros(filtros);

        res.status(200).json({
            mensagem: 'Agendamentos encontrados',
            ...resultado
        });

    } catch (error) {
        console.error('Erro ao buscar com filtros:', error.message);
        res.status(500).json({
            erro: 'Erro ao buscar agendamentos'
        });
    }
}

// NOVA FUNÇÃO: Exportar relatório CSV
async function exportarRelatorio(req, res) {
    try {
        const { data, status } = req.query;

        const filtros = {};
        if (data) filtros.data = data;
        if (status) filtros.status = status;

        const { agendamentos } = await agendamentoService.buscarAgendamentosComFiltros(filtros);
        const csv = agendamentoService.gerarRelatorioCSV(agendamentos);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-${Date.now()}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Erro ao exportar:', error.message);
        res.status(500).json({
            erro: 'Erro ao exportar relatório'
        });
    }
}
module.exports = {
    criarAgendamento,
    listarAgendamentos,
    cancelarAgendamento,
    listarHorariosDisponiveis,
    buscarComFiltros,
    exportarRelatorio
};