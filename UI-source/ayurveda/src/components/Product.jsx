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

  const addToCart = (product) => {
    setCart([...cart, product]);
    setSelectedProduct(null);
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
