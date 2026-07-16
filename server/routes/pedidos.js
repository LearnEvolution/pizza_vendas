const express = require('express');
const { ObjectId } = require('mongodb');
const rateLimit = require('express-rate-limit');
const { conectar } = require('../lib/db');
const authAdmin = require('../middleware/authAdmin');

const router = express.Router();

const STATUS_VALIDOS = ['recebido', 'preparando', 'pronto', 'entregue'];

// No máximo 15 pedidos por IP a cada 10 minutos (evita spam/flood no financeiro)
const limitePedidos = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: { erro: 'Muitos pedidos em pouco tempo. Aguarde um pouco e tente de novo.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Público - registra um pedido no momento em que o cliente finaliza no WhatsApp
router.post('/', limitePedidos, async (req, res) => {
  const { itens, cliente } = req.body;

  if (!Array.isArray(itens) || itens.length === 0 || itens.length > 30) {
    return res.status(400).json({ erro: 'Pedido inválido' });
  }
  const itensFormatoValido = itens.every(
    (i) =>
      typeof i.nome === 'string' &&
      i.nome.trim() &&
      typeof i.quantidade === 'number' &&
      Number.isInteger(i.quantidade) &&
      i.quantidade > 0 &&
      i.quantidade <= 50
  );
  if (!itensFormatoValido) {
    return res.status(400).json({ erro: 'Itens do pedido inválidos' });
  }
  if (
    !cliente ||
    typeof cliente.nome !== 'string' ||
    !cliente.nome.trim() ||
    cliente.nome.trim().length > 100 ||
    typeof cliente.telefone !== 'string' ||
    !cliente.telefone.trim() ||
    cliente.telefone.trim().length > 30
  ) {
    return res.status(400).json({ erro: 'Nome e telefone do cliente são obrigatórios' });
  }

  let observacoes = '';
  if (req.body.observacoes !== undefined) {
    if (typeof req.body.observacoes !== 'string' || req.body.observacoes.length > 300) {
      return res.status(400).json({ erro: 'Observação inválida' });
    }
    observacoes = req.body.observacoes.trim();
  }

  const pagamentoRecebido = req.body.pagamento || {};
  const formasValidas = ['dinheiro', 'pix'];
  if (!formasValidas.includes(pagamentoRecebido.forma)) {
    return res.status(400).json({ erro: 'Forma de pagamento inválida' });
  }
  let trocoPara = '';
  if (pagamentoRecebido.trocoPara !== undefined) {
    if (typeof pagamentoRecebido.trocoPara !== 'string' || pagamentoRecebido.trocoPara.length > 20) {
      return res.status(400).json({ erro: 'Valor de troco inválido' });
    }
    trocoPara = pagamentoRecebido.trocoPara.trim();
  }
  const pagamento = { forma: pagamentoRecebido.forma, trocoPara };

  // Importante: NUNCA confia no preço que vem do navegador do cliente.
  // Busca o preço real de cada item no cardápio atual e recalcula tudo aqui no servidor.
  const db = await conectar();
  const produtosCardapio = await db.collection('produtos').find({}).toArray();

  const itensConferidos = [];
  for (const item of itens) {
    const produtoReal = produtosCardapio.find(
      (p) => p.nome.toLowerCase() === item.nome.trim().toLowerCase()
    );
    if (!produtoReal) {
      return res.status(400).json({ erro: `Item "${item.nome}" não existe mais no cardápio` });
    }
    itensConferidos.push({
      nome: produtoReal.nome,
      preco: produtoReal.preco,
      quantidade: item.quantidade,
    });
  }
  const totalReal = itensConferidos.reduce((acc, i) => acc + i.preco * i.quantidade, 0);

  const resultado = await db.collection('pedidos').insertOne({
    itens: itensConferidos,
    total: totalReal,
    cliente: { nome: cliente.nome.trim(), telefone: cliente.telefone.trim() },
    observacoes,
    pagamento,
    status: 'recebido',
    criadoEm: new Date(),
  });
  res.status(201).json({ _id: resultado.insertedId, status: 'recebido', total: totalReal });
});

// Protegido - lista os pedidos recentes pro painel do dono
router.get('/', authAdmin, async (req, res) => {
  const db = await conectar();
  let limite = parseInt(req.query.limit, 10);
  if (!Number.isFinite(limite) || limite <= 0) limite = 60;
  limite = Math.min(limite, 1000);

  const pedidos = await db
    .collection('pedidos')
    .find({})
    .sort({ criadoEm: -1 })
    .limit(limite)
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

// No máximo 60 consultas de status por IP a cada 10 minutos
const limiteConsulta = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// Público - o cliente acompanha o próprio pedido pelo ID (link só ele tem)
router.get('/:id', limiteConsulta, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ erro: 'ID inválido' });
  }
  const db = await conectar();
  const pedido = await db.collection('pedidos').findOne(
    { _id: new ObjectId(req.params.id) },
    { projection: { itens: 1, total: 1, status: 1, criadoEm: 1, observacoes: 1, pagamento: 1 } }
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
