const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { conectar } = require('../lib/db');

const router = express.Router();

// No máximo 8 tentativas de login por IP a cada 10 minutos
const limiteLogin = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  message: { erro: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', limiteLogin, async (req, res) => {
  const { usuario, senha } = req.body;

  // Importante: exige que sejam strings, evitando injeção tipo { "$ne": null }
  if (typeof usuario !== 'string' || typeof senha !== 'string' || !usuario.trim() || !senha) {
    return res.status(400).json({ erro: 'Usuário e senha são obrigatórios' });
  }

  const db = await conectar();
  const admin = await db.collection('admins').findOne({ usuario: usuario.trim() });
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
