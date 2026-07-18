const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function buscarProdutos() {
  const res = await fetch(`${API_URL}/api/produtos`);
  if (!res.ok) throw new Error('Erro ao buscar produtos');
  return res.json();
}

export async function login(usuario, senha) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha }),
  });
  if (!res.ok) {
    const erro = await res.json();
    throw new Error(erro.erro || 'Erro ao fazer login');
  }
  return res.json();
}

export async function criarProduto(token, produto) {
  const res = await fetch(`${API_URL}/api/produtos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(produto),
  });
  if (!res.ok) throw new Error('Erro ao criar produto');
  return res.json();
}

export async function editarProduto(token, id, dados) {
  const res = await fetch(`${API_URL}/api/produtos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao editar produto');
  return res.json();
}

export async function excluirProduto(token, id) {
  const res = await fetch(`${API_URL}/api/produtos/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erro ao excluir produto');
  return res.json();
}

export async function registrarPedido(pedido) {
  const res = await fetch(`${API_URL}/api/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  });
  if (!res.ok) throw new Error('Erro ao registrar pedido');
  return res.json();
}

export async function buscarStatusPedido(id) {
  const res = await fetch(`${API_URL}/api/pedidos/${id}`);
  if (!res.ok) throw new Error('Pedido não encontrado');
  return res.json();
}

export async function buscarResumoVendas(token) {
  const res = await fetch(`${API_URL}/api/pedidos/resumo/dados`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erro ao buscar resumo de vendas');
  return res.json();
}

export async function buscarPedidos(token, limite) {
  const url = limite ? `${API_URL}/api/pedidos?limit=${limite}` : `${API_URL}/api/pedidos`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erro ao buscar pedidos');
  return res.json();
}

export async function atualizarStatusPedido(token, id, status) {
  const res = await fetch(`${API_URL}/api/pedidos/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Erro ao atualizar status');
  return res.json();
}

export async function buscarConfiguracoes() {
  const res = await fetch(`${API_URL}/api/configuracoes`);
  if (!res.ok) throw new Error('Erro ao buscar configurações');
  return res.json();
}

export async function atualizarConfiguracoes(token, dados) {
  const res = await fetch(`${API_URL}/api/configuracoes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao salvar configurações');
  return res.json();
}
