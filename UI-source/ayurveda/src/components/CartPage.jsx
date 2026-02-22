import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "../assets/CartPage.css";

export const CartPage = ({ cart, setCart }) => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    const fetchPromotions = async () => {
      const snapshot = await getDocs(collection(db, "promotions"));
      const data = snapshot.docs.map(doc => doc.data());
      setPromotions(data);
    };
    fetchPromotions();
  }, []);

  const getActivePromotion = (lotId) => {
    const now = new Date();
    return promotions.find(promo => {
      if (promo.lot_id !== lotId) return false;
      const startTime = promo.start_datetime || promo.start_date;
      const endTime = promo.end_datetime || promo.end_date;
      const startValid = !startTime || new Date(startTime) <= now;
      const endValid = !endTime || new Date(endTime) >= now;
      return startValid && endValid;
    });
  };

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
          <>
            <p className="empty-cart">Your cart is empty</p>
            <div className="cart-actions">
              <button className="btn" onClick={() => navigate("/product")}>
                Back to Products
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cart-grid">
              {cart.map((item, index) => {
                const activePromo = getActivePromotion(item.lot_id);
                return (
                  <motion.div key={index} className="cart-card" whileHover={{ scale: 1.03 }} style={{ position: 'relative' }}>
                    {activePromo && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#ff6b6b',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        zIndex: 1
                      }}>
                        {activePromo.marketing_label}
                      </div>
                    )}
                    <img src={item.image} alt={item.name} />
                    <div className="cart-details">
                      <h3>{item.name}</h3>
                      <p>₹{item.price}</p>
                      {item.lot_id && <p className="lot-id">Lot ID: {item.lot_id}</p>}
                    </div>
                    <button className="remove-btn" onClick={() => handleRemove(index)}>
                      ❌
                    </button>
                  </motion.div>
                );
              })}
            </div>

            <div className="cart-footer">
              <h3>Total Payable: ₹{totalAmount}</h3>
              <div className="cart-actions">
                <button className="btn secondary" onClick={() => navigate("/product")}>
                  Back to Products
                </button>
                <button className="btn" onClick={() => navigate("/checkout")}>
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default CartPage;
