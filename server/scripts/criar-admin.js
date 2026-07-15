require('dotenv').config();
const bcrypt = require('bcryptjs');
const { conectar } = require('../lib/db');

const usuario = process.argv[2];
const senha = process.argv[3];

if (!usuario || !senha) {
  console.log('Uso: node scripts/criar-admin.js <usuario> <senha>');
  process.exit(1);
}

async function main() {
  const db = await conectar();
  const senhaHash = bcrypt.hashSync(senha, 10);
  await db.collection('admins').deleteMany({ usuario });
  await db.collection('admins').insertOne({ usuario, senhaHash, criadoEm: new Date().toISOString() });
  console.log(`Admin "${usuario}" criado/atualizado com sucesso.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
