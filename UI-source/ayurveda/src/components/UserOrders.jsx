import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "../assets/Product.css";

export const UserOrders = ({ setCart }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/login");
      } else {
        setUser(currentUser);
        fetchOrders(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchOrders = async (userId) => {
    try {
      setLoading(true);
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      ordersData.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const buyAgain = (order) => {
    const cartItems = order.items.map(item => ({
      ...item,
      quantity: item.quantity || 1
    }));
    setCart(cartItems);
    navigate("/cart");
  };

  return (
    <div className="product-page" style={{ minHeight: "100vh", padding: "20px" }}>
      <h2 className="product-title">My Orders</h2>
      
      {loading && <p style={{ textAlign: "center", fontSize: "1.5rem" }}>Loading orders...</p>}
      
      {!loading && orders.length === 0 && (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <p style={{ fontSize: "1.2rem", marginBottom: "20px" }}>No orders yet</p>
          <button
            onClick={() => navigate("/product")}
            style={{ padding: "12px 24px", background: "#4CAF50", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}
          >
            Start Shopping
          </button>
        </div>
      )}
      
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: "white", borderRadius: "12px", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "15px" }}>
              <div>
                <p style={{ fontSize: "0.9rem", color: "#666", margin: "5px 0" }}>
                  Order ID: {order.orderNumber || order.id}
                </p>
                <p style={{ fontSize: "0.9rem", color: "#666", margin: "5px 0" }}>
                  Date: {order.createdAt instanceof Date ? order.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#4CAF50" }}>
                  ₹{order.totalAmount}
                </p>
                <p style={{ fontSize: "0.9rem", color: "#666" }}>
                  Status: {order.status || "Pending"}
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: "15px", padding: "10px 0", borderBottom: idx < order.items.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                  {item.image && (
                    <img src={item.image} alt={item.name} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "bold", margin: "0 0 5px 0" }}>{item.name}</p>
                    <p style={{ fontSize: "0.9rem", color: "#666", margin: 0 }}>
                      Qty: {item.quantity || 1} × ₹{item.original_price || item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => buyAgain(order)}
              style={{ width: "100%", padding: "12px", background: "#4CAF50", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}
            >
              🔄 Buy Again
            </button>
          </motion.div>
        ))}
      </div>
      
      <motion.button
        className="home-button"
        whileHover={{ scale: 1.1 }}
        onClick={() => navigate("/product")}
        style={{ position: "fixed", bottom: "20px", left: "20px" }}
      >
        Back to Products
      </motion.button>
    </div>
  );
};

export default UserOrders;
