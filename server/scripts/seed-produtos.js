require('dotenv').config();
const { conectar } = require('../lib/db');

const pizzasIniciais = [
  { nome: 'Mussarela', preco: 39.9 },
  { nome: 'Calabresa', preco: 42.9 },
  { nome: 'Frango c/ Catupiry', preco: 44.9 },
  { nome: 'Portuguesa', preco: 47.9 },
];

async function main() {
  const db = await conectar();
  const existentes = await db.collection('produtos').countDocuments();
  if (existentes > 0) {
    console.log(`Já existem ${existentes} produto(s) no banco. Nada foi alterado.`);
    process.exit(0);
  }
  const paraInserir = pizzasIniciais.map((p) => ({ ...p, ativo: true, criadoEm: new Date().toISOString() }));
  await db.collection('produtos').insertMany(paraInserir);
  console.log(`${paraInserir.length} produtos iniciais criados.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
