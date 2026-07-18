import { useState, useEffect } from 'react';
import { login, buscarProdutos, criarProduto, editarProduto, excluirProduto } from './api';
import AdminFinancas from './AdminFinancas';
import AdminPedidos from './AdminPedidos';
import AdminConfiguracoes from './AdminConfiguracoes';

export default function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [novoNome, setNovoNome] = useState('');
  const [novoPreco, setNovoPreco] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('pizza');
  const [novaImagem, setNovaImagem] = useState('');
  const [tela, setTela] = useState('produtos');

  useEffect(() => {
    if (token) carregarProdutos();
  }, [token]);

  async function carregarProdutos() {
    try {
      const lista = await buscarProdutos();
      setProdutos(lista);
    } catch (e) {
      setErro('Erro ao carregar produtos');
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');
    try {
      const { token: novoToken } = await login(usuario, senha);
      localStorage.setItem('adminToken', novoToken);
      setToken(novoToken);
    } catch (e) {
      setErro(e.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem('adminToken');
    setToken('');
  }

  async function handleAdicionar(e) {
    e.preventDefault();
    if (!novoNome || !novoPreco) return;
    try {
      await criarProduto(token, { nome: novoNome, preco: novoPreco, categoria: novaCategoria, imagem: novaImagem });
      setNovoNome('');
      setNovoPreco('');
      setNovaImagem('');
      carregarProdutos();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function handleEditarImagem(produto, novaUrl) {
    try {
      await editarProduto(token, produto._id, { imagem: novaUrl });
      carregarProdutos();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function handleEditarPreco(produto, novoPreco) {
    try {
      await editarProduto(token, produto._id, { preco: novoPreco });
      carregarProdutos();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function handleExcluir(id) {
    if (!confirm('Excluir este produto?')) return;
    try {
      await excluirProduto(token, id);
      carregarProdutos();
    } catch (e) {
      setErro(e.message);
    }
  }

  if (!token) {
    return (
      <div className="admin-shell">
        <div className="admin-header">
          <h1 className="admin-title">🔒 Área do dono</h1>
        </div>
        <div className="admin-card">
          <h2>Entrar</h2>
          <form onSubmit={handleLogin} className="admin-login">
            <input
              type="text"
              placeholder="Usuário"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <button type="submit">Entrar</button>
          </form>
          {erro && <p className="admin-erro">{erro}</p>}
        </div>
        <div className="admin-back-row">
          <a href="#" className="back-link">← Voltar ao cardápio</a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-header">
        <h1 className="admin-title">
          {tela === 'financas' ? '📊 Financeiro' : tela === 'pedidos' ? '📋 Pedidos' : tela === 'loja' ? '⚙️ Loja' : '🍕 Painel do dono'}
        </h1>
        <button className="logout-btn" onClick={handleLogout}>Sair</button>
      </div>

      <div className="aba-row">
        <button
          className={`aba-btn ${tela === 'produtos' ? 'aba-ativa' : ''}`}
          onClick={() => setTela('produtos')}
        >
          🍕 Cardápio
        </button>
        <button
          className={`aba-btn ${tela === 'pedidos' ? 'aba-ativa' : ''}`}
          onClick={() => setTela('pedidos')}
        >
          📋 Pedidos
        </button>
        <button
          className={`aba-btn ${tela === 'financas' ? 'aba-ativa' : ''}`}
          onClick={() => setTela('financas')}
        >
          📊 Financeiro
        </button>
        <button
          className={`aba-btn ${tela === 'loja' ? 'aba-ativa' : ''}`}
          onClick={() => setTela('loja')}
        >
          ⚙️ Loja
        </button>
      </div>

      {tela === 'financas' && <AdminFinancas token={token} />}
      {tela === 'pedidos' && <AdminPedidos token={token} />}
      {tela === 'loja' && <AdminConfiguracoes token={token} />}
      {tela === 'produtos' && (
        <>
          <div className="admin-card">
            <h2>Adicionar item</h2>
            <form onSubmit={handleAdicionar} className="admin-login">
              <select value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)}>
                <option value="pizza">🍕 Pizza</option>
                <option value="bebida">🥤 Bebida</option>
              </select>
              <input
                type="text"
                placeholder="Nome do item"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Preço"
                value={novoPreco}
                onChange={(e) => setNovoPreco(e.target.value)}
              />
              <input
                type="text"
                placeholder="Link da foto (opcional, https://...)"
                value={novaImagem}
                onChange={(e) => setNovaImagem(e.target.value)}
              />
              <button type="submit">Adicionar ➕</button>
            </form>
          </div>

          <div className="admin-card">
            <h2>🍕 Pizzas</h2>
            {produtos.filter((p) => (p.categoria || 'pizza') === 'pizza').length === 0 && (
              <p style={{ color: '#8a7a6a', fontWeight: 600 }}>Nenhuma pizza cadastrada.</p>
            )}
            {produtos
              .filter((p) => (p.categoria || 'pizza') === 'pizza')
              .map((p) => (
                <div key={p._id} className="admin-produto-bloco">
                  <div className="admin-produto-row">
                    <span className="admin-produto-nome">{p.nome}</span>
                    <input
                      type="number"
                      step="0.01"
                      className="admin-produto-preco"
                      defaultValue={p.preco}
                      onBlur={(e) => handleEditarPreco(p, e.target.value)}
                    />
                    <button className="remove-btn" onClick={() => handleExcluir(p._id)} aria-label={`Excluir ${p.nome}`}>×</button>
                  </div>
                  <input
                    type="text"
                    className="admin-produto-imagem"
                    placeholder="Link da foto (https://...)"
                    defaultValue={p.imagem || ''}
                    onBlur={(e) => handleEditarImagem(p, e.target.value)}
                  />
                </div>
              ))}
          </div>

          <div className="admin-card">
            <h2>🥤 Bebidas</h2>
            {produtos.filter((p) => p.categoria === 'bebida').length === 0 && (
              <p style={{ color: '#8a7a6a', fontWeight: 600 }}>Nenhuma bebida cadastrada.</p>
            )}
            {produtos
              .filter((p) => p.categoria === 'bebida')
              .map((p) => (
                <div key={p._id} className="admin-produto-bloco">
                  <div className="admin-produto-row">
                    <span className="admin-produto-nome">{p.nome}</span>
                    <input
                      type="number"
                      step="0.01"
                      className="admin-produto-preco"
                      defaultValue={p.preco}
                      onBlur={(e) => handleEditarPreco(p, e.target.value)}
                    />
                    <button className="remove-btn" onClick={() => handleExcluir(p._id)} aria-label={`Excluir ${p.nome}`}>×</button>
                  </div>
                  <input
                    type="text"
                    className="admin-produto-imagem"
                    placeholder="Link da foto (https://...)"
                    defaultValue={p.imagem || ''}
                    onBlur={(e) => handleEditarImagem(p, e.target.value)}
                  />
                </div>
              ))}
            {erro && <p className="admin-erro">{erro}</p>}
          </div>
        </>
      )}

      <div className="admin-back-row">
        <a href="#" className="back-link">← Voltar ao cardápio</a>
      </div>
    </div>
  );
}
