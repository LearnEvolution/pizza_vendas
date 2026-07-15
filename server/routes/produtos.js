const express = require('express');
const { ObjectId } = require('mongodb');
const { conectar } = require('../lib/db');
const authAdmin = require('../middleware/authAdmin');

const router = express.Router();

// Público - lista produtos ativos (usado pelo cardápio do cliente)
router.get('/', async (req, res) => {
  const db = await conectar();
  const produtos = await db.collection('produtos').find({ ativo: { $ne: false } }).toArray();
  res.json(produtos);
});

// Protegido - criar produto
router.post('/', authAdmin, async (req, res) => {
  const { nome, preco, categoria } = req.body;
  if (!nome || preco === undefined) {
    return res.status(400).json({ erro: 'Nome e preço são obrigatórios' });
  }
  const db = await conectar();
  const resultado = await db.collection('produtos').insertOne({
    nome,
    preco: Number(preco),
    categoria: categoria === 'bebida' ? 'bebida' : 'pizza',
    ativo: true,
    criadoEm: new Date().toISOString(),
  });
  res.status(201).json({ _id: resultado.insertedId, nome, preco: Number(preco), categoria: categoria === 'bebida' ? 'bebida' : 'pizza', ativo: true });
});

// Protegido - editar produto (nome, preço, ativo/inativo)
router.put('/:id', authAdmin, async (req, res) => {
  const { nome, preco, ativo, categoria } = req.body;
  const db = await conectar();
  const atualizacao = {};
  if (nome !== undefined) atualizacao.nome = nome;
  if (preco !== undefined) atualizacao.preco = Number(preco);
  if (ativo !== undefined) atualizacao.ativo = ativo;
  if (categoria !== undefined) atualizacao.categoria = categoria === 'bebida' ? 'bebida' : 'pizza';

  await db.collection('produtos').updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: atualizacao }
  );
  res.json({ sucesso: true });
});

// Protegido - excluir produto
router.delete('/:id', authAdmin, async (req, res) => {
  const db = await conectar();
  await db.collection('produtos').deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ sucesso: true });
});

module.exports = router;
