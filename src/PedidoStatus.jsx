import { useState, useEffect, useRef } from 'react';
import { buscarStatusPedido } from './api';

const ETAPAS = [
  { chave: 'recebido', label: 'Recebido', emoji: '📥' },
  { chave: 'preparando', label: 'Preparando', emoji: '👨‍🍳' },
  { chave: 'pronto', label: 'Pronto', emoji: '✅' },
  { chave: 'entregue', label: 'Entregue', emoji: '🎉' },
];

function tocarAlerta() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.connect(ganho);
    ganho.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1175, ctx.currentTime + 0.15);
    ganho.gain.setValueAtTime(0.18, ctx.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // navegador bloqueou áudio automático, sem problema
  }
  if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
}

export default function PedidoStatus({ id }) {
  const [pedido, setPedido] = useState(null);
  const [erro, setErro] = useState('');
  const statusAnterior = useRef(null);

  useEffect(() => {
    let ativo = true;

    function carregar() {
      buscarStatusPedido(id)
        .then((dados) => {
          if (!ativo) return;
          if (statusAnterior.current && statusAnterior.current !== dados.status) {
            tocarAlerta();
          }
          statusAnterior.current = dados.status;
          setPedido(dados);
        })
        .catch(() => {
          if (ativo) setErro('Pedido não encontrado.');
        });
    }

    carregar();
    const intervalo = setInterval(carregar, 10000);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [id]);

  if (erro) {
    return (
      <div className="app-shell">
        <div className="menu-section">
          <div className="empty-menu">{erro}</div>
          <div className="admin-back-row">
            <a href="#" className="back-link">← Voltar ao cardápio</a>
          </div>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="app-shell">
        <div className="menu-section">
          <p className="loading-note">Carregando seu pedido...</p>
        </div>
      </div>
    );
  }

  const indiceAtual = ETAPAS.findIndex((e) => e.chave === pedido.status);

  return (
    <div className="app-shell">
      <header className="hero">
        <span className="hero-eyebrow">Acompanhe seu pedido 🍕</span>
        <h1 className="hero-title">King Pizzas Original</h1>
        <p className="hero-subtitle">Total: R$ {pedido.total.toFixed(2)}</p>
        <div className="crust-edge" />
      </header>

      <section className="menu-section">
        <div className="trilha-status">
          {ETAPAS.map((etapa, i) => (
            <div key={etapa.chave} className={`trilha-etapa ${i <= indiceAtual ? 'trilha-ativa' : ''}`}>
              <span className="trilha-emoji">{etapa.emoji}</span>
              <span className="trilha-label">{etapa.label}</span>
              {i < ETAPAS.length - 1 && <span className={`trilha-linha ${i < indiceAtual ? 'trilha-linha-ativa' : ''}`} />}
            </div>
          ))}
        </div>

        <div className="comanda" style={{ marginTop: '1.5rem' }}>
          <h2 style={{ marginTop: 0, fontFamily: '"Baloo 2", sans-serif' }}>Seu pedido</h2>
          {pedido.itens.map((item, i) => (
            <div key={i} className="comanda-item">
              <span className="comanda-item-name">
                {item.nome} <span style={{ opacity: 0.6 }}>x{item.quantidade}</span>
              </span>
              <span className="comanda-item-price">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
            </div>
          ))}
          <div className="comanda-total-row">
            <span className="comanda-total-label">Total</span>
            <span className="comanda-total-value">R$ {pedido.total.toFixed(2)}</span>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#8a7a6a', fontSize: '0.8rem', marginTop: '1rem' }}>
          🔔 Deixa essa página aberta — ela avisa com som quando o status mudar
        </p>
      </section>

      <footer className="footer-note">
        <a href="#" className="admin-link">← Fazer um novo pedido</a>
      </footer>
    </div>
  );
}
