const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('src/public'));

console.log('📂 Carregando rotas...');

const agendamentoRoutes = require('./routes/agendamentoRoutes');

app.use('/agendamentos', agendamentoRoutes);

console.log('✅ Rotas carregadas!');

app.get('/teste', (req, res) => {
    res.json({ mensagem: 'OK' });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor em http://localhost:${PORT}`);
});