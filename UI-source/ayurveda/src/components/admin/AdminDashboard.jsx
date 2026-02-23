import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { motion } from "framer-motion";
import "../../assets/Admin.css";

export const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stateStats, setStateStats] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [adminName, setAdminName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/admin");
      } else {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.role !== "admin") {
              alert("Access denied. Admin only.");
              await signOut(auth);
              navigate("/");
              return;
            }
            setAdminName(userData.name || user.email);
          } else {
            alert("Access denied.");
            await signOut(auth);
            navigate("/");
          }
        } catch (error) {
          alert("Access denied.");
          await signOut(auth);
          navigate("/");
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const snapshot = await getDocs(collection(db, "orders"));
    const list = snapshot.docs.map((doc) => doc.data());
    setOrders(list);

    const stateCount = {};
    list.forEach((order) => {
      const state = order.state || "Unknown";
      stateCount[state] = (stateCount[state] || 0) + 1;
    });
    setStateStats(stateCount);

    const total = list.reduce((acc, o) => acc + Number(o.total || 0), 0);
    setTotalAmount(total);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <motion.div
      className="admin-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.aside
        className="admin-sidebar"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h2>Admin Panel</h2>
        <ul>
          <li className="active">Dashboard</li>
          <li onClick={() => navigate("/admin/products")}>Products</li>
          <li onClick={() => navigate("/admin/promotions")}>Promotions</li>
          <li onClick={() => navigate("/admin/coupons")}>Coupons</li>
          <li onClick={() => navigate("/admin/orders")}>Orders</li>
          <li onClick={() => navigate("/admin/settings")}>Settings</li>
          <li onClick={handleLogout} className="logout">Logout</li>
        </ul>
      </motion.aside>

      <motion.main
        className="admin-main"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <motion.div
          className="admin-header"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h1>Welcome, {adminName || "Admin"}</h1>
        </motion.div>

        <section className="dashboard-cards">
          <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
            <h3>Total Orders</h3>
            <p>{orders.length}</p>
          </motion.div>

          <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
            <h3>Shipped</h3>
            <p>{orders.filter((o) => o.status === "Shipping").length}</p>
          </motion.div>

          <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
            <h3>Delivered</h3>
            <p>{orders.filter((o) => o.status === "Delivered").length}</p>
          </motion.div>

          <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
            <h3>Total Amount</h3>
            <p>₹{totalAmount.toLocaleString()}</p>
          </motion.div>
        </section>

        <section className="admin-stats">
          <h3>Orders by State</h3>
          <div className="state-grid">
            {Object.entries(stateStats).map(([state, count], i) => (
              <motion.div
                key={state}
                className="state-card"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 120, delay: i * 0.05 }}
              >
                <p className="state-name">{state}</p>
                <p className="state-count">{count} Orders</p>
              </motion.div>
            ))}
          </div>
        </section>
      </motion.main>
    </motion.div>
  );
};

export default AdminDashboard;
