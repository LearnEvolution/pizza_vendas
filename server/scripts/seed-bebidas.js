require('dotenv').config();
const { conectar } = require('../lib/db');

const bebidasIniciais = [
  { nome: 'Água', preco: 5.0 },
  { nome: 'Suco', preco: 8.0 },
  { nome: 'Guaraná', preco: 7.0 },
  { nome: 'Cerveja', preco: 10.0 },
];

async function main() {
  const db = await conectar();
  const existentes = await db.collection('produtos').countDocuments({ categoria: 'bebida' });
  if (existentes > 0) {
    console.log(`Já existem ${existentes} bebida(s) no banco. Nada foi alterado.`);
    process.exit(0);
  }
  const paraInserir = bebidasIniciais.map((b) => ({
    ...b,
    categoria: 'bebida',
    ativo: true,
    criadoEm: new Date().toISOString(),
  }));
  await db.collection('produtos').insertMany(paraInserir);
  console.log(`${paraInserir.length} bebidas iniciais criadas.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
