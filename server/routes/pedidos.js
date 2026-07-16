const express = require('express');
const { ObjectId } = require('mongodb');
const { conectar } = require('../lib/db');
const authAdmin = require('../middleware/authAdmin');

const router = express.Router();

const STATUS_VALIDOS = ['recebido', 'preparando', 'pronto', 'entregue'];
const PROXIMO_STATUS = {
  recebido: 'preparando',
  preparando: 'pronto',
  pronto: 'entregue',
};

// Público - registra um pedido no momento em que o cliente finaliza no WhatsApp
router.post('/', async (req, res) => {
  const { itens, total, cliente } = req.body;

  if (!Array.isArray(itens) || itens.length === 0 || typeof total !== 'number' || total <= 0) {
    return res.status(400).json({ erro: 'Pedido inválido' });
  }
  const itensValidos = itens.every(
    (i) =>
      typeof i.nome === 'string' &&
      i.nome.trim() &&
      typeof i.preco === 'number' &&
      i.preco >= 0 &&
      typeof i.quantidade === 'number' &&
      i.quantidade > 0
  );
  if (!itensValidos) {
    return res.status(400).json({ erro: 'Itens do pedido inválidos' });
  }
  if (
    !cliente ||
    typeof cliente.nome !== 'string' ||
    !cliente.nome.trim() ||
    typeof cliente.telefone !== 'string' ||
    !cliente.telefone.trim()
  ) {
    return res.status(400).json({ erro: 'Nome e telefone do cliente são obrigatórios' });
  }

  const db = await conectar();
  const resultado = await db.collection('pedidos').insertOne({
    itens,
    total,
    cliente: { nome: cliente.nome.trim(), telefone: cliente.telefone.trim() },
    status: 'recebido',
    criadoEm: new Date(),
  });
  res.status(201).json({ _id: resultado.insertedId, status: 'recebido' });
});

// Protegido - lista os pedidos recentes pro painel do dono
router.get('/', authAdmin, async (req, res) => {
  const db = await conectar();
  const pedidos = await db
    .collection('pedidos')
    .find({})
    .sort({ criadoEm: -1 })
    .limit(60)
    .toArray();
  res.json(pedidos);
});

// Protegido - avança o status de um pedido
router.patch('/:id/status', authAdmin, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ erro: 'ID inválido' });
  }
  const { status } = req.body;
  if (!STATUS_VALIDOS.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido' });
  }
  const db = await conectar();
  await db
    .collection('pedidos')
    .updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status } });
  res.json({ sucesso: true, status });
});

// Público - o cliente acompanha o próprio pedido pelo ID (link só ele tem)
router.get('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ erro: 'ID inválido' });
  }
  const db = await conectar();
  const pedido = await db.collection('pedidos').findOne(
    { _id: new ObjectId(req.params.id) },
    { projection: { itens: 1, total: 1, status: 1, criadoEm: 1 } }
  );
  if (!pedido) {
    return res.status(404).json({ erro: 'Pedido não encontrado' });
  }
  res.json(pedido);
});

// Protegido - resumo de vendas pro painel financeiro do dono
router.get('/resumo/dados', authAdmin, async (req, res) => {
  const db = await conectar();
  const agora = new Date();
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const seteDiasAtras = new Date(inicioHoje);
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);

  const dataMinima = seteDiasAtras < inicioMes ? seteDiasAtras : inicioMes;

  const pedidos = await db
    .collection('pedidos')
    .find({ criadoEm: { $gte: dataMinima } })
    .toArray();

  function somaTotal(lista) {
    return lista.reduce((acc, p) => acc + p.total, 0);
  }

  const pedidosHoje = pedidos.filter((p) => new Date(p.criadoEm) >= inicioHoje);
  const pedidosSemana = pedidos.filter((p) => new Date(p.criadoEm) >= seteDiasAtras);
  const pedidosMes = pedidos.filter((p) => new Date(p.criadoEm) >= inicioMes);

  const vendasPorDia = [];
  for (let i = 6; i >= 0; i--) {
    const dia = new Date(inicioHoje);
    dia.setDate(dia.getDate() - i);
    const diaSeguinte = new Date(dia);
    diaSeguinte.setDate(diaSeguinte.getDate() + 1);
    const doDia = pedidosSemana.filter((p) => {
      const data = new Date(p.criadoEm);
      return data >= dia && data < diaSeguinte;
    });
    vendasPorDia.push({
      data: dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      total: somaTotal(doDia),
      pedidos: doDia.length,
    });
  }

  const contagem = {};
  for (const pedido of pedidosMes) {
    for (const item of pedido.itens) {
      if (!contagem[item.nome]) {
        contagem[item.nome] = { nome: item.nome, quantidade: 0, total: 0 };
      }
      contagem[item.nome].quantidade += item.quantidade;
      contagem[item.nome].total += item.preco * item.quantidade;
    }
  }
  const maisVendidos = Object.values(contagem)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);

  res.json({
    hoje: { total: somaTotal(pedidosHoje), pedidos: pedidosHoje.length },
    semana: { total: somaTotal(pedidosSemana), pedidos: pedidosSemana.length },
    mes: { total: somaTotal(pedidosMes), pedidos: pedidosMes.length },
    vendasPorDia,
    maisVendidos,
  });
});

module.exports = router;
