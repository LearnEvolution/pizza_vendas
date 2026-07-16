import { useState, useEffect } from "react";
import "./App.css";
import { buscarProdutos, registrarPedido } from "./api";
import AdminPage from "./AdminPage";

const CORES_ACCENT = ["#ffb627", "#2f7a3c", "#e63946", "#ffd166"];

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
  }, []);

  if (rota === "#admin") {
    return <AdminPage />;
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

  async function handleFinalizar() {
    const linkWhats = `https://wa.me/5581986776362?text=Olá!%20Gostaria%20de%20fazer%20um%20pedido:%0A${cart
      .map(
        (item) =>
          `🍕 ${item.name} - ${item.quantity}un - R$${(item.price * item.quantity).toFixed(2)}`
      )
      .join("%0A")}%0A%0ATotal: R$${total.toFixed(2)}`;

    try {
      await registrarPedido({
        itens: cart.map((item) => ({ nome: item.name, preco: item.price, quantidade: item.quantity })),
        total,
      });
    } catch (e) {
      // Mesmo se o registro de venda falhar, não trava o pedido do cliente
      console.error("Não foi possível registrar a venda:", e);
    }

    window.open(linkWhats, "_blank");
  }

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItens = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="app-shell">
      <header className="hero">
        <span className="hero-eyebrow">Feita na hora 🔥</span>
        <h1 className="hero-title">🍕 King Pizzas Original</h1>
        <p className="hero-subtitle">Massa fininha, borda recheada e entrega rapidinha</p>
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
                  <span className="pizza-emoji">{emojiDoProduto(pizza)}</span>
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

          {total > 0 && (
            <div className="cart-bar">
              <div className="cart-bar-info">
                <span className="cart-bar-count">{totalItens} {totalItens === 1 ? "item" : "itens"}</span>
                <span className="cart-bar-total">R$ {total.toFixed(2)}</span>
              </div>
              <button onClick={handleFinalizar} className="whatsapp-button">
                📲 Finalizar
              </button>
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
