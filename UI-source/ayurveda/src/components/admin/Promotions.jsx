import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { motion } from "framer-motion";
import "../../assets/Admin.css";

export const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [bulkPromotions, setBulkPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [formData, setFormData] = useState({
    lot_id: "",
    marketing_label: "",
    promo_price: "",
    start_datetime: "",
    end_datetime: ""
  });
  const [bulkFormData, setBulkFormData] = useState({
    offer_type: "",
    buy_lot_ids: [],
    get_lot_ids: [],
    discount_percent: "",
    offer_price: "",
    marketing_label: "",
    start_datetime: "",
    end_datetime: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPromotions();
    fetchBulkPromotions();
    fetchProducts();
  }, []);

  const fetchPromotions = async () => {
    const snapshot = await getDocs(collection(db, "promotions"));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPromotions(list);
  };

  const fetchBulkPromotions = async () => {
    try {
      const snapshot = await getDocs(collection(db, "bulk_promotions"));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBulkPromotions(list);
    } catch (error) {
      console.error("Error fetching bulk promotions:", error);
    }
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
      setShowForm(false);
      fetchPromotions();
    } catch (error) {
      alert("Error adding promotion: " + error.message);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (bulkFormData.offer_type === 'buy_more' && bulkFormData.buy_lot_ids.length < 2) {
      alert("Please select at least 2 products for Buy 2 or More offer");
      return;
    }
    try {
      await addDoc(collection(db, "bulk_promotions"), {
        offer_type: bulkFormData.offer_type,
        buy_lot_ids: bulkFormData.buy_lot_ids.map(Number),
        get_lot_ids: bulkFormData.get_lot_ids.map(Number),
        discount_percent: Number(bulkFormData.discount_percent || 0),
        offer_price: Number(bulkFormData.offer_price || 0),
        marketing_label: bulkFormData.marketing_label,
        start_datetime: bulkFormData.start_datetime,
        end_datetime: bulkFormData.end_datetime
      });
      alert("Bulk promotion added successfully!");
      setBulkFormData({ offer_type: "", buy_lot_ids: [], get_lot_ids: [], discount_percent: "", offer_price: "", marketing_label: "", start_datetime: "", end_datetime: "" });
      setShowBulkForm(false);
      fetchBulkPromotions();
    } catch (error) {
      alert("Error adding bulk promotion: " + error.message);
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

  const handleDeleteBulk = async (id) => {
    if (window.confirm("Delete this bulk promotion?")) {
      try {
        await deleteDoc(doc(db, "bulk_promotions", id));
        alert("Bulk promotion deleted!");
        fetchBulkPromotions();
      } catch (error) {
        alert("Error deleting bulk promotion: " + error.message);
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
        <h3 
          onClick={() => setShowForm(!showForm)} 
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          {showForm ? '▼' : '▶'} Add Single Product Promotion
        </h3>
        {showForm && <form onSubmit={handleSubmit}>
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
        </form>}
      </motion.div>

      <motion.div
        className="add-product-form"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h3 
          onClick={() => setShowBulkForm(!showBulkForm)} 
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          {showBulkForm ? '▼' : '▶'} Add Bulk Offer (BOGO, Buy More)
        </h3>
        {showBulkForm && <form onSubmit={handleBulkSubmit}>
          <select
            value={bulkFormData.offer_type}
            onChange={(e) => setBulkFormData({ ...bulkFormData, offer_type: e.target.value, buy_lot_ids: [], get_lot_ids: [] })}
            required
          >
            <option value="">Select Offer Type</option>
            <option value="bogo">Buy One Get One (BOGO)</option>
            <option value="buy_more">Buy 2 or More (Discount)</option>
          </select>
          
          {bulkFormData.offer_type && <div style={{ margin: '10px 0' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Select Products to Buy:</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
              {products.map((product) => (
                <label key={product.id} style={{ display: 'block', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    value={product.lot_id}
                    checked={bulkFormData.buy_lot_ids.includes(String(product.lot_id))}
                    onChange={(e) => {
                      const lotId = e.target.value;
                      setBulkFormData({
                        ...bulkFormData,
                        buy_lot_ids: e.target.checked
                          ? [...bulkFormData.buy_lot_ids, lotId]
                          : bulkFormData.buy_lot_ids.filter(id => id !== lotId)
                      });
                    }}
                  />
                  {' '}{product.name} - Lot ID: {product.lot_id}
                </label>
              ))}
            </div>
          </div>}
          
          {bulkFormData.offer_type === 'bogo' && <div style={{ margin: '10px 0' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Select Products to Get Free:</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
              {products.map((product) => (
                <label key={product.id} style={{ display: 'block', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    value={product.lot_id}
                    checked={bulkFormData.get_lot_ids.includes(String(product.lot_id))}
                    onChange={(e) => {
                      const lotId = e.target.value;
                      setBulkFormData({
                        ...bulkFormData,
                        get_lot_ids: e.target.checked
                          ? [...bulkFormData.get_lot_ids, lotId]
                          : bulkFormData.get_lot_ids.filter(id => id !== lotId)
                      });
                    }}
                  />
                  {' '}{product.name} - Lot ID: {product.lot_id}
                </label>
              ))}
            </div>
          </div>}
          
          {bulkFormData.offer_type === 'buy_more' && <input
            type="number"
            placeholder="Discount Percentage (e.g., 20)"
            value={bulkFormData.discount_percent}
            onChange={(e) => setBulkFormData({ ...bulkFormData, discount_percent: e.target.value })}
            required
          />}
          {bulkFormData.offer_type && <input
            type="number"
            placeholder="Offer Price (Total price for the bundle)"
            value={bulkFormData.offer_price}
            onChange={(e) => setBulkFormData({ ...bulkFormData, offer_price: e.target.value })}
            required
          />}
          <input
            type="text"
            placeholder="Marketing Label (e.g., Buy 1 Get 1 Free)"
            value={bulkFormData.marketing_label}
            onChange={(e) => setBulkFormData({ ...bulkFormData, marketing_label: e.target.value })}
            required
          />
          <input
            type="datetime-local"
            value={bulkFormData.start_datetime}
            onChange={(e) => setBulkFormData({ ...bulkFormData, start_datetime: e.target.value })}
            required
          />
          <input
            type="datetime-local"
            value={bulkFormData.end_datetime}
            onChange={(e) => setBulkFormData({ ...bulkFormData, end_datetime: e.target.value })}
            required
          />
          <button type="submit">Add Bulk Offer</button>
        </form>}
      </motion.div>

      <div className="products-list">
        <h3>Active Single Product Promotions ({promotions.length})</h3>
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

      <div className="products-list">
        <h3>Active Bulk Offers ({bulkPromotions.length})</h3>
        <div className="product-items">
          {bulkPromotions.map((promo) => (
            <div key={promo.id} className="product-item" style={{ border: '2px solid #4CAF50' }}>
              <div className="product-details">
                <h4 style={{ color: '#4CAF50' }}>🎁 {promo.marketing_label}</h4>
                <p style={{color: '#8B4513', fontWeight: 'bold'}}>Type: {promo.offer_type === 'bogo' ? 'Buy One Get One' : 'Buy 2 or More'}</p>
                <div style={{ margin: '10px 0' }}>
                  <p style={{ fontWeight: 'bold' }}>Products to Buy:</p>
                  {promo.buy_lot_ids?.map((lotId, idx) => (
                    <p key={idx} style={{ fontSize: '0.9rem', marginLeft: '10px' }}>• {getProductName(lotId)}</p>
                  ))}
                </div>
                {promo.get_lot_ids?.length > 0 && (
                  <div style={{ margin: '10px 0' }}>
                    <p style={{ fontWeight: 'bold' }}>Products to Get Free:</p>
                    {promo.get_lot_ids.map((lotId, idx) => (
                      <p key={idx} style={{ fontSize: '0.9rem', marginLeft: '10px' }}>• {getProductName(lotId)}</p>
                    ))}
                  </div>
                )}
                {promo.discount_percent > 0 && (
                  <p style={{color: '#666', fontSize: '1rem'}}>Discount: {promo.discount_percent}%</p>
                )}
                <p style={{color: '#4CAF50', fontSize: '1.1rem', fontWeight: 'bold'}}>Bundle Price: ₹{promo.offer_price}</p>
                <p>Start: {promo.start_datetime || promo.start_date}</p>
                <p>End: {promo.end_datetime || promo.end_date}</p>
              </div>
              <button onClick={() => handleDeleteBulk(promo.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Promotions;
