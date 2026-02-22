import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { calculateCheckoutTotal, processCheckout } from "../services/checkoutService";
import "../assets/Checkout.css";

export const Checkout = ({ cart, setCart }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    houseNo: "",
    street: "",
    locality: "",
    city: "",
    state: "",
    pincode: ""
  });
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);

  useEffect(() => {
    if (cart.length > 0) {
      calculateCheckoutTotal(cart).then(setCheckoutData);
    }
  }, [cart]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await processCheckout(formData, cart);
      alert("Order placed successfully!");
      setCart([]);
      localStorage.removeItem("cart");
      navigate("/product");
    } catch (error) {
      alert("Failed to place order: " + error.message);
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate("/product");
    return null;
  }

  return (
    <div className="checkout-page">
      <Toaster position="top-center" />
      <motion.div
        className="checkout-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="checkout-form">
          <h2>Shipping Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>House No / Building *</label>
              <input
                type="text"
                name="houseNo"
                value={formData.houseNo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Street / Road *</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Locality / Area *</label>
              <input
                type="text"
                name="locality"
                value={formData.locality}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Pincode *</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
              />
            </div>

            <div className="checkout-actions">
              <button
                type="button"
                className="checkout-btn secondary"
                onClick={() => navigate("/cart")}
              >
                Back to Cart
              </button>
              <button
                type="submit"
                className="checkout-btn"
                disabled={loading}
              >
                {loading ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </form>
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          {checkoutData?.items.map((item, index) => (
            <div key={index} className="summary-item">
              <img src={item.image} alt={item.name} />
              <div className="summary-details">
                <h4>{item.name}</h4>
                {item.promotion_label && (
                  <p style={{ fontSize: '0.9rem', color: '#ff6b6b', fontWeight: 'bold', margin: '5px 0' }}>
                    {item.promotion_label}
                  </p>
                )}
                {item.promo_price ? (
                  <div>
                    <div style={{ marginBottom: '5px' }}>
                      <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.95rem' }}>
                        ₹{item.original_price}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#4CAF50' }}>
                      ₹{item.final_price}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>₹{item.final_price}</p>
                )}
              </div>
            </div>
          ))}
          {checkoutData && (
            <>
              <div style={{ borderTop: '1px solid #ddd', paddingTop: '15px', marginTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '500', marginBottom: '8px' }}>
                  <span>Original Price:</span>
                  <span>₹{checkoutData.subtotal}</span>
                </div>
                {checkoutData.totalDiscount > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '500', color: '#4CAF50', marginBottom: '8px' }}>
                      <span>Discounted Price ({Math.round((checkoutData.totalDiscount / checkoutData.subtotal) * 100)}%):</span>
                      <span>₹{checkoutData.totalDiscount}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="summary-total">
                <h3>Total: ₹{checkoutData.finalTotal}</h3>
                <h4>Please Contact Company to make Payments +91 81529 36826</h4>

              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Checkout;
