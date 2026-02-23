import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaInstagram, FaPhoneAlt } from "react-icons/fa";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "../assets/Product.css";
import bgImage from "../assets/images/check.jpg";

export const Product = ({ cart, setCart }) => {
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [bulkPromotions, setBulkPromotions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

  const addToCart = (product) => {
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
    </div>
  );
};

export default Product;
