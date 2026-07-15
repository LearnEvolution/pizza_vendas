require('dotenv').config();
const express = require('express');
const cors = require('cors');
const produtosRoutes = require('./routes/produtos');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/produtos', produtosRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.send('API Pizza Vendas rodando'));

const PORTA = process.env.PORT || 4000;
app.listen(PORTA, () => console.log(`Servidor rodando na porta ${PORTA}`));
