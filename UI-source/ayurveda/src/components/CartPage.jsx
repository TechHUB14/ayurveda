import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import SEO from "./common/SEO";
import "../assets/CartPage.css";
import logo from "../assets/images/2.png";

export const CartPage = ({ cart, setCart }) => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const promoSnapshot = await getDocs(collection(db, "promotions"));
      setPromotions(promoSnapshot.docs.map(doc => doc.data()));
      const prodSnapshot = await getDocs(collection(db, "products"));
      setProducts(prodSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
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
                    <motion.div key={index} className="cart-card" whileHover={{ scale: 1.03 }} style={{ position: 'relative', border: item.isBogo ? '2px solid #9c27b0' : '2px solid #4CAF50' }}>
                      <div className="cart-details">
                        <h3 style={{ color: item.isBogo ? '#9c27b0' : '#4CAF50' }}>🎁 {item.name}</h3>
                        {item.isBogo ? (
                          <>
                            <div style={{ background: '#f3e5f5', borderRadius: '6px', padding: '12px', margin: '10px 0' }}>
                              <p style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 'bold', color: '#7b1fa2' }}>Purchase (Buy {item.purchase_quantity}):</p>
                              {(item.purchaseProducts || []).map((p, pIdx) => (
                                <div key={pIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '6px 0' }}>
                                  <img src={p.image} alt={p.name} style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                                  <span style={{ fontSize: '1rem', flex: 1 }}>{p.name}</span>
                                  <span style={{ fontSize: '0.95rem', color: '#666' }}>₹{p.price} × {item.purchase_quantity}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ background: '#e8f5e9', borderRadius: '6px', padding: '12px', margin: '10px 0' }}>
                              <p style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 'bold', color: '#388e3c' }}>
                                Gift (Get {item.get_quantity} {item.for_type === "FREE" ? "FREE" : item.for_type === "PERCENT_OFF" ? `${item.for_discount}% OFF` : `₹${item.for_discount} each`}):
                              </p>
                              {(item.giftProducts || []).map((p, pIdx) => (
                                <div key={pIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '6px 0' }}>
                                  <img src={p.image} alt={p.name} style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                                  <span style={{ fontSize: '1rem', flex: 1 }}>{p.name}</span>
                                  <span style={{ fontSize: '0.95rem', color: '#388e3c' }}>
                                    {item.for_type === "FREE" ? "FREE" : item.for_type === "PERCENT_OFF" ? `₹${Math.round(p.price * (1 - (item.for_discount || 0) / 100))}` : `₹${item.for_discount}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div style={{ margin: '10px 0' }}>
                            {item.products.map((product, pIdx) => (
                              <p key={pIdx} style={{ fontSize: '0.9rem', margin: '3px 0' }}>
                                • {product.name}
                              </p>
                            ))}
                          </div>
                        )}
                        <p style={{ color: item.isBogo ? '#9c27b0' : '#4CAF50', fontWeight: 'bold', fontSize: '1.2rem' }}>₹{item.price}</p>
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

            {/* Add More Items Section */}
            {(() => {
              const cartLotIds = cart.filter(i => !i.isBundle).map(i => i.lot_id);
              const suggestions = products.filter(p => !cartLotIds.includes(p.lot_id) && p.inventory !== 0).slice(0, 6);
              if (suggestions.length === 0) return null;
              return (
                <div style={{ marginTop: '30px' }}>
                  <h3 style={{ marginBottom: '15px', color: '#333' }}>🛍️ Add More Items</h3>
                  <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {suggestions.map(product => (
                      <motion.div
                        key={product.id}
                        whileHover={{ scale: 1.03 }}
                        style={{
                          minWidth: '160px',
                          maxWidth: '160px',
                          background: 'white',
                          borderRadius: '12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                        <div style={{ padding: '10px' }}>
                          <p style={{ margin: '0 0 5px', fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                          <p style={{ margin: '0 0 8px', color: '#4CAF50', fontWeight: 'bold', fontSize: '1rem' }}>₹{product.price}</p>
                          <button
                            onClick={() => {
                              const existing = cart.find(item => !item.isBundle && item.lot_id === product.lot_id);
                              if (existing) {
                                setCart(cart.map(item => !item.isBundle && item.lot_id === product.lot_id ? { ...item, quantity: (item.quantity || 1) + 1 } : item));
                              } else {
                                setCart([...cart, { ...product, quantity: 1 }]);
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '8px',
                              background: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.8rem'
                            }}
                          >
                            + Add to Cart
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default CartPage;
