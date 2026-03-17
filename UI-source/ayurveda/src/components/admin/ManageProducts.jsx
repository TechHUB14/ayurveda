import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebase";
import { motion } from "framer-motion";
import "../../assets/Admin.css";

export const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: null,
    lot_id: "",
    marketing_label: "",
    inventory: "",
    category: ""
  });
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ marketing_label: "", inventory: "", category: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/admin");
      } else {
        fetchProducts();
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "products"));
    const productsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setProducts(productsData);
  };

  const generateLotId = async () => {
    const querySnapshot = await getDocs(collection(db, "products"));
    let maxLotId = 1401;
    
    querySnapshot.docs.forEach(doc => {
      const lotId = doc.data().lot_id;
      if (lotId && lotId > maxLotId) {
        maxLotId = lotId;
      }
    });
    
    setFormData({ ...formData, lot_id: maxLotId + 1 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      alert("Please select an image");
      return;
    }
    if (!formData.lot_id) {
      alert("Please generate Lot ID first");
      return;
    }
    
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        
        await addDoc(collection(db, "products"), {
          name: formData.name,
          price: Number(formData.price),
          description: formData.description,
          image: base64Image,
          lot_id: formData.lot_id,
          marketing_label: formData.marketing_label || "",
          inventory: formData.inventory === "" ? null : Number(formData.inventory),
          category: formData.category || ""
        });
        alert(`Product added successfully! Lot ID: ${formData.lot_id}`);
        setFormData({ name: "", price: "", description: "", image: null, lot_id: "", marketing_label: "", inventory: "", category: "" });
        document.querySelector('input[type="file"]').value = "";
        fetchProducts();
        setUploading(false);
      };
      reader.readAsDataURL(formData.image);
    } catch (error) {
      alert("Error adding product: " + error.message);
      setUploading(false);
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditData({
      marketing_label: product.marketing_label || "",
      inventory: product.inventory != null ? String(product.inventory) : "",
      category: product.category || ""
    });
  };

  const handleEdit = async (id) => {
    try {
      await updateDoc(doc(db, "products", id), {
        marketing_label: editData.marketing_label || "",
        inventory: editData.inventory === "" ? null : Number(editData.inventory),
        category: editData.category || ""
      });
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      alert("Error updating product: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        alert("Product deleted!");
        fetchProducts();
      } catch (error) {
        alert("Error deleting product: " + error.message);
      }
    }
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

        <h2>📦 Manage Products</h2>
      </div>

      <motion.div
        className="add-product-form"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h3>Add New Product</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Lot ID"
              value={formData.lot_id}
              readOnly
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={generateLotId}
              style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
            >
              Generate Lot ID
            </button>
          </div>
          <input
            type="text"
            placeholder="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Marketing Label (e.g. New Product!!, Best Seller)"
            value={formData.marketing_label}
            onChange={(e) => setFormData({ ...formData, marketing_label: e.target.value })}
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            <option value="">Select Category</option>
            <option value="Skin Care">Skin Care</option>
            <option value="Hair Care">Hair Care</option>
            <option value="Digestive Health">Digestive Health</option>
            <option value="Wellness">Wellness</option>
            <option value="Immunity">Immunity</option>
            <option value="Pain Relief">Pain Relief</option>
          </select>
          <input
            type="number"
            placeholder="Inventory Count (leave empty for default available)"
            value={formData.inventory}
            onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
            min="0"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
            required
          />
          <button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Add Product"}
          </button>
        </form>
      </motion.div>

      <div className="products-list">
        <h3>Existing Products ({products.length})</h3>
        <div className="product-items">
          {products.map((product) => (
            <div key={product.id} className="product-item">
              <img src={product.image} alt={product.name} />
              <div className="product-details">
                <h4>{product.name}</h4>
                <p>₹{product.price}</p>
                {product.lot_id && <p style={{color: '#8B4513', fontWeight: 'bold'}}>Lot ID: {product.lot_id}</p>}
                {product.marketing_label && <p style={{color: '#ff6b6b', fontWeight: 'bold'}}>🏷️ {product.marketing_label}</p>}
                {product.category && <p style={{color: '#667eea', fontWeight: 'bold'}}>📂 {product.category}</p>}
                <p style={{color: product.inventory === 0 ? '#f44336' : '#4CAF50', fontWeight: 'bold'}}>
                  {product.inventory === 0 ? '❌ Out of Stock' : product.inventory != null ? `📦 Stock: ${product.inventory}` : '✅ Available'}
                </p>
                <p>{product.description}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="edit-btn" onClick={() => startEdit(product)}>✏️ Edit</button>
                <button onClick={() => handleDelete(product.id)}>Delete</button>
              </div>
              {editingId === product.id && (
                <div className="edit-overlay">
                  <div className="edit-form">
                    <h4>Edit — {product.name}</h4>
                    <input
                      type="text"
                      placeholder="Marketing Label (e.g. New Product!!)"
                      value={editData.marketing_label}
                      onChange={(e) => setEditData({ ...editData, marketing_label: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Inventory Count (empty = Available)"
                      value={editData.inventory}
                      onChange={(e) => setEditData({ ...editData, inventory: e.target.value })}
                      min="0"
                    />
                    <select
                      value={editData.category}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      <option value="Skin Care">Skin Care</option>
                      <option value="Hair Care">Hair Care</option>
                      <option value="Digestive Health">Digestive Health</option>
                      <option value="Wellness">Wellness</option>
                      <option value="Immunity">Immunity</option>
                      <option value="Pain Relief">Pain Relief</option>
                    </select>
                    <div className="edit-form-btns">
                      <button onClick={() => handleEdit(product.id)}>💾 Save</button>
                      <button className="cancel" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ManageProducts;
