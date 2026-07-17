const express = require('express');
const { ObjectId } = require('mongodb');
const { conectar } = require('../lib/db');
const authAdmin = require('../middleware/authAdmin');

const router = express.Router();

function idValido(id) {
  return ObjectId.isValid(id);
}

function precoValido(preco) {
  const n = Number(preco);
  return Number.isFinite(n) && n >= 0;
}

function imagemValida(imagem) {
  if (imagem === '' || imagem === undefined || imagem === null) return true;
  if (typeof imagem !== 'string' || imagem.length > 500) return false;
  return imagem.startsWith('https://') || imagem.startsWith('http://');
}

// Público - lista produtos ativos (usado pelo cardápio do cliente)
router.get('/', async (req, res) => {
  const db = await conectar();
  const produtos = await db.collection('produtos').find({ ativo: { $ne: false } }).toArray();
  res.json(produtos);
});

// Protegido - criar produto
router.post('/', authAdmin, async (req, res) => {
  const { nome, preco, categoria, imagem } = req.body;
  if (typeof nome !== 'string' || !nome.trim() || !precoValido(preco)) {
    return res.status(400).json({ erro: 'Nome e preço válidos são obrigatórios' });
  }
  if (!imagemValida(imagem)) {
    return res.status(400).json({ erro: 'Link de imagem inválido (precisa começar com http:// ou https://)' });
  }
  const categoriaFinal = categoria === 'bebida' ? 'bebida' : 'pizza';
  const db = await conectar();
  const resultado = await db.collection('produtos').insertOne({
    nome: nome.trim(),
    preco: Number(preco),
    categoria: categoriaFinal,
    imagem: imagem ? imagem.trim() : '',
    ativo: true,
    criadoEm: new Date().toISOString(),
  });
  res.status(201).json({
    _id: resultado.insertedId,
    nome: nome.trim(),
    preco: Number(preco),
    categoria: categoriaFinal,
    imagem: imagem ? imagem.trim() : '',
    ativo: true,
  });
});

// Protegido - editar produto (nome, preço, ativo/inativo)
router.put('/:id', authAdmin, async (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({ erro: 'ID inválido' });
  }
  const { nome, preco, ativo, categoria, imagem } = req.body;
  const atualizacao = {};
  if (nome !== undefined) {
    if (typeof nome !== 'string' || !nome.trim()) {
      return res.status(400).json({ erro: 'Nome inválido' });
    }
    atualizacao.nome = nome.trim();
  }
  if (preco !== undefined) {
    if (!precoValido(preco)) {
      return res.status(400).json({ erro: 'Preço inválido' });
    }
    atualizacao.preco = Number(preco);
  }
  if (imagem !== undefined) {
    if (!imagemValida(imagem)) {
      return res.status(400).json({ erro: 'Link de imagem inválido (precisa começar com http:// ou https://)' });
    }
    atualizacao.imagem = imagem ? imagem.trim() : '';
  }
  if (ativo !== undefined) atualizacao.ativo = Boolean(ativo);
  if (categoria !== undefined) atualizacao.categoria = categoria === 'bebida' ? 'bebida' : 'pizza';

  const db = await conectar();
  await db.collection('produtos').updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: atualizacao }
  );
  res.json({ sucesso: true });
});

// Protegido - excluir produto
router.delete('/:id', authAdmin, async (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({ erro: 'ID inválido' });
  }
  const db = await conectar();
  await db.collection('produtos').deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ sucesso: true });
});

module.exports = router;
