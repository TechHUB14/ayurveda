import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { motion } from "framer-motion";
import "../../assets/Admin.css";

export const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase: "",
    max_discount: "",
    applicable_products: [],
    start_date: "",
    end_date: "",
    usage_limit: "",
    used_count: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoupons();
    fetchProducts();
  }, []);

  const fetchCoupons = async () => {
    const snapshot = await getDocs(collection(db, "coupons"));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCoupons(list);
  };

  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, "products"));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(list);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "coupons"), {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        min_purchase: Number(formData.min_purchase) || 0,
        max_discount: Number(formData.max_discount) || 0,
        applicable_products: formData.applicable_products.map(Number),
        start_date: formData.start_date,
        end_date: formData.end_date,
        usage_limit: Number(formData.usage_limit) || 0,
        used_count: 0,
        active: true
      });
      alert("Coupon created successfully!");
      setFormData({ code: "", discount_type: "percentage", discount_value: "", min_purchase: "", max_discount: "", applicable_products: [], start_date: "", end_date: "", usage_limit: "", used_count: 0 });
      setShowForm(false);
      fetchCoupons();
    } catch (error) {
      alert("Error creating coupon: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this coupon?")) {
      try {
        await deleteDoc(doc(db, "coupons", id));
        alert("Coupon deleted!");
        fetchCoupons();
      } catch (error) {
        alert("Error deleting coupon: " + error.message);
      }
    }
  };

  const getProductName = (lotId) => {
    const product = products.find(p => p.lot_id === lotId);
    return product ? product.name : "Unknown";
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
        <h2>🎟️ Manage Coupons</h2>
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
          {showForm ? '▼' : '▶'} Create New Coupon
        </h3>
        {showForm && <form onSubmit={handleSubmit}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Coupon Code *</label>
          <input
            type="text"
            placeholder="Enter code (e.g., SAVE20, WELCOME50)"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', marginTop: '10px' }}>Discount Type *</label>
          <select
            value={formData.discount_type}
            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
            required
          >
            <option value="percentage">Percentage Discount (e.g., 20% off)</option>
            <option value="fixed">Fixed Amount Discount (e.g., ₹100 off)</option>
          </select>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', marginTop: '10px' }}>Discount Value *</label>
          <input
            type="number"
            placeholder={formData.discount_type === "percentage" ? "Enter percentage (e.g., 20 for 20% off)" : "Enter amount (e.g., 100 for ₹100 off)"}
            value={formData.discount_value}
            onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
            min="1"
            max={formData.discount_type === "percentage" ? "100" : undefined}
            required
          />
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', marginTop: '10px' }}>Minimum Purchase Amount</label>
          <input
            type="number"
            placeholder="Enter minimum cart value (e.g., 500) - Leave empty for no minimum"
            value={formData.min_purchase}
            onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
            min="0"
          />
          {formData.discount_type === "percentage" && <>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', marginTop: '10px' }}>Maximum Discount Cap</label>
            <input
              type="number"
              placeholder="Enter max discount (e.g., 500 for ₹500 max) - Leave empty for no cap"
              value={formData.max_discount}
              onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
              min="0"
            />
          </>}
          <div style={{ margin: '10px 0' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
              Applicable Products (leave unchecked for all products):
            </label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
              {products.map((product) => (
                <label key={product.id} style={{ display: 'block', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    value={product.lot_id}
                    checked={formData.applicable_products.includes(String(product.lot_id))}
                    onChange={(e) => {
                      const lotId = e.target.value;
                      setFormData({
                        ...formData,
                        applicable_products: e.target.checked
                          ? [...formData.applicable_products, lotId]
                          : formData.applicable_products.filter(id => id !== lotId)
                      });
                    }}
                  />
                  {product.name} (Lot ID: {product.lot_id})
                </label>
              ))}
            </div>
          </div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', marginTop: '10px' }}>Start Date & Time *</label>
          <input
            type="datetime-local"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', marginTop: '10px' }}>End Date & Time *</label>
          <input
            type="datetime-local"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', marginTop: '10px' }}>Usage Limit</label>
          <input
            type="number"
            placeholder="Enter max uses (e.g., 100) - Enter 0 or leave empty for unlimited"
            value={formData.usage_limit}
            onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
            min="0"
          />
          <button type="submit">Create Coupon</button>
        </form>}
      </motion.div>

      <motion.div
        className="orders-table-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h3>Active Coupons</h3>
        {coupons.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No coupons created yet. Click "Create New Coupon" to add one.</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {coupons.map((coupon) => (
              <div key={coupon.id} style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '20px',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: '20px',
                alignItems: 'center'
              }}>
                <div style={{ textAlign: 'center', borderRight: '2px dashed rgba(255,255,255,0.3)', paddingRight: '20px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '1px' }}>{coupon.code}</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px' }}>
                    {coupon.discount_type === "percentage" ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                  </div>
                  {coupon.max_discount > 0 && <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '3px' }}>Max: ₹{coupon.max_discount}</div>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', fontSize: '13px' }}>
                  <div>
                    <div style={{ opacity: 0.8, fontSize: '11px', marginBottom: '3px' }}>Min Purchase</div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>₹{coupon.min_purchase || 0}</div>
                  </div>
                  <div>
                    <div style={{ opacity: 0.8, fontSize: '11px', marginBottom: '3px' }}>Valid Until</div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{new Date(coupon.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <div>
                    <div style={{ opacity: 0.8, fontSize: '11px', marginBottom: '3px' }}>Usage</div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{coupon.used_count || 0} / {coupon.usage_limit || "∞"}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(coupon.id)} 
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Coupons;
