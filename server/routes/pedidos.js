const express = require('express');
const { conectar } = require('../lib/db');
const authAdmin = require('../middleware/authAdmin');

const router = express.Router();

// Público - registra um pedido no momento em que o cliente finaliza no WhatsApp
router.post('/', async (req, res) => {
  const { itens, total } = req.body;

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

  const db = await conectar();
  const resultado = await db.collection('pedidos').insertOne({
    itens,
    total,
    criadoEm: new Date(),
  });
  res.status(201).json({ _id: resultado.insertedId });
});

// Protegido - resumo de vendas pro painel financeiro do dono
router.get('/resumo', authAdmin, async (req, res) => {
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

  // Vendas por dia, últimos 7 dias (pro gráfico)
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

  // Itens mais vendidos no mês
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
