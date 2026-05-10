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
  const [couponError, setCouponError] = useState("");
  const [userData, setUserData] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [shippingCharge, setShippingCharge] = useState(0);
  const [shippingLabel, setShippingLabel] = useState("FREE");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);
  const [bogoPromotions, setBogoPromotions] = useState([]);
  const [bulkPromotions, setBulkPromotions] = useState([]);

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
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      setAllProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    const fetchPromos = async () => {
      try {
        const bogoSnap = await getDocs(collection(db, "bogo_promotions"));
        setBogoPromotions(bogoSnap.docs.map(doc => doc.data()));
        const bulkSnap = await getDocs(collection(db, "bulk_promotions"));
        setBulkPromotions(bulkSnap.docs.map(doc => doc.data()));
      } catch (e) { console.warn(e); }
    };
    fetchCoupons();
    fetchProducts();
    fetchPromos();
  }, []);

  // Fetch shipping charges and calculate based on user state & order total
  useEffect(() => {
    const calcShipping = async () => {
      if (!checkoutData) return;
      try {
        const docSnap = await getDoc(doc(db, "settings", "shipping"));
        if (!docSnap.exists()) {
          setShippingCharge(0);
          setShippingLabel("FREE");
          return;
        }
        const settings = docSnap.data();
        const orderTotal = checkoutData.finalTotal - couponDiscount;
        setFreeShippingThreshold(settings.free_shipping_threshold || 0);

        // Free shipping threshold
        if (settings.free_shipping_threshold > 0 && orderTotal >= settings.free_shipping_threshold) {
          setShippingCharge(0);
          setShippingLabel("FREE");
          return;
        }

        // Zone-based charge
        let charge = settings.default_charge || 0;
        if (userData && settings.zones && settings.zones.length > 0) {
          const userState = (userData.state || "").toLowerCase().trim();
          const matchedZone = settings.zones.find(z =>
            z.states.split(",").map(s => s.toLowerCase().trim()).includes(userState)
          );
          if (matchedZone) {
            charge = matchedZone.charge;
          }
        }

        if (charge === 0) {
          setShippingLabel("FREE");
        } else {
          setShippingLabel(`₹${charge}`);
        }
        setShippingCharge(charge);
      } catch (error) {
        console.error("Error fetching shipping settings:", error);
        setShippingCharge(0);
        setShippingLabel("FREE");
      }
    };
    calcShipping();
  }, [checkoutData, userData, couponDiscount]);

  const applyCoupon = async () => {
    setCouponError("");
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code to continue.");
      return;
    }
    try {
      const snapshot = await getDocs(collection(db, "coupons"));
      const coupon = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .find(c => c.code === couponCode.toUpperCase() && c.active);
      
      if (!coupon) {
        setCouponError("This coupon code is invalid or no longer active. Please check and try again.");
        return;
      }
      
      const now = new Date();
      if (new Date(coupon.start_date) > now || new Date(coupon.end_date) < now) {
        setCouponError("This coupon has expired and is no longer valid.");
        return;
      }
      
      if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
        setCouponError("This coupon has been fully redeemed and is no longer available.");
        return;
      }
      
      const applicableLots = coupon.applicable_products || [];
      const hasLotRestriction = applicableLots.length > 0;

      const allItemsHavePromo = checkoutData.items.every(item => item.isBundle || item.isBogo || item.promo_price);
      if (allItemsHavePromo) {
        setCouponError("All items in your cart already have an offer applied. Coupons can only be used on items without existing promotions.");
        return;
      }

      const couponEligibleTotal = checkoutData.items.reduce((sum, item) => {
        if (item.isBundle || item.isBogo || item.promo_price) return sum;
        if (hasLotRestriction && !applicableLots.includes(item.lot_id)) return sum;
        return sum + item.final_price;
      }, 0);

      if (couponEligibleTotal === 0) {
        setCouponError(hasLotRestriction
          ? "This coupon doesn't apply to any items in your cart. Check the coupon terms for eligible products."
          : "No eligible items found. Items with BOGO, Bundle, or Sale offers cannot use coupons.");
        return;
      }

      if (couponEligibleTotal < coupon.min_purchase) {
        setCouponError(`You need at least ₹${coupon.min_purchase} worth of eligible items. Current eligible total: ₹${couponEligibleTotal}.`);
        return;
      }
      
      let discount = 0;
      if (coupon.apply_on_subtotal) {
        const subtotal = checkoutData.finalTotal;
        if (coupon.discount_type === "percentage") {
          discount = (subtotal * coupon.discount_value) / 100;
          if (coupon.max_discount > 0 && discount > coupon.max_discount) {
            discount = coupon.max_discount;
          }
        } else {
          discount = Math.min(coupon.discount_value, subtotal);
        }
      } else {
        if (coupon.discount_type === "percentage") {
          discount = (couponEligibleTotal * coupon.discount_value) / 100;
          if (coupon.max_discount > 0 && discount > coupon.max_discount) {
            discount = coupon.max_discount;
          }
        } else {
          discount = Math.min(coupon.discount_value, couponEligibleTotal);
        }
      }
      
      setAppliedCoupon(coupon);
      setCouponDiscount(Math.round(discount));
      setCouponError("");
      toast.success(`Coupon applied! You saved ₹${Math.round(discount)}`);
    } catch (error) {
      setCouponError("Error applying coupon. Please try again.");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponError("");
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
          <div className="checkout-form-card">
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

          {/* Best Offers Section */}
          {(() => {
            const now = new Date();
            const activeBogoPromos = bogoPromotions.filter(p => {
              const startValid = !p.start_datetime || new Date(p.start_datetime) <= now;
              const endValid = !p.end_datetime || new Date(p.end_datetime) >= now;
              return startValid && endValid;
            });
            const activeBulkPromos = bulkPromotions.filter(p => {
              const startValid = !p.start_datetime || new Date(p.start_datetime) <= now;
              const endValid = !p.end_datetime || new Date(p.end_datetime) >= now;
              return startValid && endValid;
            });
            const activeCoupons = availableCoupons.slice(0, 3);
            if (activeBogoPromos.length === 0 && activeBulkPromos.length === 0 && activeCoupons.length === 0) return null;
            return (
              <div className="checkout-form-card" style={{ background: '#fffbf0', border: '1px solid #ffe0b2' }}>
                <h3 style={{ margin: '0 0 15px', color: '#e65100', fontSize: '1.1rem' }}>🔥 Best Offers For You</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

                  {activeBogoPromos.map((promo, idx) => {
                    const purchaseItems = allProducts.filter(p => promo.purchase_lot_ids?.includes(p.lot_id));
                    return (
                      <div key={`bogo-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e1bee7' }}>
                        <div style={{ width: '36px', height: '36px', background: '#f3e5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🎁</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: '600', fontSize: '0.82rem', color: '#7b1fa2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{promo.promotion_name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Buy {promo.purchase_quantity} Get {promo.get_quantity} {promo.for_type === "FREE" ? "FREE" : `${promo.for_discount}% OFF`}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {activeBulkPromos.map((promo, idx) => (
                    <div key={`bulk-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #c8e6c9' }}>
                      <div style={{ width: '36px', height: '36px', background: '#e8f5e9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>📦</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '0.82rem', color: '#388e3c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{promo.marketing_label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#666' }}>Bundle: ₹{promo.offer_price}</p>
                      </div>
                    </div>
                  ))}

                  {activeCoupons.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #d1c4e9' }}>
                      <div style={{ width: '36px', height: '36px', background: '#ede7f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🎟️</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '0.82rem', color: '#4527a0' }}>{c.code}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}{c.min_purchase > 0 ? ` above ₹${c.min_purchase}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            );
          })()}

          {/* Add More Items */}
          {(() => {
            const cartLotIds = cart.filter(i => !i.isBundle).map(i => i.lot_id);
            const suggestions = allProducts.filter(p => !cartLotIds.includes(p.lot_id) && p.inventory !== 0).slice(0, 6);
            if (suggestions.length === 0) return null;
            return (
              <div className="checkout-form-card">
                <h3 style={{ margin: '0 0 15px', color: '#333', fontSize: '1.1rem' }}>🛒 Add More Items</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {suggestions.map(product => (
                    <div
                      key={product.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        background: '#f9f9f9',
                        borderRadius: '8px',
                        border: '1px solid #eee'
                      }}
                    >
                      <img src={product.image} alt={product.name} style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                        <p style={{ margin: '2px 0 0', color: '#4CAF50', fontWeight: 'bold', fontSize: '0.95rem' }}>₹{product.price}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const existing = cart.find(item => !item.isBundle && item.lot_id === product.lot_id);
                          if (existing) {
                            setCart(cart.map(item => !item.isBundle && item.lot_id === product.lot_id ? { ...item, quantity: (item.quantity || 1) + 1 } : item));
                          } else {
                            setCart([...cart, { ...product, quantity: 1 }]);
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
        <div className="order-summary">
          <h2>Order Summary</h2>
          {checkoutData && (() => {
            const applicableLots = appliedCoupon?.applicable_products || [];
            const hasLotRestriction = applicableLots.length > 0;

            const getItemCouponDiscount = (item) => {
              if (!appliedCoupon || item.isBundle || item.isBogo || item.promo_price) return 0;
              if (hasLotRestriction && !applicableLots.includes(item.lot_id)) return 0;
              const eligibleTotal = checkoutData.items.reduce((sum, it) => {
                if (it.isBundle || it.isBogo || it.promo_price) return sum;
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

                  if (item.isBundle && item.isBogo) {
                    return (
                      <div key={index} className="summary-item" style={{ border: '2px solid #9c27b0', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
                        <div className="summary-details">
                          <h4 style={{ color: '#9c27b0', marginBottom: '10px' }}>🎁 {item.name}</h4>
                          {item.same_lot && (
                            <p style={{ fontSize: '0.9rem', color: '#9c27b0', fontStyle: 'italic', margin: '0 0 8px' }}>* Same product for purchase & gift</p>
                          )}
                          <div style={{ background: '#f3e5f5', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '1rem', color: '#7b1fa2', margin: '0 0 6px' }}>Purchase (Buy {item.purchase_quantity}):</p>
                            {(item.purchaseProducts || []).map((p, pIdx) => (
                              <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', margin: '5px 0' }}>
                                <span>• {p.name}</span>
                                <span>₹{p.price} × {item.purchase_quantity} = ₹{p.price * item.purchase_quantity}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ background: '#e8f5e9', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '1rem', color: '#388e3c', margin: '0 0 6px' }}>
                              Gift (Get {item.get_quantity} {item.for_type === "FREE" ? "FREE" : item.for_type === "PERCENT_OFF" ? `at ${item.for_discount}% OFF` : `at ₹${item.for_discount} each`}):
                            </p>
                            {(item.giftProducts || []).map((p, pIdx) => (
                              <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', margin: '5px 0' }}>
                                <span>• {p.name}</span>
                                <span style={{ color: '#388e3c' }}>
                                  {item.for_type === "FREE" ? "FREE" : item.for_type === "PERCENT_OFF" ? `₹${Math.round(p.price * (1 - (item.for_discount || 0) / 100))} × ${item.get_quantity}` : `₹${item.for_discount} × ${item.get_quantity}`}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '1.05rem' }}>₹{item.original_price}</span>
                            <div>
                              <span style={{ fontWeight: 'bold', color: '#9c27b0', fontSize: '1.2rem' }}>₹{item.final_price}</span>
                              {item.discount > 0 && <span style={{ marginLeft: '8px', fontSize: '0.95rem', color: '#4CAF50' }}>Save ₹{item.discount}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (item.isBundle) {
                    return (
                      <div key={index} className="summary-item" style={{ border: '2px solid #4CAF50', padding: '12px', marginBottom: '15px' }}>
                        <div className="summary-details">
                          <h4 style={{ color: '#4CAF50' }}>🎁 {item.name}</h4>
                          <div style={{ margin: '10px 0' }}>
                            {item.products.map((product, pIdx) => (
                              <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', margin: '5px 0' }}>
                                <span>• {product.name}</span>
                                <span>₹{product.price}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
                            <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '1.05rem' }}>₹{item.original_price}</span>
                            <span style={{ marginLeft: '10px', fontWeight: 'bold', color: '#4CAF50', fontSize: '1.2rem' }}>₹{item.final_price}</span>
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
                    <>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                          style={{ flex: 1, padding: '10px', border: couponError ? '1px solid #f44336' : '1px solid #ddd', borderRadius: '5px' }}
                        />
                        <button
                          type="button"
                          onClick={applyCoupon}
                          style={{ padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px 15px',
                          background: '#fff5f5',
                          border: '1px solid #fed7d7',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px'
                        }}>
                          <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>🚫</span>
                          <div>
                            <p style={{ margin: 0, color: '#c53030', fontSize: '0.9rem', fontWeight: '600' }}>Coupon not applicable</p>
                            <p style={{ margin: '4px 0 0', color: '#742a2a', fontSize: '0.82rem' }}>{couponError}</p>
                          </div>
                        </div>
                      )}
                    </>
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
                  <div style={{ padding: '15px 0', borderTop: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', fontSize: '1.05rem' }}>
                      <span style={{ color: '#666' }}>Items Total</span>
                      <span>₹{checkoutData.subtotal}</span>
                    </div>
                    {appliedCoupon?.apply_on_subtotal && couponDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', fontSize: '1.05rem' }}>
                        <span style={{ color: '#667eea' }}>Subtotal after Coupon ({appliedCoupon.code})</span>
                        <span style={{ color: '#667eea', fontWeight: 'bold' }}>₹{checkoutData.finalTotal - couponDiscount}</span>
                      </div>
                    )}
                    {checkoutData.totalDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', fontSize: '1.05rem' }}>
                        <span style={{ color: '#4CAF50' }}>Promo Savings</span>
                        <span style={{ color: '#4CAF50' }}>- ₹{checkoutData.totalDiscount}</span>
                      </div>
                    )}
                    {couponDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', fontSize: '1.05rem' }}>
                        <span style={{ color: '#667eea' }}>Coupon ({appliedCoupon.code})</span>
                        <span style={{ color: '#667eea' }}>- ₹{couponDiscount}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', fontSize: '1.05rem' }}>
                      <span style={{ color: '#666' }}>Delivery</span>
                      <span style={{ color: shippingCharge === 0 ? '#4CAF50' : '#333', fontWeight: '600' }}>{shippingLabel}</span>
                    </div>
                    {shippingCharge === 0 && checkoutData.finalTotal > 0 && (
                      <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#4CAF50', fontWeight: '500' }}>✔ Free shipping applied{freeShippingThreshold > 0 ? ` (orders above ₹${freeShippingThreshold})` : ''}</p>
                    )}
                    {shippingCharge > 0 && freeShippingThreshold > 0 && (
                      <div style={{ margin: '8px 0 0', padding: '10px 12px', background: '#fff8e1', borderRadius: '6px', border: '1px solid #ffe082' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#f57c00', fontWeight: '600' }}>
                          🚚 Add ₹{freeShippingThreshold - (checkoutData.finalTotal - couponDiscount)} more to get FREE delivery!
                        </p>
                        <div style={{ marginTop: '6px', background: '#ffe0b2', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(((checkoutData.finalTotal - couponDiscount) / freeShippingThreshold) * 100, 100)}%`, height: '100%', background: '#ff9800', borderRadius: '4px' }} />
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #333' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.3rem' }}>Total Payable</span>
                      <span style={{ fontWeight: 'bold', fontSize: '1.3rem' }}>₹{checkoutData.finalTotal - couponDiscount + shippingCharge}</span>
                    </div>
                    {(checkoutData.totalDiscount + couponDiscount) > 0 && (
                      <p style={{ textAlign: 'center', color: '#4CAF50', fontWeight: '600', fontSize: '1rem', margin: '12px 0 0' }}>
                        🎉 You're saving ₹{checkoutData.totalDiscount + couponDiscount} on this order!
                      </p>
                    )}
                  </div>
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
