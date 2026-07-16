import { useState, useEffect } from 'react';
import { buscarPedidos, atualizarStatusPedido } from './api';

const ETAPAS = ['recebido', 'preparando', 'pronto', 'entregue'];
const LABEL = {
  recebido: '📥 Recebido',
  preparando: '👨‍🍳 Preparando',
  pronto: '✅ Pronto',
  entregue: '🎉 Entregue',
};
const PROXIMA_ACAO = {
  recebido: 'Iniciar preparo',
  preparando: 'Marcar como pronto',
  pronto: 'Marcar como entregue',
};

function escapeCSV(texto) {
  const valor = String(texto ?? '');
  if (valor.includes(';') || valor.includes('"') || valor.includes('\n')) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function gerarCSV(pedidos) {
  const cabecalho = ['Data', 'Hora', 'Cliente', 'Telefone', 'Itens', 'Total', 'Pagamento', 'Status', 'Observações'];
  const linhas = pedidos.map((p) => {
    const data = new Date(p.criadoEm);
    const itensTexto = p.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(' | ');
    const pagamentoTexto =
      p.pagamento?.forma === 'dinheiro'
        ? `Dinheiro${p.pagamento?.trocoPara ? ` (troco p/ R$${p.pagamento.trocoPara})` : ''}`
        : p.pagamento?.forma === 'pix'
        ? 'Pix'
        : '—';
    return [
      data.toLocaleDateString('pt-BR'),
      data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      escapeCSV(p.cliente?.nome),
      escapeCSV(p.cliente?.telefone),
      escapeCSV(itensTexto),
      p.total.toFixed(2).replace('.', ','),
      escapeCSV(pagamentoTexto),
      LABEL[p.status] || p.status,
      escapeCSV(p.observacoes),
    ].join(';');
  });
  return [cabecalho.join(';'), ...linhas].join('\r\n');
}

export default function AdminPedidos({ token }) {
  const [pedidos, setPedidos] = useState([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, 15000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function carregar() {
    buscarPedidos(token)
      .then(setPedidos)
      .catch(() => setErro('Erro ao carregar pedidos'))
      .finally(() => setCarregando(false));
  }

  async function avancar(pedido) {
    const indice = ETAPAS.indexOf(pedido.status);
    const proximo = ETAPAS[indice + 1];
    if (!proximo) return;
    try {
      await atualizarStatusPedido(token, pedido._id, proximo);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  function linkWhatsCliente(pedido) {
    const numero = pedido.cliente?.telefone?.replace(/\D/g, '');
    return `https://wa.me/55${numero}`;
  }

  async function exportarCSV() {
    setExportando(true);
    try {
      const todos = await buscarPedidos(token, 1000);
      const csv = '\ufeff' + gerarCSV(todos);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vendas-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro('Erro ao exportar vendas');
    } finally {
      setExportando(false);
    }
  }

  if (carregando) {
    return <p style={{ color: '#8a7a6a', fontWeight: 600 }}>Carregando pedidos...</p>;
  }

  return (
    <>
      <button className="exportar-btn" onClick={exportarCSV} disabled={exportando}>
        {exportando ? 'Gerando arquivo...' : '📥 Exportar vendas (CSV/Excel)'}
      </button>

      {erro && <p className="admin-erro">{erro}</p>}
      {pedidos.length === 0 && (
        <div className="admin-card">
          <p style={{ color: '#8a7a6a', fontWeight: 600, margin: 0 }}>Nenhum pedido ainda.</p>
        </div>
      )}
      {pedidos.map((pedido) => (
        <div key={pedido._id} className={`pedido-card status-${pedido.status}`}>
          <div className="pedido-topo">
            <div>
              <span className="pedido-cliente">{pedido.cliente?.nome || 'Cliente'}</span>
              <a href={linkWhatsCliente(pedido)} target="_blank" rel="noreferrer" className="pedido-telefone">
                📞 {pedido.cliente?.telefone || '—'}
              </a>
            </div>
            <span className={`status-badge badge-${pedido.status}`}>{LABEL[pedido.status]}</span>
          </div>

          <div className="pedido-itens">
            {pedido.itens.map((item, i) => (
              <span key={i} className="pedido-item-linha">
                {item.quantidade}x {item.nome}
              </span>
            ))}
          </div>

          {pedido.observacoes && (
            <p className="pedido-obs">📝 {pedido.observacoes}</p>
          )}

          {pedido.pagamento?.forma && (
            <p className="pedido-obs">
              {pedido.pagamento.forma === 'pix'
                ? '💳 Pagamento: Pix'
                : `💵 Pagamento: Dinheiro${pedido.pagamento.trocoPara ? ` (troco p/ R$${pedido.pagamento.trocoPara})` : ''}`}
            </p>
          )}

          <div className="pedido-rodape">
            <span className="pedido-total">R$ {pedido.total.toFixed(2)}</span>
            <span className="pedido-hora">
              {new Date(pedido.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {PROXIMA_ACAO[pedido.status] && (
            <button className="avancar-btn" onClick={() => avancar(pedido)}>
              {PROXIMA_ACAO[pedido.status]} →
            </button>
          )}
        </div>
      ))}
    </>
  );
}
