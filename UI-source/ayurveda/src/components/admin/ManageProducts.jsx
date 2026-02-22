import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { motion } from "framer-motion";
import "../../assets/Admin.css";

export const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: null,
    lot_id: ""
  });
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

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
          lot_id: formData.lot_id
        });
        alert(`Product added successfully! Lot ID: ${formData.lot_id}`);
        setFormData({ name: "", price: "", description: "", image: null, lot_id: "" });
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
                <p>{product.description}</p>
              </div>
              <button onClick={() => handleDelete(product.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ManageProducts;
