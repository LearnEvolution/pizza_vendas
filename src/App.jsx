import { useState } from "react";
import "./App.css";

export default function App() {
  const [cart, setCart] = useState([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("tudo");

  const menu = [
    // 🍕 PIZZAS
    {
      id: 1,
      nome: "Margherita",
      preco: 29.9,
      categoria: "pizza",
      desc: "Molho, mussarela e manjericão fresco",
      foto: "https://i.imgur.com/dCZrZAb.png"
    },
    {
      id: 2,
      nome: "Calabresa",
      preco: 34.9,
      categoria: "pizza",
      desc: "Calabresa fina com cebola e azeitona",
      foto: "https://i.imgur.com/9mZfVdS.png"
    },
    {
      id: 3,
      nome: "Quatro Queijos",
      preco: 39.9,
      categoria: "pizza",
      desc: "Mussarela, parmesão, provolone e catupiry",
      foto: "https://i.imgur.com/fp0q4bX.png"
    },
    // 🥤 BEBIDAS
    {
      id: 4,
      nome: "Coca-Cola 2L",
      preco: 12.9,
      categoria: "bebida",
      desc: "Refrigerante original 2 litros",
      foto: "https://i.imgur.com/poG9pkW.png"
    },
    {
      id: 5,
      nome: "Guaraná 1L",
      preco: 8.9,
      categoria: "bebida",
      desc: "Guaraná gelado 1 litro",
      foto: "https://i.imgur.com/lGh4u04.png"
    }
  ];

  function addItem(item) {
    setCart((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (found) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qtd: i.qtd + 1 } : i
        );
      }
      return [...prev, { ...item, qtd: 1 }];
    });
  }

  function removeItem(id) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === id ? { ...i, qtd: i.qtd - 1 } : i
        )
        .filter((i) => i.qtd > 0)
    );
  }

  function enviarPedido() {
    if (cart.length === 0) return;

    const msg =
      "🍕 *PEDIDO KING PIZZAS ORIGINAL* 🍕\n\n" +
      cart
        .map(
          (i) => `${i.nome} — ${i.qtd}x = R$ ${(i.qtd * i.preco).toFixed(2)}`
        )
        .join("\n") +
      `\n\nTOTAL: R$ ${total().toFixed(2)}\n\n` +
      "📍 Endereço:\n\n";

    window.open(
      `https://wa.me/5581988267149?text=${encodeURIComponent(msg)}`
    );
  }

  function total() {
    return cart.reduce((acc, i) => acc + i.preco * i.qtd, 0);
  }

  const filtrado = menu.filter((item) => {
    if (categoria !== "tudo" && item.categoria !== categoria) return false;
    if (busca.length > 0 && !item.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="container">

      {/* 🌟 TOP MENU */}
      <header className="header">
        <h1 className="logo">KING PIZZAS ORIGINAL</h1>

        <input
          className="busca"
          placeholder="🔍 Buscar..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <nav className="categoriaMenu">
          <button onClick={() => setCategoria("tudo")}>Tudo</button>
          <button onClick={() => setCategoria("pizza")}>Pizzas</button>
          <button onClick={() => setCategoria("bebida")}>Bebidas</button>
        </nav>
      </header>

      {/* 🍽️ CARDÁPIO */}
      <main className="content">
        <h2 className="title">Cardápio</h2>

        <div className="cards">
          {filtrado.map((item) => (
            <div className="card" key={item.id}>
              <img src={item.foto} alt="" height="120" />
              <h3>{item.nome}</h3>
              <p>{item.desc}</p>
              <p>R$ {item.preco.toFixed(2)}</p>
              <button onClick={() => addItem(item)}>Comprar</button>
            </div>
          ))}
        </div>

        {/* 🧾 CARRINHO */}
        <h2 className="title">Carrinho</h2>

        <div className="cart">
          {cart.length === 0 && (
            <p className="vazio">Carrinho vazio...</p>
          )}

          {cart.map((item) => (
            <div className="cartItem" key={item.id}>
              <span>
                {item.nome} — {item.qtd}x
              </span>

              <div>
                <button onClick={() => removeItem(item.id)}>-</button>
                <button onClick={() => addItem(item)}>+</button>
              </div>
            </div>
          ))}

          {cart.length > 0 && (
            <>
              <h3>Total: R$ {total().toFixed(2)}</h3>

              <button
                style={{
                  marginTop: "15px",
                  padding: "14px 25px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: "red",
                  color: "white",
                  fontSize: "1.1rem",
                }}
                onClick={enviarPedido}
              >
                📲 Enviar Pedido no WhatsApp
              </button>
            </>
          )}
        </div>
      </main>

      {/* 📞 RODAPÉ */}
      <footer className="footer">
        <p>📞 (81) 98826-7149</p>
        <p>© 2025 KING PIZZAS ORIGINAL</p>
      </footer>
    </div>
  );
}
