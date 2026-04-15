import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import SEO from "./common/SEO";
import "../assets/CartPage.css";
import logo from "../assets/images/2.png";

export const CartPage = ({ cart, setCart, voice }) => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    if (!voice) return;
    const handleCommand = (text) => {
      if (text.includes("remove") || text.includes("delete")) {
        const name = text.replace(/^(remove|delete)\s+/, "");
        const idx = cart.findIndex(item => item.name.toLowerCase().includes(name));
        if (idx !== -1) {
          const removed = cart[idx].name;
          const updated = [...cart];
          updated.splice(idx, 1);
          setCart(updated);
          voice.speak(`Removed ${removed} from cart`);
        } else {
          voice.speak("Could not find that item in your cart");
        }
        return true;
      }
      if (text.includes("clear cart") || text.includes("empty cart")) {
        setCart([]);
        voice.speak("Cart cleared");
        return true;
      }
      if (text.includes("how many") || text.includes("cart total") || text.includes("what's in")) {
        if (cart.length === 0) {
          voice.speak("Your cart is empty");
        } else {
          const names = cart.map(i => i.name).join(", ");
          voice.speak(`You have ${cart.length} items: ${names}. Total is ${totalAmount} rupees.`);
        }
        return true;
      }
      if (text.includes("place order") || text.includes("proceed")) {
        if (cart.length > 0) {
          voice.speak("Proceeding to checkout");
          navigate("/checkout");
        } else {
          voice.speak("Your cart is empty");
        }
        return true;
      }
      return false;
    };
    voice.registerVoiceActions({ handleCommand });
    return () => voice.unregisterVoiceActions(["handleCommand"]);
  }, [voice, cart, setCart, navigate]);

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

  const totalAmount = cart.reduce((acc, item) => {
    if (item.isBundle) return acc + (item.price || 0);
    return acc + (item.price || 0) * (item.quantity || 1);
  }, 0);

  const handleRemove = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const updated = [...cart];
    updated[index] = { ...updated[index], quantity: newQuantity };
    setCart(updated);
  };

  return (
    <div className="fullbg">
      <SEO title="Cart" description="Review your cart and proceed to checkout at Trisandhya Ayurveda." />
      <div style={{ textAlign: 'center', padding: '20px 0', background: 'transparent', borderBottom: 'none', marginBottom: '30px' }}>
        <img src={logo} alt="Trisandhya Ayurveda" style={{ height: '200px', maxWidth: '90%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
      </div>
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
                if (item.isBundle) {
                  return (
                    <motion.div key={index} className="cart-card" whileHover={{ scale: 1.03 }} style={{ position: 'relative', border: '2px solid #4CAF50' }}>
                      <div className="cart-details">
                        <h3 style={{ color: '#4CAF50' }}>🎁 {item.name}</h3>
                        <div style={{ margin: '10px 0' }}>
                          {item.products.map((product, pIdx) => (
                            <p key={pIdx} style={{ fontSize: '0.9rem', margin: '3px 0' }}>
                              • {product.name}
                            </p>
                          ))}
                        </div>
                        <p style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '1.2rem' }}>₹{item.price}</p>
                      </div>
                      <button className="remove-btn" onClick={() => handleRemove(index)}>
                        ❌
                      </button>
                    </motion.div>
                  );
                }
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                        <button onClick={() => updateQuantity(index, (item.quantity || 1) - 1)} style={{ padding: '5px 10px', cursor: 'pointer' }}>-</button>
                        <span style={{ fontWeight: 'bold' }}>Qty: {item.quantity || 1}</span>
                        <button onClick={() => updateQuantity(index, (item.quantity || 1) + 1)} style={{ padding: '5px 10px', cursor: 'pointer' }}>+</button>
                      </div>
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
