import { useState, useEffect } from 'react';
import { buscarResumoVendas } from './api';

export default function AdminFinancas({ token }) {
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarResumoVendas(token)
      .then(setResumo)
      .catch(() => setErro('Erro ao carregar dados de vendas'))
      .finally(() => setCarregando(false));
  }, [token]);

  if (carregando) {
    return <p style={{ color: '#8a7a6a', fontWeight: 600 }}>Carregando vendas...</p>;
  }

  if (erro) {
    return <p className="admin-erro">{erro}</p>;
  }

  const maiorDia = Math.max(1, ...resumo.vendasPorDia.map((d) => d.total));

  return (
    <>
      <div className="financas-cards">
        <div className="financas-card">
          <span className="financas-card-label">Hoje</span>
          <span className="financas-card-valor">R$ {resumo.hoje.total.toFixed(2)}</span>
          <span className="financas-card-sub">{resumo.hoje.pedidos} pedido(s)</span>
        </div>
        <div className="financas-card">
          <span className="financas-card-label">Últimos 7 dias</span>
          <span className="financas-card-valor">R$ {resumo.semana.total.toFixed(2)}</span>
          <span className="financas-card-sub">{resumo.semana.pedidos} pedido(s)</span>
        </div>
        <div className="financas-card">
          <span className="financas-card-label">Este mês</span>
          <span className="financas-card-valor">R$ {resumo.mes.total.toFixed(2)}</span>
          <span className="financas-card-sub">{resumo.mes.pedidos} pedido(s)</span>
        </div>
      </div>

      <div className="admin-card">
        <h2>📊 Vendas por dia (últimos 7 dias)</h2>
        <div className="grafico-barras">
          {resumo.vendasPorDia.map((d) => (
            <div key={d.data} className="grafico-coluna">
              <span className="grafico-valor">
                {d.total > 0 ? `R$${d.total.toFixed(0)}` : ''}
              </span>
              <div
                className="grafico-barra"
                style={{ height: `${Math.max(4, (d.total / maiorDia) * 100)}px` }}
              />
              <span className="grafico-label">{d.data}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <h2>🏆 Mais vendidos no mês</h2>
        {resumo.maisVendidos.length === 0 && (
          <p style={{ color: '#8a7a6a', fontWeight: 600 }}>Nenhuma venda registrada este mês ainda.</p>
        )}
        {resumo.maisVendidos.map((item, i) => (
          <div key={item.nome} className="ranking-row">
            <span className="ranking-posicao">{i + 1}º</span>
            <span className="ranking-nome">{item.nome}</span>
            <span className="ranking-qtd">{item.quantidade}un</span>
            <span className="ranking-total">R$ {item.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
