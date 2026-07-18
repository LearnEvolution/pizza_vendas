const express = require('express');
const { conectar } = require('../lib/db');
const authAdmin = require('../middleware/authAdmin');

const router = express.Router();

// Público - o cardápio busca a promoção atual pra exibir no topo
router.get('/', async (req, res) => {
  const db = await conectar();
  const config = await db.collection('configuracoes').findOne({ chave: 'geral' });
  res.json({
    promocao: config?.promocao || '',
    promocaoAtiva: config?.promocaoAtiva || false,
  });
});

// Protegido - o dono edita o texto e liga/desliga o banner
router.put('/', authAdmin, async (req, res) => {
  const { promocao, promocaoAtiva } = req.body;
  if (promocao !== undefined && (typeof promocao !== 'string' || promocao.length > 150)) {
    return res.status(400).json({ erro: 'Texto da promoção inválido (máximo 150 caracteres)' });
  }
  const atualizacao = {};
  if (promocao !== undefined) atualizacao.promocao = promocao.trim();
  if (promocaoAtiva !== undefined) atualizacao.promocaoAtiva = Boolean(promocaoAtiva);

  const db = await conectar();
  await db
    .collection('configuracoes')
    .updateOne({ chave: 'geral' }, { $set: atualizacao }, { upsert: true });
  res.json({ sucesso: true });
});

module.exports = router;
