require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const produtosRoutes = require('./routes/produtos');
const authRoutes = require('./routes/auth');
const pedidosRoutes = require('./routes/pedidos');
const configuracoesRoutes = require('./routes/configuracoes');

const app = express();
app.use(helmet());

// Em produção, defina ALLOWED_ORIGIN no .env com o endereço do seu site
// (ex: https://kingpizzas.netlify.app). Em desenvolvimento local, libera tudo.
const origensPermitidas = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map((o) => o.trim())
  : true;

app.use(cors({ origin: origensPermitidas }));
app.use(express.json({ limit: '100kb' }));

app.use('/api/produtos', produtosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/configuracoes', configuracoesRoutes);

app.get('/', (req, res) => res.send('API Pizza Vendas rodando'));

const PORTA = process.env.PORT || 4000;
app.listen(PORTA, () => console.log(`Servidor rodando na porta ${PORTA}`));
