const express = require('express');
const app = express();
const PORT = 8080;

app.get('/', (req, res) => {
    res.json({ mensagem: 'Servidor funcionando na porta 8080!' });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
