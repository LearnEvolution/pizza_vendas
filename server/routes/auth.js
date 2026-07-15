const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { conectar } = require('../lib/db');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) {
    return res.status(400).json({ erro: 'Usuário e senha são obrigatórios' });
  }
  const db = await conectar();
  const admin = await db.collection('admins').findOne({ usuario });
  if (!admin) {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
  }
  const senhaCorreta = bcrypt.compareSync(senha, admin.senhaHash);
  if (!senhaCorreta) {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
  }
  const token = jwt.sign({ usuario: admin.usuario }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

module.exports = router;
