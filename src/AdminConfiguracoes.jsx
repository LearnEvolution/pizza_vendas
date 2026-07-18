import { useState, useEffect } from 'react';
import { buscarConfiguracoes, atualizarConfiguracoes } from './api';

export default function AdminConfiguracoes({ token }) {
  const [promocao, setPromocaoTexto] = useState('');
  const [ativa, setAtiva] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    buscarConfiguracoes()
      .then((dados) => {
        setPromocaoTexto(dados.promocao || '');
        setAtiva(dados.promocaoAtiva || false);
      })
      .catch(() => setErro('Erro ao carregar configurações'))
      .finally(() => setCarregando(false));
  }, []);

  async function salvar() {
    setSalvando(true);
    setErro('');
    setSucesso(false);
    try {
      await atualizarConfiguracoes(token, { promocao, promocaoAtiva: ativa });
      setSucesso(true);
      setTimeout(() => setSucesso(false), 2500);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <p style={{ color: '#8a7a6a', fontWeight: 600 }}>Carregando...</p>;
  }

  return (
    <div className="admin-card">
      <h2>🎉 Promoção do dia</h2>
      <p style={{ fontSize: '0.82rem', color: '#8a7a6a', fontWeight: 600, marginTop: 0 }}>
        Esse texto aparece em destaque no topo do cardápio pros clientes. Use pra combos, datas
        comemorativas, promoções relâmpago etc.
      </p>

      <textarea
        value={promocao}
        onChange={(e) => setPromocaoTexto(e.target.value)}
        maxLength={150}
        rows={3}
        placeholder="Ex: Dia dos Pais especial! Leve 3 pizzas, pague 2 🎁"
        style={{
          width: '100%',
          border: '2px solid #eee0cb',
          background: 'var(--massa)',
          borderRadius: '10px',
          padding: '0.65rem 0.8rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--carvao)',
          fontFamily: 'inherit',
          resize: 'none',
          marginBottom: '0.6rem',
        }}
      />

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.8rem' }}>
        <input type="checkbox" checked={ativa} onChange={(e) => setAtiva(e.target.checked)} />
        Mostrar esse banner no cardápio agora
      </label>

      <button className="avancar-btn" onClick={salvar} disabled={salvando}>
        {salvando ? 'Salvando...' : sucesso ? 'Salvo ✓' : 'Salvar promoção'}
      </button>

      {erro && <p className="admin-erro">{erro}</p>}
    </div>
  );
}
