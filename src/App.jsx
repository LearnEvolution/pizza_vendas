import { useState } from "react";

export default function App() {
  const pizzas = [
    { id: 1, name: "Pizza Calabresa", price: 35 },
    { id: 2, name: "Pizza Mussarela", price: 32 },
    { id: 3, name: "Pizza Portuguesa", price: 38 },
  ];

  const [cart, setCart] = useState([]);

  const addToCart = (pizza) => {
    const exists = cart.find((item) => item.id === pizza.id);

    if (exists) {
      setCart(
        cart.map((item) =>
          item.id === pizza.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...pizza, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(
      cart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const finalizarPedido = () => {
    if (cart.length === 0) {
      alert("Carrinho vazio!");
      return;
    }

    let message = "📦 *Pedido de Pizza*\n\n";

    cart.forEach((item) => {
      message += `🍕 ${item.name} — ${item.quantity}x = R$ ${
        item.price * item.quantity
      }\n`;
    });

    message += `\n💵 *Total:* R$ ${total}`;

    const phone = "5581988267149"; // altere para seu número
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };

  return (
    <div style={{ padding: "20px", color: "white", backgroundColor: "#1b1b1b", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", fontSize: "38px" }}>
        Pizzas 🍕
      </h1>

      {pizzas.map((pizza) => (
        <div
          key={pizza.id}
          style={{
            border: "2px solid white",
            padding: "20px",
            margin: "20px auto",
            width: "300px",
            textAlign: "center",
            borderRadius: "10px",
          }}
        >
          <h2>{pizza.name}</h2>
          <p>Preço: R$ {pizza.price}</p>

          <button
            onClick={() => addToCart(pizza)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#111",
              color: "white",
              borderRadius: "6px",
              border: "1px solid white",
              cursor: "pointer",
            }}
          >
            Adicionar
          </button>
        </div>
      ))}

      <h2 style={{ marginTop: "40px", textAlign: "center", fontSize: "30px" }}>
        Carrinho 🛒
      </h2>

      {cart.length === 0 && (
        <p style={{ textAlign: "center" }}>Carrinho vazio 😢</p>
      )}

      {cart.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            backgroundColor: "#333",
            padding: "10px",
            margin: "10px auto",
            width: "300px",
            borderRadius: "8px",
          }}
        >
          <span>
            {item.name} — {item.quantity}x
          </span>

          <div>
            <button
              onClick={() => removeFromCart(item.id)}
              style={{
                marginRight: "10px",
                backgroundColor: "red",
                color: "black",
                fontWeight: "bold",
                width: "30px",
                height: "30px",
              }}
            >
              -
            </button>

            <button
              onClick={() => addToCart(item)}
              style={{
                backgroundColor: "lime",
                color: "black",
                fontWeight: "bold",
                width: "30px",
                height: "30px",
              }}
            >
              +
            </button>
          </div>
        </div>
      ))}

      <h3 style={{ textAlign: "center", marginTop: "20px", fontSize: "22px" }}>
        Total: R$ {total}
      </h3>

      <button
        onClick={finalizarPedido}
        style={{
          marginTop: "20px",
          padding: "12px 20px",
          fontSize: "18px",
          fontWeight: "bold",
          color: "white",
          backgroundColor: "#25D366",
          borderRadius: "8px",
          cursor: "pointer",
          border: "none",
          width: "100%",
        }}
      >
        Finalizar Pedido no WhatsApp 📱
      </button>
    </div>
  );
}
