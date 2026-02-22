import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { motion } from "framer-motion";
import "../../assets/Admin.css";

export const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    lot_id: "",
    marketing_label: "",
    promo_price: "",
    start_datetime: "",
    end_datetime: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
  }, []);

  const fetchPromotions = async () => {
    const snapshot = await getDocs(collection(db, "promotions"));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPromotions(list);
  };

  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, "products"));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(list);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "promotions"), {
        lot_id: Number(formData.lot_id),
        marketing_label: formData.marketing_label,
        promo_price: Number(formData.promo_price),
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime
      });
      alert("Promotion added successfully!");
      setFormData({ lot_id: "", marketing_label: "", promo_price: "", start_datetime: "", end_datetime: "" });
      fetchPromotions();
    } catch (error) {
      alert("Error adding promotion: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this promotion?")) {
      try {
        await deleteDoc(doc(db, "promotions", id));
        alert("Promotion deleted!");
        fetchPromotions();
      } catch (error) {
        alert("Error deleting promotion: " + error.message);
      }
    }
  };

  const getProductName = (lotId) => {
    const product = products.find(p => p.lot_id === lotId);
    return product ? product.name : "Unknown Product";
  };

  const getProductPrice = (lotId) => {
    const product = products.find(p => p.lot_id === lotId);
    return product ? product.price : 0;
  };

  return (
    <motion.div
      className="admin-orders-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="header-section">
        <motion.button
          className="back-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/admin/dashboard")}
        >
          ⬅️ Back to Dashboard
        </motion.button>
        <h2>🎉 Manage Promotions</h2>
      </div>

      <motion.div
        className="add-product-form"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h3>Add New Promotion</h3>
        <form onSubmit={handleSubmit}>
          <select
            value={formData.lot_id}
            onChange={(e) => setFormData({ ...formData, lot_id: e.target.value })}
            required
          >
            <option value="">Select Product (Lot ID)</option>
            {products.map((product) => (
              <option key={product.id} value={product.lot_id}>
                {product.name} - Lot ID: {product.lot_id}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Marketing Label (e.g., 40% OFF)"
            value={formData.marketing_label}
            onChange={(e) => setFormData({ ...formData, marketing_label: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Promotional Price"
            value={formData.promo_price}
            onChange={(e) => setFormData({ ...formData, promo_price: e.target.value })}
            required
          />
          <input
            type="datetime-local"
            value={formData.start_datetime}
            onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
            required
          />
          <input
            type="datetime-local"
            value={formData.end_datetime}
            onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
            required
          />
          <button type="submit">Add Promotion</button>
        </form>
      </motion.div>

      <div className="products-list">
        <h3>Active Promotions ({promotions.length})</h3>
        <div className="product-items">
          {promotions.map((promo) => (
            <div key={promo.id} className="product-item">
              <div className="product-details">
                <h4>{getProductName(promo.lot_id)}</h4>
                <p style={{color: '#8B4513', fontWeight: 'bold'}}>Lot ID: {promo.lot_id}</p>
                <p style={{color: '#666', fontSize: '1rem'}}>Original Price: ₹{getProductPrice(promo.lot_id)}</p>
                <p style={{color: '#4CAF50', fontSize: '1.1rem', fontWeight: 'bold'}}>Promo Price: ₹{promo.promo_price}</p>
                <p style={{color: '#ff6b6b', fontSize: '1.2rem', fontWeight: 'bold'}}>{promo.marketing_label}</p>
                <p>Start: {promo.start_datetime || promo.start_date}</p>
                <p>End: {promo.end_datetime || promo.end_date}</p>
              </div>
              <button onClick={() => handleDelete(promo.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Promotions;
