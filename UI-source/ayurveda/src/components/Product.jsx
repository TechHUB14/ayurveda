import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaInstagram, FaPhoneAlt } from "react-icons/fa";
import { db, auth } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "../assets/Product.css";
import bgImage from "../assets/images/check.jpg";
import logo from "../assets/images/2.png";

export const Product = ({ cart, setCart }) => {
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [bulkPromotions, setBulkPromotions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCoupons, setShowCoupons] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "customers", currentUser.uid));
        if (userDoc.exists()) {
          setUserName(userDoc.data().name || currentUser.email);
        } else {
          setUserName(currentUser.email);
        }
      } else {
        setUserName("");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);
        console.log("Products:", productsData);
        
        const promoSnapshot = await getDocs(collection(db, "promotions"));
        const promoData = promoSnapshot.docs.map(doc => doc.data());
        setPromotions(promoData);
        
        try {
          const bulkPromoSnapshot = await getDocs(collection(db, "bulk_promotions"));
          const bulkPromoData = bulkPromoSnapshot.docs.map(doc => doc.data());
          setBulkPromotions(bulkPromoData);
          console.log("Bulk Promotions:", bulkPromoData);
        } catch (bulkError) {
          console.warn("Could not fetch bulk promotions:", bulkError.message);
          setBulkPromotions([]);
        }
        
        const couponSnapshot = await getDocs(collection(db, "coupons"));
        const couponData = couponSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => c.active && new Date(c.end_date) >= new Date());
        setCoupons(couponData);
        
        console.log("Promotions:", promoData);
        console.log("Current datetime:", new Date().toISOString());
        
        setError(null);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to load products: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getActivePromotion = (lotId) => {
    const now = new Date();
    const promo = promotions.find(promo => {
      if (promo.lot_id !== lotId) return false;
      
      const startTime = promo.start_datetime || promo.start_date;
      const endTime = promo.end_datetime || promo.end_date;
      
      const startValid = !startTime || new Date(startTime) <= now;
      const endValid = !endTime || new Date(endTime) >= now;
      
      return startValid && endValid;
    });
    return promo;
  };

  const getBulkPromotionBundles = () => {
    const now = new Date();
    const activeBulkPromos = bulkPromotions.filter(promo => {
      const startTime = promo.start_datetime || promo.start_date;
      const endTime = promo.end_datetime || promo.end_date;
      const startValid = !startTime || new Date(startTime) <= now;
      const endValid = !endTime || new Date(endTime) >= now;
      return startValid && endValid;
    });

    return activeBulkPromos.map(promo => {
      const allLotIds = [...(promo.buy_lot_ids || []), ...(promo.get_lot_ids || [])];
      const bundleProducts = products.filter(p => allLotIds.includes(p.lot_id));
      return { ...promo, products: bundleProducts };
    }).filter(bundle => bundle.products.length > 0);
  };

  const getSingleProductPromotions = () => {
    return products.filter(product => getActivePromotion(product.lot_id));
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setUserName("");
    setShowUserDashboard(false);
  };

  const addToCart = (product) => {
    if (!user) {
      alert("Please login to add items to cart");
      navigate("/login");
      return;
    }
    const existingItem = cart.find(item => !item.isBundle && item.lot_id === product.lot_id);
    if (existingItem) {
      setCart(cart.map(item => 
        !item.isBundle && item.lot_id === product.lot_id 
          ? { ...item, quantity: (item.quantity || 1) + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setSelectedProduct(null);
  };

  const addBundleToCart = (bundle) => {
    if (!user) {
      alert("Please login to add items to cart");
      navigate("/login");
      return;
    }
    const bundleItem = {
      isBundle: true,
      name: bundle.marketing_label,
      products: bundle.products,
      price: bundle.offer_price,
      id: `bundle-${Date.now()}`
    };
    setCart([...cart, bundleItem]);
  };

  return (
    <div className="product-page" style={{ backgroundImage: `url(${bgImage})` }}>
      <div style={{ textAlign: 'center', padding: '20px 0', background: 'transparent', borderBottom: 'none' }}>
        <img src={logo} alt="Trisandhya Ayurveda" style={{ height: '200px', maxWidth: '90%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
      </div>
      <h2 className="product-title">Our Available Products</h2>
      
      {loading && <p style={{textAlign: 'center', fontSize: '1.5rem'}}>Loading products...</p>}
      
      {error && <p style={{textAlign: 'center', color: 'red', fontSize: '1.2rem'}}>{error}</p>}
      
      {!loading && !error && products.length === 0 && (
        <p style={{textAlign: 'center', fontSize: '1.2rem'}}>No products available yet.</p>
      )}
      
      <div className="product-grid">
        {products.map((product) => {
          const activePromo = getActivePromotion(product.lot_id);
          return (
            <motion.div
              className="product-card"
              key={product.id}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setSelectedProduct(product);
                setShowContact(false);
              }}
              style={{ position: 'relative' }}
            >
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
                  fontSize: '0.9rem'
                }}>
                  {activePromo.marketing_label}
                </div>
              )}
              <img src={product.image} alt={product.name} />
              <h3>{product.name}</h3>
              <p className="price">₹{product.price}</p>
              {product.lot_id && <p className="lot-id">Lot ID: {product.lot_id}</p>}
            </motion.div>
          );
        })}
      </div>

      {(getSingleProductPromotions().length > 0 || getBulkPromotionBundles().length > 0) && (
        <>
          <h2 className="product-title" style={{ marginTop: '50px' }}>🔥 Sales & Special Offers</h2>
          <div className="product-grid">
            {getSingleProductPromotions().map((product) => {
              const activePromo = getActivePromotion(product.lot_id);
              return (
                <motion.div
                  className="product-card"
                  key={`sale-${product.id}`}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowContact(false);
                  }}
                  style={{ position: 'relative', border: '2px solid #ff6b6b' }}
                >
                  <h3>{product.name}</h3>
                  <p style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: '1rem', margin: '5px 0' }}>
                    {activePromo.marketing_label}
                  </p>
                  <p style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '1.3rem', margin: '10px 0' }}>
                    Promo Price: ₹{activePromo.promo_price}
                  </p>
                  {product.lot_id && <p className="lot-id">Lot ID: {product.lot_id}</p>}
                </motion.div>
              );
            })}
            {getBulkPromotionBundles().map((bundle, idx) => (
              <motion.div
                className="product-card"
                key={`bundle-${idx}`}
                whileHover={{ scale: 1.05 }}
                style={{ position: 'relative', border: '2px solid #4CAF50' }}
              >
                <h3 style={{ color: '#4CAF50' }}>Bundle Offer</h3>
                <p style={{ fontWeight: 'bold', fontSize: '1rem', margin: '5px 0' }}>
                  {bundle.marketing_label}
                </p>
                <div style={{ margin: '10px 0' }}>
                  {bundle.products.map((product, pIdx) => (
                    <p key={pIdx} style={{ fontSize: '0.9rem', margin: '3px 0' }}>
                      • {product.name}
                    </p>
                  ))}
                </div>
                {bundle.offer_price > 0 && (
                  <p style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '1.3rem', margin: '10px 0' }}>
                    Bundle Price: ₹{bundle.offer_price}
                  </p>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    addBundleToCart(bundle);
                  }}
                  style={{ marginTop: '10px', padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Add Bundle to Cart
                </button>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <motion.h2
        className="product-title"
        animate={{ opacity: [1, 0.8, 1], scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        More Products Coming Soon...!
      </motion.h2>

      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="product-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              className="product-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {getActivePromotion(selectedProduct.lot_id) && (
                <div style={{
                  background: '#ff6b6b',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  marginBottom: '10px'
                }}>
                  {getActivePromotion(selectedProduct.lot_id).marketing_label}
                </div>
              )}
              <img src={selectedProduct.image} alt={selectedProduct.name} />
              <h2>{selectedProduct.name}</h2>
              <p>{selectedProduct.description}</p>
              <h3>₹{selectedProduct.price}</h3>
              {selectedProduct.lot_id && <p style={{color: '#8B4513', fontWeight: 'bold'}}>Lot ID: {selectedProduct.lot_id}</p>}
              <div className="button-row">
                <button onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
                <button onClick={() => setShowContact(true)}>Contact</button>
              </div>
              {showContact && (
                <motion.div
                  className="contact-popup"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <h4>Contact Us to Place Your Order</h4>
                  <p>
                    <FaPhoneAlt />{" "}
                    <a href="https://wa.link/0s0pho" target="_blank" rel="noopener noreferrer">
                      +91 98765 43210
                    </a>
                  </p>
                  <p>
                    <FaInstagram />{" "}
                    <a
                      href="https://www.instagram.com/trisandhya_ayurveda_"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @trisandhya_ayurveda_
                    </a>
                  </p>
                  <button onClick={() => setShowContact(false)}>Close</button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCoupons && (
          <motion.div
            className="product-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCoupons(false)}
          >
            <motion.div
              className="product-modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}
            >
              <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>🎟️ Available Coupons</h2>
              {coupons.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>No active coupons available at the moment.</p>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {coupons.map((coupon) => (
                    <div key={coupon.id} style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      color: 'white',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '1px' }}>{coupon.code}</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                          {coupon.discount_type === "percentage" ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                        </div>
                      </div>
                      {coupon.max_discount > 0 && (
                        <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '10px' }}>Max discount: ₹{coupon.max_discount}</div>
                      )}
                      <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '10px' }}>
                        {coupon.min_purchase > 0 && <div>• Min purchase: ₹{coupon.min_purchase}</div>}
                        <div>• Valid until: {new Date(coupon.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        {coupon.usage_limit > 0 && <div>• Limited to {coupon.usage_limit} uses</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button 
                onClick={() => setShowCoupons(false)}
                style={{ marginTop: '20px', width: '100%', padding: '12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="cart-button"
        whileHover={{ scale: 1.1 }}
        onClick={() => navigate("/cart")}
      >
        View Cart ({cart.length})
      </motion.button>

      <motion.button
        className="home-button"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => navigate("/")}
      >
        Home
      </motion.button>

      {user ? (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
          <motion.button
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowUserDashboard(!showUserDashboard)}
          >
            👤 {userName}
          </motion.button>
          
          <AnimatePresence>
            {showUserDashboard && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: 'absolute',
                  top: '50px',
                  right: '0',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  minWidth: '200px',
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{userName}</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserDashboard(false);
                    navigate('/orders');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    background: 'white',
                    border: 'none',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: '#333'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  📦 My Orders
                </button>
                <button
                  onClick={() => {
                    setShowUserDashboard(false);
                    navigate('/cart');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    background: 'white',
                    border: 'none',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: '#333'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  🛒 My Cart
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    background: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: '#f44336'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  🚪 Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.button
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 1000
          }}
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/login')}
        >
          Login
        </motion.button>
      )}

      <motion.button
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          padding: '15px 25px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setShowCoupons(true)}
      >
        🎟️ View Coupons
      </motion.button>
    </div>
  );
};

export default Product;
