// CartPage.jsx
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../assets/CartPage.css";

export const CartPage = ({ cart, setCart, setShowCheckout }) => {
  const navigate = useNavigate();

  const totalAmount = cart.reduce((acc, item) => acc + item.price, 0);


  const handleRemove = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  return (
    <div className="fullbg">
    <motion.div
      className="cart-full-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2>🛒 Your Cart</h2>

      {cart.length === 0 ? (
        <p className="empty-cart">Your cart is empty</p>
      ) : (
        <>
          <div className="cart-grid">
            {cart.map((item, index) => (
              <motion.div key={index} className="cart-card" whileHover={{ scale: 1.03 }}>
                <img src={item.image} alt={item.name} />
                <div className="cart-details">
                  <h3>{item.name}</h3>
                  <p>₹{item.price}</p>
                </div>
                <button className="remove-btn" onClick={() => handleRemove(index)}>
                  ❌
                </button>
              </motion.div>
            ))}
          </div>

          <div className="cart-footer">
            <h3>Total Payable: ₹{totalAmount}</h3>
            <div className="cart-actions">
             <button className="btn" onClick={() => navigate("/checkout")}>
  Proceed to Checkout
</button>

              <button className="btn secondary" onClick={() => navigate("/product")}>
                Back to Products
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
    <motion.h1
  className="note"
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: "spring", stiffness: 300, damping: 20, repeat: Infinity, repeatType: "reverse", duration: 1 }}
>
  🚫 Do not Refresh the Page!
</motion.h1>

    </div>
  );
};


