import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaInstagram, FaPhoneAlt } from "react-icons/fa";
import { db, auth } from "../firebase";
import { collection, getDocs, addDoc, query, where, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import SEO from "./common/SEO";
import "../assets/Product.css";
import bgImage from "../assets/images/check.jpg";
import logo from "../assets/images/2.png";

export const Product = ({ cart, setCart }) => {
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [bulkPromotions, setBulkPromotions] = useState([]);
  const [bogoPromotions, setBogoPromotions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCoupons, setShowCoupons] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showBogoModal, setShowBogoModal] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const navigate = useNavigate();


  const fetchReviews = async (lotId) => {
    const q = query(collection(db, "reviews"), where("lot_id", "==", lotId));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setReviews(data);
  };

  const submitReview = async (lotId) => {
    if (!user) { alert("Please login to leave a review"); navigate("/login"); return; }
    if (reviewRating === 0) { alert("Please select a rating"); return; }
    if (!reviewText.trim()) { alert("Please write a review"); return; }
    setSubmittingReview(true);
    try {
      await addDoc(collection(db, "reviews"), {
        lot_id: lotId,
        userId: user.uid,
        userName: userName || "Anonymous",
        rating: reviewRating,
        text: reviewText.trim(),
        createdAt: Timestamp.now()
      });
      setReviewText("");
      setReviewRating(0);
      fetchReviews(lotId);
    } catch (err) {
      alert("Error submitting review: " + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getAvgRating = (lotId) => {
    const prodReviews = reviews.filter(r => r.lot_id === lotId);
    if (prodReviews.length === 0) return null;
    const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
    return { avg: avg.toFixed(1), count: prodReviews.length };
  };

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
        
        try {
          const bogoSnapshot = await getDocs(collection(db, "bogo_promotions"));
          const bogoData = bogoSnapshot.docs.map(doc => doc.data());
          setBogoPromotions(bogoData);
        } catch (bogoError) {
          console.warn("Could not fetch BOGO promotions:", bogoError.message);
          setBogoPromotions([]);
        }
        
        const couponSnapshot = await getDocs(collection(db, "coupons"));
        const couponData = couponSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => c.active && new Date(c.end_date) >= new Date());
        setCoupons(couponData);

        const reviewSnapshot = await getDocs(collection(db, "reviews"));
        setReviews(reviewSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        
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

  const getActiveBogoPromotion = (lotId) => {
    const now = new Date();
    return bogoPromotions.find(promo => {
      const startValid = !promo.start_datetime || new Date(promo.start_datetime) <= now;
      const endValid = !promo.end_datetime || new Date(promo.end_datetime) >= now;
      return startValid && endValid && promo.purchase_lot_ids?.includes(lotId);
    });
  };

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
          ? { ...item, quantity: (item.quantity || 1) + modalQuantity }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: modalQuantity }]);
    }
    setSelectedProduct(null);
    setModalQuantity(1);
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

  const addBogoToCart = (bogo) => {
    if (!user) {
      alert("Please login to add items to cart");
      navigate("/login");
      return;
    }
    const purchaseProducts = products.filter(p => bogo.purchase_lot_ids?.includes(p.lot_id));
    const giftLotIds = bogo.same_lot ? bogo.purchase_lot_ids : bogo.gift_lot_ids;
    const giftProducts = products.filter(p => giftLotIds?.includes(p.lot_id));

    const purchaseTotal = purchaseProducts.reduce((sum, p) => sum + (p.price * bogo.purchase_quantity), 0);
    let giftTotal = 0;
    if (bogo.for_type === "PERCENT_OFF") {
      giftTotal = giftProducts.reduce((sum, p) => sum + (p.price * bogo.get_quantity * (1 - (bogo.for_discount || 0) / 100)), 0);
    } else if (bogo.for_type === "FIXED_PRICE") {
      giftTotal = (bogo.for_discount || 0) * bogo.get_quantity;
    }
    // FREE = 0

    const bogoItem = {
      isBundle: true,
      isBogo: true,
      name: bogo.promotion_name || bogo.marketing_label,
      products: [...purchaseProducts, ...giftProducts],
      purchaseProducts,
      giftProducts,
      purchase_quantity: bogo.purchase_quantity,
      get_quantity: bogo.get_quantity,
      for_type: bogo.for_type,
      for_discount: bogo.for_discount,
      same_lot: bogo.same_lot,
      price: purchaseTotal + giftTotal,
      id: `bogo-${Date.now()}`
    };
    setCart([...cart, bogoItem]);
    setShowBogoModal(null);
    setSelectedProduct(null);
  };

  return (
    <div className="product-page" style={{ backgroundImage: `url(${bgImage})` }}>
      <SEO
        title="Products"
        description="Browse our collection of authentic Ayurvedic products. Natural skin care, hair care, wellness remedies and more from Trisandhya Ayurveda."
      />
      <div style={{ textAlign: 'center', padding: '20px 0', background: 'transparent', borderBottom: 'none' }}>
        <img src={logo} alt="Trisandhya Ayurveda" style={{ height: '200px', maxWidth: '90%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
      </div>
      <h2 className="product-title">Our Available Products</h2>

      <div className="search-filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="category-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          {[...new Set(products.map(p => p.category).filter(Boolean))].map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      
      {loading && <p style={{textAlign: 'center', fontSize: '1.5rem'}}>Loading products...</p>}
      
      {error && <p style={{textAlign: 'center', color: 'red', fontSize: '1.2rem'}}>{error}</p>}
      
      {!loading && !error && products.length === 0 && (
        <p style={{textAlign: 'center', fontSize: '1.2rem'}}>No products available yet.</p>
      )}
      
      <div className="product-grid">
        {products
          .filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
          })
          .map((product) => {
          const activePromo = getActivePromotion(product.lot_id);
          return (
            <motion.div
              className="product-card"
              key={product.id}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setSelectedProduct(product);
                setShowContact(false);
                setModalQuantity(1);
                fetchReviews(product.lot_id);
              }}
              style={{ position: 'relative' }}
            >
              {product.marketing_label && (
                <div className="marketing-label">{product.marketing_label}</div>
              )}
              {activePromo && (
                <div style={{
                  position: 'absolute',
                  top: product.marketing_label ? '45px' : '10px',
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
              {(() => {
                const bogo = getActiveBogoPromotion(product.lot_id);
                return bogo ? (
                  <div style={{
                    position: 'absolute',
                    top: product.marketing_label ? (activePromo ? '80px' : '45px') : (activePromo ? '45px' : '10px'),
                    right: '10px',
                    background: '#9c27b0',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                  }}>
                    {bogo.promotion_name || bogo.marketing_label}
                  </div>
                ) : null;
              })()}
              <img src={product.image} alt={product.name} />
              <h3>{product.name}</h3>
              <p className="price">₹{product.price}</p>
              <div className={`inventory-status ${product.inventory === 0 ? 'out-of-stock' : 'in-stock'}`}>
                {product.inventory === 0 ? 'Out of Stock' : product.inventory != null ? `${product.inventory} in stock` : 'Available'}
              </div>
              {product.lot_id && <p className="lot-id">Lot ID: {product.lot_id}</p>}
              {(() => {
                const ratingInfo = getAvgRating(product.lot_id);
                return ratingInfo ? (
                  <div className="avg-rating">
                    <span className="stars">{"★".repeat(Math.round(ratingInfo.avg))}{"☆".repeat(5 - Math.round(ratingInfo.avg))}</span>
                    <span>{ratingInfo.avg} ({ratingInfo.count})</span>
                  </div>
                ) : null;
              })()}
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
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}
      >
        New Products Coming Soon...! Stay Tuned at
        <motion.a
          href="https://www.instagram.com/trisandhya_ayurveda_"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.3, color: '#C13584' }}
          whileTap={{ scale: 0.9 }}
          aria-label="Instagram"
          style={{ display: 'inline-flex', alignItems: 'center', color: '#E1306C', fontSize: '1.5em' }}
        >
          <FaInstagram />
        </motion.a>
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
              <div className={`inventory-status ${selectedProduct.inventory === 0 ? 'out-of-stock' : 'in-stock'}`} style={{ fontSize: '1.1rem', margin: '10px 0' }}>
                {selectedProduct.inventory === 0 ? '❌ Out of Stock' : selectedProduct.inventory != null ? `📦 ${selectedProduct.inventory} in stock` : '✅ Available'}
              </div>
              {selectedProduct.inventory !== 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '10px 0' }}>
                  <button onClick={() => setModalQuantity(q => Math.max(1, q - 1))} style={{ width: '32px', height: '32px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '1.2rem' }}>−</button>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>{modalQuantity}</span>
                  <button onClick={() => setModalQuantity(q => selectedProduct.inventory != null ? Math.min(selectedProduct.inventory, q + 1) : q + 1)} style={{ width: '32px', height: '32px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '1.2rem' }}>+</button>
                </div>
              )}
              {(() => {
                const bogo = getActiveBogoPromotion(selectedProduct.lot_id);
                return bogo ? (
                  <div
                    onClick={() => setShowBogoModal(bogo)}
                    style={{
                      background: 'linear-gradient(135deg, #9c27b0, #e040fb)',
                      color: 'white',
                      padding: '12px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      margin: '10px 0'
                    }}
                  >
                    🎁 {bogo.promotion_name || bogo.marketing_label} — Click to View Offer
                  </div>
                ) : null;
              })()}
              <div className="button-row">
                <button onClick={() => addToCart(selectedProduct)} disabled={selectedProduct.inventory === 0} style={selectedProduct.inventory === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                  {selectedProduct.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button onClick={() => setShowContact(true)}>Contact</button>
              </div>

              {/* Reviews Section */}
              <div className="reviews-section">
                <h4>⭐ Reviews ({reviews.length})</h4>
                {reviews.length === 0 && <p style={{ fontSize: '0.9rem', color: '#999' }}>No reviews yet. Be the first!</p>}
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {reviews.map(r => (
                    <div key={r.id} className="review-item">
                      <div className="review-header">
                        <span className="review-author">{r.userName}</span>
                        <span className="review-date">{r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                      </div>
                      <div className="review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                      <p className="review-text">{r.text}</p>
                    </div>
                  ))}
                </div>
                {user && (
                  <div className="review-form">
                    <div className="star-picker">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} onClick={() => setReviewRating(star)} style={{ color: star <= reviewRating ? '#f5a623' : '#ddd' }}>
                          ★
                        </span>
                      ))}
                    </div>
                    <textarea
                      placeholder="Write your review..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    />
                    <button onClick={() => submitReview(selectedProduct.lot_id)} disabled={submittingReview}>
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                )}
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
        {showBogoModal && (() => {
          const giftLotIds = showBogoModal.same_lot ? showBogoModal.purchase_lot_ids : showBogoModal.gift_lot_ids;
          const purchaseItems = products.filter(p => showBogoModal.purchase_lot_ids?.includes(p.lot_id));
          const giftItems = products.filter(p => giftLotIds?.includes(p.lot_id));
          const purchaseTotal = purchaseItems.reduce((sum, p) => sum + (p.price * showBogoModal.purchase_quantity), 0);
          let giftTotal = 0;
          if (showBogoModal.for_type === "PERCENT_OFF") {
            giftTotal = giftItems.reduce((sum, p) => sum + (p.price * showBogoModal.get_quantity * (1 - (showBogoModal.for_discount || 0) / 100)), 0);
          } else if (showBogoModal.for_type === "FIXED_PRICE") {
            giftTotal = (showBogoModal.for_discount || 0) * showBogoModal.get_quantity;
          }
          const totalPrice = purchaseTotal + giftTotal;

          const getGiftPriceLabel = (product) => {
            if (showBogoModal.for_type === "FREE") return "FREE";
            if (showBogoModal.for_type === "PERCENT_OFF") return `₹${(product.price * (1 - (showBogoModal.for_discount || 0) / 100)).toFixed(0)} × ${showBogoModal.get_quantity}`;
            if (showBogoModal.for_type === "FIXED_PRICE") return `₹${showBogoModal.for_discount} × ${showBogoModal.get_quantity}`;
            return "";
          };

          const getGiftHeading = () => {
            if (showBogoModal.for_type === "FREE") return `🎁 Gift Items (Get ${showBogoModal.get_quantity} FREE)`;
            if (showBogoModal.for_type === "PERCENT_OFF") return `🎁 Gift Items (Get ${showBogoModal.get_quantity} at ${showBogoModal.for_discount}% OFF)`;
            if (showBogoModal.for_type === "FIXED_PRICE") return `🎁 Gift Items (Get ${showBogoModal.get_quantity} at ₹${showBogoModal.for_discount} each)`;
            return `🎁 Gift Items (Get ${showBogoModal.get_quantity})`;
          };

          return (
            <motion.div
              className="product-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBogoModal(null)}
              style={{ zIndex: 3000 }}
            >
              <motion.div
                className="product-modal-content"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                style={{ maxWidth: '500px' }}
              >
                <h2 style={{ textAlign: 'center', color: '#9c27b0' }}>🎁 {showBogoModal.promotion_name || showBogoModal.marketing_label}</h2>
                <p style={{ textAlign: 'center', color: '#666', margin: '5px 0 15px' }}>
                  {showBogoModal.marketing_label}
                </p>
                {showBogoModal.same_lot && (
                  <p style={{ textAlign: 'center', color: '#9c27b0', fontSize: '0.85rem', fontStyle: 'italic', margin: '0 0 10px' }}>
                    * Purchase & Gift items are the same product
                  </p>
                )}

                <div style={{ background: '#f3e5f5', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 10px', color: '#7b1fa2' }}>🛒 Purchase Items (Buy {showBogoModal.purchase_quantity})</h4>
                  {purchaseItems.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #e1bee7' }}>
                      <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '5px', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{p.name}</p>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>₹{p.price} × {showBogoModal.purchase_quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 10px', color: '#388e3c' }}>{getGiftHeading()}</h4>
                  {giftItems.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #c8e6c9' }}>
                      <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '5px', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{p.name}</p>
                        <p style={{ margin: 0, color: '#388e3c', fontSize: '0.8rem' }}>{getGiftPriceLabel(p)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#fff3e0', borderRadius: '8px', padding: '12px', marginBottom: '15px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#e65100' }}>
                    Total: ₹{totalPrice.toFixed(0)}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#666' }}>
                    ({showBogoModal.purchase_quantity} purchase + {showBogoModal.get_quantity} gift)
                  </p>
                </div>

                <button
                  onClick={() => addBogoToCart(showBogoModal)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #9c27b0, #e040fb)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  Add BOGO Offer to Cart
                </button>
                <button
                  onClick={() => setShowBogoModal(null)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginTop: '10px',
                    background: '#eee',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
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

      <AnimatePresence>
        {showComingSoon && (
          <motion.div
            className="product-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowComingSoon(false)}
            style={{ zIndex: 2000 }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                padding: '40px',
                maxWidth: '450px',
                width: '90%',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ fontSize: '60px', marginBottom: '15px' }}
              >
                🌿
              </motion.div>
              <h2 style={{ margin: '0 0 10px', fontSize: '1.8rem' }}>New Products Coming Soon...!</h2>
              <p style={{ margin: '0 0 25px', opacity: 0.9, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                Stay Tuned at
                <motion.a
                  href="https://www.instagram.com/trisandhya_ayurveda_"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Instagram"
                  style={{ display: 'inline-flex', alignItems: 'center', color: 'white', fontSize: '1.5em' }}
                >
                  <FaInstagram />
                </motion.a>
              </p>
              <button
                onClick={() => setShowComingSoon(false)}
                style={{
                  padding: '12px 40px',
                  background: 'white',
                  color: '#764ba2',
                  border: 'none',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                Explore Products
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
