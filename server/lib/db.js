const { MongoClient } = require('mongodb');
require('dotenv').config();

let db;

async function conectar() {
  if (db) return db;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.DB_NAME || 'pizza_vendas');
  console.log('MongoDB conectado (pizza_vendas)');
  return db;
}

module.exports = { conectar };
