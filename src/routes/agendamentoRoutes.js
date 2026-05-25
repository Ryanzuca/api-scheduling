const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

console.log('🔥 Servidor conectado ao Supabase!');

router.get('/filtros', async (req, res) => {
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

router.post('/', async (req, res) => {
    console.log('📝 POST / - Criando:', req.body.cliente_nome);
    
    try {
        const { data, error } = await supabase
            .from('agendamentos')
            .insert([{
                cliente_nome: req.body.cliente_nome,
                cliente_telefone: req.body.cliente_telefone || '',
                data: req.body.data,
                hora: req.body.hora,
                status: 'agendado',
                barbeiro: 'João'
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

router.delete('/:id', async (req, res) => {
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

router.get('/horarios/:data', async (req, res) => {
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

router.get('/exportar', async (req, res) => {
    console.log('📥 GET /exportar');
    
    try {
        const { data, error } = await supabase
            .from('agendamentos')
            .select('*')
            .order('data', { ascending: true });
        
        if (error) throw error;
        
        const csv = ['ID,Cliente,Telefone,Data,Hora,Status,Barbeiro'];
        data.forEach(a => {
            csv.push(`${a.id},${a.cliente_nome},${a.cliente_telefone || ''},${a.data},${a.hora},${a.status},${a.barbeiro || 'João'}`);
        });
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=agendamentos.csv');
        res.send(csv.join('\n'));
    } catch (error) {
        console.error('❌ Erro:', error.message);
        res.status(500).json({ erro: error.message });
    }
});

router.get('/', (req, res) => {
    res.json({ 
        mensagem: 'API de Agendamentos da Barbearia',
        rotas: ['GET /filtros', 'POST /', 'DELETE /:id', 'GET /horarios/:data', 'GET /exportar']
    });
});

module.exports = router;
