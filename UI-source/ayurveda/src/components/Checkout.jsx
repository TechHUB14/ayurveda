import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { calculateCheckoutTotal, processCheckout } from "../services/checkoutService";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import SEO from "./common/SEO";
import "../assets/Checkout.css";
import logo from "../assets/images/2.png";

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
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [userData, setUserData] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
      } else {
        const userDoc = await getDoc(doc(db, "customers", user.uid));
        if (userDoc.exists()) {
          setUserData({ ...userDoc.data(), uid: user.uid });
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (cart.length > 0) {
      calculateCheckoutTotal(cart).then(setCheckoutData);
    }
  }, [cart]);

  useEffect(() => {
    const fetchCoupons = async () => {
      const snapshot = await getDocs(collection(db, "coupons"));
      const now = new Date();
      const coupons = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(c => c.active && new Date(c.end_date) >= now && (c.usage_limit === 0 || c.used_count < c.usage_limit));
      setAvailableCoupons(coupons);
    };
    fetchCoupons();
  }, []);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    try {
      const snapshot = await getDocs(collection(db, "coupons"));
      const coupon = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .find(c => c.code === couponCode.toUpperCase() && c.active);
      
      if (!coupon) {
        toast.error("Invalid coupon code");
        return;
      }
      
      const now = new Date();
      if (new Date(coupon.start_date) > now || new Date(coupon.end_date) < now) {
        toast.error("Coupon has expired");
        return;
      }
      
      if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
        toast.error("Coupon usage limit reached");
        return;
      }
      
      const applicableLots = coupon.applicable_products || [];
      const hasLotRestriction = applicableLots.length > 0;

      const couponEligibleTotal = checkoutData.items.reduce((sum, item) => {
        if (item.isBundle || item.promo_price) return sum;
        if (hasLotRestriction && !applicableLots.includes(item.lot_id)) return sum;
        return sum + item.final_price;
      }, 0);

      if (couponEligibleTotal === 0) {
        toast.error(hasLotRestriction
          ? "This coupon is not applicable to any items in your cart."
          : "All items already have promotions. Coupon cannot be applied.");
        return;
      }

      if (couponEligibleTotal < coupon.min_purchase) {
        toast.error(`Minimum purchase of ₹${coupon.min_purchase} required on eligible items`);
        return;
      }
      
      let discount = 0;
      if (coupon.discount_type === "percentage") {
        discount = (couponEligibleTotal * coupon.discount_value) / 100;
        if (coupon.max_discount > 0 && discount > coupon.max_discount) {
          discount = coupon.max_discount;
        }
      } else {
        discount = Math.min(coupon.discount_value, couponEligibleTotal);
      }
      
      setAppliedCoupon(coupon);
      setCouponDiscount(Math.round(discount));
      toast.success(`Coupon applied! You saved ₹${Math.round(discount)}`);
    } catch (error) {
      toast.error("Error applying coupon");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    toast.success("Coupon removed");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await processCheckout(userData, cart);
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
      <SEO title="Checkout" description="Complete your order at Trisandhya Ayurveda. Secure checkout for Ayurvedic products." />
      <Toaster position="top-center" />
      <motion.div
        className="checkout-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="checkout-form">
          <h2>Shipping Details</h2>
          {userData ? (
            <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
              <p><strong>Name:</strong> {userData.name}</p>
              <p><strong>Phone:</strong> {userData.phone}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Address:</strong> {userData.houseNo}, {userData.street}, {userData.locality}, {userData.city}, {userData.state} - {userData.pincode}</p>
            </div>
          ) : (
            <p>Loading user details...</p>
          )}
          <form onSubmit={handleSubmit}>
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
                disabled={loading || !userData}
              >
                {loading ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </form>
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          {checkoutData && (() => {
            const applicableLots = appliedCoupon?.applicable_products || [];
            const hasLotRestriction = applicableLots.length > 0;

            const getItemCouponDiscount = (item) => {
              if (!appliedCoupon || item.isBundle || item.promo_price) return 0;
              if (hasLotRestriction && !applicableLots.includes(item.lot_id)) return 0;
              const eligibleTotal = checkoutData.items.reduce((sum, it) => {
                if (it.isBundle || it.promo_price) return sum;
                if (hasLotRestriction && !applicableLots.includes(it.lot_id)) return sum;
                return sum + it.final_price;
              }, 0);
              if (eligibleTotal === 0) return 0;
              return Math.round((item.final_price / eligibleTotal) * couponDiscount);
            };

            return (
              <>
                {checkoutData.items.map((item, index) => {
                  const itemCouponDisc = getItemCouponDiscount(item);
                  const isCouponApplied = itemCouponDisc > 0;

                  if (item.isBundle) {
                    return (
                      <div key={index} className="summary-item" style={{ border: '2px solid #4CAF50', padding: '10px', marginBottom: '15px' }}>
                        <div className="summary-details">
                          <h4 style={{ color: '#4CAF50' }}>🎁 {item.name}</h4>
                          <div style={{ margin: '10px 0' }}>
                            {item.products.map((product, pIdx) => (
                              <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', margin: '5px 0' }}>
                                <span>• {product.name}</span>
                                <span>₹{product.price}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
                            <span style={{ textDecoration: 'line-through', color: '#999' }}>₹{item.original_price}</span>
                            <span style={{ marginLeft: '10px', fontWeight: 'bold', color: '#4CAF50', fontSize: '1.1rem' }}>₹{item.final_price}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className="summary-item">
                      <img src={item.image} alt={item.name} />
                      <div className="summary-details">
                        <h4>{item.name} {item.quantity > 1 && `x ${item.quantity}`}</h4>
                        {item.promotion_label && (
                          <p style={{ fontSize: '0.85rem', color: '#ff6b6b', fontWeight: 'bold', margin: '4px 0' }}>
                            {item.promotion_label}
                          </p>
                        )}
                        {item.promo_price ? (
                          <div>
                            <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.95rem' }}>
                              ₹{item.original_price * item.quantity}
                            </span>
                            <span style={{ marginLeft: '10px', fontSize: '1.1rem', fontWeight: 'bold', color: '#4CAF50' }}>
                              ₹{item.final_price}
                            </span>
                          </div>
                        ) : isCouponApplied ? (
                          <div>
                            <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.95rem' }}>
                              ₹{item.final_price}
                            </span>
                            <span style={{ marginLeft: '10px', fontSize: '1.1rem', fontWeight: 'bold', color: '#667eea' }}>
                              ₹{item.final_price - itemCouponDisc}
                            </span>
                            <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#667eea' }}>({appliedCoupon.code})</span>
                          </div>
                        ) : (
                          <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>₹{item.final_price}</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Coupon Input */}
                <div style={{ margin: '20px 0', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '10px' }}>Have a Coupon?</h4>
                  {!appliedCoupon && availableCoupons.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>Available Coupons (tap to apply):</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {availableCoupons.map(c => (
                          <div
                            key={c.id}
                            onClick={() => setCouponCode(c.code)}
                            style={{
                              padding: '8px 12px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {c.code} - {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!appliedCoupon ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        style={{ padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#e8f5e9', borderRadius: '5px' }}>
                      <div>
                        <strong style={{ color: '#4CAF50' }}>{appliedCoupon.code}</strong>
                        <span style={{ marginLeft: '10px', fontSize: '0.9rem' }}>-₹{couponDiscount}</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        style={{ padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Subtotal */}
                <div className="summary-total">
                  <h3>Subtotal: ₹{checkoutData.finalTotal - couponDiscount}</h3>
                  <h4>Please Contact Company to make Payments +91 81529 36826</h4>
                </div>
              </>
            );
          })()}
        </div>
      </motion.div>
    </div>
  );
};

export default Checkout;
