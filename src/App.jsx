import { useState } from "react";
import "./App.css";

export default function App() {
  const [cart, setCart] = useState([]);

  const pizzas = [
    { id: 1, name: "Mussarela", price: 39.9 },
    { id: 2, name: "Calabresa", price: 42.9 },
    { id: 3, name: "Frango c/ Catupiry", price: 44.9 },
    { id: 4, name: "Portuguesa", price: 47.9 },
  ];

  function addToCart(pizza) {
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
  }

  function removeFromCart(id) {
    setCart(cart.filter((item) => item.id !== id));
  }

  const total = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="container">

      <h1 className="title">🍕 KING PIZZAS ORIGINAL</h1>

      <div className="menu">
        {pizzas.map((pizza) => (
          <div key={pizza.id} className="card">
            <h3>{pizza.name}</h3>
            <p>R$ {pizza.price.toFixed(2)}</p>
            <button onClick={() => addToCart(pizza)}>Adicionar ➕</button>
          </div>
        ))}
      </div>

      <h2 className="cart-title">🛒 Carrinho</h2>

      {cart.map((item) => (
        <div key={item.id} className="cart-item">
          <span>
            {item.name} x {item.quantity}
          </span>
          <strong>R$ {(item.price * item.quantity).toFixed(2)}</strong>
          <button onClick={() => removeFromCart(item.id)}>❌</button>
        </div>
      ))}

      <h2 className="total">Total: R$ {total.toFixed(2)}</h2>

      {total > 0 && (
        <a
          href={`https://wa.me/5581988267149?text=Olá!%20Gostaria%20de%20fazer%20um%20pedido:%0A${cart
            .map(
              (item) =>
                `🍕 ${item.name} - ${item.quantity}un - R$${(
                  item.price * item.quantity
                ).toFixed(2)}`
            )
            .join("%0A")}%0A%0ATotal: R$${total.toFixed(2)}`}
          target="_blank"
          className="whatsapp-button"
        >
          📲 Finalizar pedido no WhatsApp
        </a>
      )}
    </div>
  );
}
