import { useState, useEffect } from "react";
import "./App.css";
import { buscarProdutos, registrarPedido, buscarConfiguracoes } from "./api";
import AdminPage from "./AdminPage";
import PedidoStatus from "./PedidoStatus";

const CORES_ACCENT = ["#ffb627", "#2f7a3c", "#e63946", "#ffd166"];
const NUMERO_LOJA = "5581986776362"; // <-- número da loja (com DDI+DDD)
const PIX_CHAVE = "meupixteste@.com"; // <-- troque pela sua chave Pix real
const PIX_NOME = "Eupix"; // <-- nome cadastrado na chave Pix
const LOGO_URL = "/logo-king-pizzas.png"; // logo já embutida no projeto

function emojiDaPizza(nome = "") {
  const n = nome.toLowerCase();
  if (n.includes("calabresa") || n.includes("pepperoni")) return "🌶️";
  if (n.includes("frango")) return "🐔";
  if (n.includes("portuguesa")) return "🥚";
  if (n.includes("muçarela") || n.includes("mussarela") || n.includes("marguerita") || n.includes("margherita")) return "🧀";
  if (n.includes("chocolate") || n.includes("doce") || n.includes("brigadeiro")) return "🍫";
  if (n.includes("vegetari")) return "🥦";
  return "🍕";
}

function emojiDaBebida(nome = "") {
  const n = nome.toLowerCase();
  if (n.includes("água") || n.includes("agua")) return "💧";
  if (n.includes("suco")) return "🧃";
  if (n.includes("guaran")) return "🥤";
  if (n.includes("cerveja") || n.includes("chopp")) return "🍺";
  if (n.includes("refrigerante") || n.includes("coca") || n.includes("soda") || n.includes("fanta") || n.includes("sprite")) return "🥤";
  if (n.includes("energ")) return "⚡";
  if (n.includes("vinho")) return "🍷";
  return "🥤";
}

function emojiDoProduto(produto) {
  return produto.categoria === "bebida" ? emojiDaBebida(produto.nome) : emojiDaPizza(produto.nome);
}

export default function App() {
  const [cart, setCart] = useState([]);
  const [pizzas, setPizzas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [rota, setRota] = useState(window.location.hash);
  const [aba, setAba] = useState("pizza");
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [trocoPara, setTrocoPara] = useState("");
  const [pixCopiado, setPixCopiado] = useState(false);
  const [promocao, setPromocao] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erroPedido, setErroPedido] = useState("");
  const [pedidoFeitoId, setPedidoFeitoId] = useState("");

  useEffect(() => {
    function aoMudarHash() {
      setRota(window.location.hash);
    }
    window.addEventListener("hashchange", aoMudarHash);
    return () => window.removeEventListener("hashchange", aoMudarHash);
  }, []);

  useEffect(() => {
    buscarProdutos()
      .then(setPizzas)
      .catch(() => setPizzas([]))
      .finally(() => setCarregando(false));
    buscarConfiguracoes()
      .then(setPromocao)
      .catch(() => setPromocao(null));
  }, []);

  if (rota === "#admin") {
    return <AdminPage />;
  }

  if (rota.startsWith("#pedido/")) {
    return <PedidoStatus id={rota.replace("#pedido/", "")} />;
  }

  function addToCart(pizza) {
    const exists = cart.find((item) => item.id === pizza._id);

    if (exists) {
      setCart(
        cart.map((item) =>
          item.id === pizza._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { id: pizza._id, name: pizza.nome, price: pizza.preco, quantity: 1 }]);
    }
  }

  function removeFromCart(id) {
    setCart(cart.filter((item) => item.id !== id));
  }

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItens = cart.reduce((acc, item) => acc + item.quantity, 0);

  async function handleFinalizar() {
    setErroPedido("");
    if (!nomeCliente.trim() || !telefoneCliente.trim()) {
      setErroPedido("Preenche seu nome e telefone pra gente confirmar o pedido 🙂");
      return;
    }
    if (!formaPagamento) {
      setErroPedido("Escolhe a forma de pagamento (Dinheiro ou Pix) 🙂");
      return;
    }

    // Abre a aba em branco JÁ no clique (senão o navegador bloqueia depois do await)
    const novaAba = window.open("", "_blank");

    setEnviando(true);
    let idPedido = null;
    try {
      const resultado = await registrarPedido({
        itens: cart.map((item) => ({ nome: item.name, preco: item.price, quantidade: item.quantity })),
        total,
        cliente: { nome: nomeCliente.trim(), telefone: telefoneCliente.trim() },
        observacoes: observacoes.trim(),
        pagamento: {
          forma: formaPagamento,
          trocoPara: formaPagamento === "dinheiro" && trocoPara.trim() ? trocoPara.trim() : "",
        },
      });
      idPedido = resultado._id;
      setPedidoFeitoId(idPedido);
    } catch (e) {
      console.error("Não foi possível registrar a venda:", e);
    } finally {
      setEnviando(false);
    }

    const linkAcompanhamento = idPedido
      ? `${window.location.origin}${window.location.pathname}#pedido/${idPedido}`
      : "";

    const linkWhats = `https://wa.me/${NUMERO_LOJA}?text=Olá!%20Meu%20nome%20é%20${encodeURIComponent(
      nomeCliente
    )}.%20Gostaria%20de%20fazer%20um%20pedido:%0A${cart
      .map(
        (item) =>
          `🍕 ${item.name} - ${item.quantity}un - R$${(item.price * item.quantity).toFixed(2)}`
      )
      .join("%0A")}%0A%0ATotal: R$${total.toFixed(2)}${
      formaPagamento === "dinheiro"
        ? `%0A💵%20Pagamento:%20Dinheiro${trocoPara.trim() ? `%20(troco%20para%20R$${encodeURIComponent(trocoPara.trim())})` : ""}`
        : formaPagamento === "pix"
        ? `%0A💳%20Pagamento:%20Pix%20(chave%20${encodeURIComponent(PIX_CHAVE)}%20-%20${encodeURIComponent(PIX_NOME)})`
        : ""
    }${
      observacoes.trim()
        ? `%0A%0A📝%20Observação:%20${encodeURIComponent(observacoes.trim())}`
        : ""
    }${
      linkAcompanhamento
        ? `%0A%0A📍%20Acompanhe%20seu%20pedido:%20${encodeURIComponent(linkAcompanhamento)}`
        : ""
    }`;

    if (novaAba) {
      novaAba.location.href = linkWhats;
    } else {
      // se o navegador bloqueou mesmo assim, tenta de novo como reforço
      window.open(linkWhats, "_blank");
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <span className="hero-eyebrow">Feita na hora 🔥</span>
        {LOGO_URL ? (
          <img src={LOGO_URL} alt="King Pizzas Original" className="hero-logo" />
        ) : (
          <h1 className="hero-title">🍕 King Pizzas Original</h1>
        )}
        <p className="hero-subtitle">Massa fininha, borda recheada e entrega rapidinha</p>
        {promocao?.promocaoAtiva && promocao.promocao && (
          <div className="promo-banner">🎉 {promocao.promocao}</div>
        )}
        <div className="crust-edge" />
      </header>

      <section className="menu-section">
        <h2 className="section-label">🧾 Cardápio</h2>

        <div className="aba-row">
          <button
            className={`aba-btn ${aba === "pizza" ? "aba-ativa" : ""}`}
            onClick={() => setAba("pizza")}
          >
            🍕 Pizzas
          </button>
          <button
            className={`aba-btn ${aba === "bebida" ? "aba-ativa" : ""}`}
            onClick={() => setAba("bebida")}
          >
            🥤 Bebidas
          </button>
        </div>

        {carregando && <p className="loading-note">Carregando cardápio...</p>}

        {!carregando && pizzas.filter((p) => (p.categoria || "pizza") === aba).length === 0 && (
          <div className="empty-menu">
            {aba === "bebida" ? "Nenhuma bebida no cardápio ainda." : "Nenhuma pizza no cardápio ainda."}
          </div>
        )}

        <div className="menu-grid">
          {pizzas
            .filter((p) => (p.categoria || "pizza") === aba)
            .map((pizza, i) => (
              <div className="pizza-card" key={pizza._id}>
                <div
                  className="pizza-card-top"
                  style={{ "--accent": CORES_ACCENT[i % CORES_ACCENT.length] }}
                />
                <div className="pizza-card-body">
                  {pizza.imagem ? (
                    <div className="pizza-foto-wrap">
                      <img src={pizza.imagem} alt={pizza.nome} className="pizza-foto" />
                    </div>
                  ) : (
                    <span className="pizza-emoji">{emojiDoProduto(pizza)}</span>
                  )}
                  <h3 className="pizza-name">{pizza.nome}</h3>
                  <span className="pizza-price">R$ {pizza.preco.toFixed(2)}</span>
                  <button className="add-button" onClick={() => addToCart(pizza)}>
                    Adicionar ➕
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="comanda-section">
        <h2 className="section-label">🛒 Sua comanda</h2>
        <div className="comanda">
          {cart.length === 0 && <p className="comanda-empty">Seu carrinho está vazio. Escolhe uma pizza! 😋</p>}

          {cart.map((item) => (
            <div key={item.id} className="comanda-item">
              <span className="comanda-item-name">
                {item.name} <span style={{ opacity: 0.6 }}>x{item.quantity}</span>
              </span>
              <span className="comanda-item-price">R$ {(item.price * item.quantity).toFixed(2)}</span>
              <button className="remove-btn" onClick={() => removeFromCart(item.id)} aria-label={`Remover ${item.name}`}>
                ×
              </button>
            </div>
          ))}

          {cart.length > 0 && (
            <div className="comanda-total-row">
              <span className="comanda-total-label">Total</span>
              <span className="comanda-total-value">R$ {total.toFixed(2)}</span>
            </div>
          )}

          {total > 0 && !pedidoFeitoId && (
            <div className="dados-cliente">
              <input
                type="text"
                placeholder="Seu nome"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Seu telefone (com DDD)"
                value={telefoneCliente}
                onChange={(e) => setTelefoneCliente(e.target.value)}
              />
              <textarea
                placeholder="Alguma observação? (ex: sem cebola, capricha na borda...)"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                maxLength={300}
                rows={2}
              />

              <p className="pagamento-label">Forma de pagamento</p>
              <div className="pagamento-opcoes">
                <button
                  type="button"
                  className={`pagamento-btn ${formaPagamento === "dinheiro" ? "pagamento-ativo" : ""}`}
                  onClick={() => setFormaPagamento("dinheiro")}
                >
                  💵 Dinheiro
                </button>
                <button
                  type="button"
                  className={`pagamento-btn ${formaPagamento === "pix" ? "pagamento-ativo" : ""}`}
                  onClick={() => {
                    setFormaPagamento("pix");
                    setPixCopiado(false);
                  }}
                >
                  💳 Pix
                </button>
              </div>

              {formaPagamento === "dinheiro" && (
                <div className="pagamento-detalhe">
                  <p>✅ Combinado! O pagamento será em dinheiro na entrega/retirada.</p>
                  <input
                    type="text"
                    placeholder="Troco para quanto? (opcional)"
                    value={trocoPara}
                    onChange={(e) => setTrocoPara(e.target.value)}
                  />
                </div>
              )}

              {formaPagamento === "pix" && (
                <div className="pagamento-detalhe">
                  <p>Pague direto no app do seu banco com a chave abaixo, depois é só enviar o pedido:</p>
                  <div className="pix-chave-box">
                    <div>
                      <span className="pix-chave-valor">{PIX_CHAVE}</span>
                      <span className="pix-chave-nome">{PIX_NOME}</span>
                    </div>
                    <button
                      type="button"
                      className="pix-copiar-btn"
                      onClick={() => {
                        navigator.clipboard?.writeText(PIX_CHAVE);
                        setPixCopiado(true);
                      }}
                    >
                      {pixCopiado ? "Copiado ✓" : "Copiar"}
                    </button>
                  </div>
                </div>
              )}

              {erroPedido && <p className="admin-erro" style={{ margin: '0.3rem 0 0' }}>{erroPedido}</p>}
            </div>
          )}

          {total > 0 && !pedidoFeitoId && (
            <div className="cart-bar">
              <div className="cart-bar-info">
                <span className="cart-bar-count">{totalItens} {totalItens === 1 ? "item" : "itens"}</span>
                <span className="cart-bar-total">R$ {total.toFixed(2)}</span>
              </div>
              <button onClick={handleFinalizar} className="whatsapp-button" disabled={enviando}>
                {enviando ? "Enviando..." : "📲 Finalizar"}
              </button>
            </div>
          )}

          {pedidoFeitoId && (
            <div className="pedido-confirmado">
              <p>🎉 Pedido enviado! Acompanhe o preparo em tempo real:</p>
              <a href={`#pedido/${pedidoFeitoId}`} className="whatsapp-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Acompanhar meu pedido →
              </a>
            </div>
          )}
        </div>
      </section>

      <footer className="footer-note">
        <a href="#admin" className="admin-link">Área do administrador</a>
      </footer>
    </div>
  );
}
