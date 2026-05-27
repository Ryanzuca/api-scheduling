const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const XLSX = require('xlsx');

console.log('🔥 Servidor conectado ao Supabase!');

// ROTA: Listar agendamentos com filtros
router.get('/filtros', async(req, res) => {
    console.log('📡 GET /filtros - Buscando agendamentos...');

    try {
        const { data, error } = await supabase
            .from('agendamentos')
            .select('*')
            .order('data', { ascending: true });

        if (error) throw error;

        console.log(`✅ Encontrados ${data.length} agendamentos`);

        res.json({
            agendamentos: data,
            estatisticas: {
                total: data.length,
                agendados: data.filter(a => a.status === 'agendado').length,
                cancelados: data.filter(a => a.status === 'cancelado').length
            }
        });
    } catch (error) {
        console.error('❌ Erro:', error.message);
        res.status(500).json({ erro: error.message });
    }
});

// ROTA: Criar novo agendamento (COM SERVIÇOS E AVALIAÇÕES)
router.post('/', async(req, res) => {
    console.log('📝 POST / - Criando:', req.body.cliente_nome);

    try {
        const { data, error } = await supabase
            .from('agendamentos')
            .insert([{
                cliente_nome: req.body.cliente_nome,
                cliente_telefone: req.body.cliente_telefone || '',
                servico: req.body.servico || 'Corte',
                data: req.body.data,
                hora: req.body.hora,
                barbeiro: req.body.barbeiro || 'João',
                observacoes: req.body.observacoes || '',
                avaliacao: req.body.avaliacao || 0,
                status: 'agendado'
            }])
            .select();

        if (error) throw error;

        console.log(`✅ Criado ID: ${data[0].id}`);
        res.json({ mensagem: 'Agendamento criado!', agendamento: data[0] });
    } catch (error) {
        console.error('❌ Erro:', error.message);
        res.status(500).json({ erro: error.message });
    }
});

// ROTA: Cancelar agendamento
router.delete('/:id', async(req, res) => {
    console.log(`❌ DELETE /${req.params.id} - Cancelando...`);

    try {
        const { error } = await supabase
            .from('agendamentos')
            .update({ status: 'cancelado' })
            .eq('id', req.params.id);

        if (error) throw error;

        console.log(`✅ ID ${req.params.id} cancelado`);
        res.json({ mensagem: `Agendamento ${req.params.id} cancelado` });
    } catch (error) {
        console.error('❌ Erro:', error.message);
        res.status(500).json({ erro: error.message });
    }
});

// ROTA: Buscar horários disponíveis
router.get('/horarios/:data', async(req, res) => {
    console.log(`⏰ GET /horarios/${req.params.data}`);

    try {
        const { data, error } = await supabase
            .from('agendamentos')
            .select('hora')
            .eq('data', req.params.data)
            .eq('status', 'agendado');

        if (error) throw error;

        const todosHorarios = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        const horariosOcupados = data.map(a => a.hora.substring(0, 5));
        const horariosDisponiveis = todosHorarios.filter(h => !horariosOcupados.includes(h));

        res.json({ data: req.params.data, horarios_disponiveis: horariosDisponiveis });
    } catch (error) {
        console.error('❌ Erro:', error.message);
        res.status(500).json({ erro: error.message });
    }
});

// ROTA: Exportar relatório para EXCEL (XLSX) COM SERVIÇOS E AVALIAÇÕES
router.get('/exportar', async(req, res) => {
    console.log('📥 Exportando relatório para Excel...');

    try {
        const { data, error } = await supabase
            .from('agendamentos')
            .select('*')
            .order('data', { ascending: true });

        if (error) throw error;

        const totalAgendados = data.filter(a => a.status === 'agendado').length;
        const totalCancelados = data.filter(a => a.status === 'cancelado').length;

        const dadosExcel = data.map(a => ({
            'ID': a.id,
            'Cliente': a.cliente_nome,
            'Telefone': a.cliente_telefone || '',
            'Serviço': a.servico || 'Corte',
            'Data': a.data,
            'Horário': a.hora.substring(0, 5),
            'Barbeiro': a.barbeiro || 'João',
            'Status': a.status === 'agendado' ? 'Agendado' : 'Cancelado',
            'Avaliação': a.avaliacao ? `${a.avaliacao}★` : 'Não avaliado'
        }));

        dadosExcel.push({
            'ID': '---',
            'Cliente': '📊 RESUMO',
            'Telefone': '',
            'Serviço': '',
            'Data': '',
            'Horário': '',
            'Barbeiro': '',
            'Status': `Agendados: ${totalAgendados} | Cancelados: ${totalCancelados} | Total: ${data.length}`,
            'Avaliação': ''
        });

        const worksheet = XLSX.utils.json_to_sheet(dadosExcel);
        worksheet['!cols'] = [
            { wch: 8 }, // ID
            { wch: 25 }, // Cliente
            { wch: 15 }, // Telefone
            { wch: 15 }, // Serviço
            { wch: 12 }, // Data
            { wch: 10 }, // Horário
            { wch: 12 }, // Barbeiro
            { wch: 25 }, // Status
            { wch: 15 } // Avaliação
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Agendamentos');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=agendamentos.xlsx');
        res.send(buffer);

        console.log(`✅ Relatório exportado: ${data.length} agendamentos`);
    } catch (error) {
        console.error('❌ Erro na exportação:', error.message);
        res.status(500).json({ erro: error.message });
    }
});

// ROTA: Informações da API
router.get('/', (req, res) => {
    res.json({
        mensagem: 'API de Agendamentos da Barbearia',
        versao: '3.0.0',
        rotas: [
            'GET /filtros - Listar agendamentos',
            'POST / - Criar novo agendamento (com serviço e barbeiro)',
            'DELETE /:id - Cancelar agendamento',
            'GET /horarios/:data - Horários disponíveis',
            'GET /exportar - Exportar relatório Excel'
        ]
    });
});

module.exports = router;