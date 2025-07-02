import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../../assets/Admin.css";
import logoimg from "../../assets/images/2.jpg";

export const Admin = () => {
  const [orders, setOrders] = useState([]);
  const [stateStats, setStateStats] = useState({});
  const [adminName, setAdminName] = useState("");
  const navigate = useNavigate();
const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/adminlogin");
      } else {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setAdminName(userSnap.data().name || user.email);
          } else {
            setAdminName(user.email);
          }
        } catch (error) {
          console.error("Error fetching admin name:", error);
          setAdminName(user.email);
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

useEffect(() => {
  const fetchOrders = async () => {
    const snapshot = await getDocs(collection(db, "orders"));
    const list = snapshot.docs.map((doc) => doc.data());
    setOrders(list);

    // Count orders by state
    const stateCount = {};
    list.forEach((order) => {
      const state = order.state || "Unknown";
      stateCount[state] = (stateCount[state] || 0) + 1;
    });
    setStateStats(stateCount);

    // ✅ Total amount (sum of all orders regardless of status)
    const totalAmount = list.reduce((acc, o) => acc + Number(o.total || 0), 0);
    setTotalAmount(totalAmount);
  };

  fetchOrders();
}, []);


  const handleLogout = () => {
    auth.signOut().then(() => navigate("/adminlogin"));
  };

  return (
    <motion.div
      className="admin-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Sidebar */}
      <motion.aside
        className="admin-sidebar"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h2>Admin Panel</h2>
        <ul>
          <li className="active">Dashboard</li>
          <li onClick={() => navigate("/admin/orders")}>Orders</li>
          <li onClick={() => navigate("/admin/settings")}>Settings</li>
          <li onClick={handleLogout} className="logout">Logout</li>
        </ul>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        className="admin-main"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Header */}
        <motion.div
          className="admin-header"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <img src={logoimg} alt="logo" width={350} height={100} className="adimg" />
          <h1>Welcome, {adminName || "Admin"}</h1>
          
        </motion.div>

        {/* Stat Cards */}
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
      <h3>Total Amount:</h3> <p><strong>₹{totalAmount.toLocaleString()}</strong></p>
          </motion.div>
        </section>

        {/* State-wise Orders */}
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
