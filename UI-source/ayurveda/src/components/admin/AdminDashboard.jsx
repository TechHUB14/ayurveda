import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import "../../assets/Admin.css";

const COLORS = ["#6B8E23", "#8B4513", "#D4A574", "#667eea", "#ff6b6b", "#4CAF50", "#ff9800", "#9c27b0"];
const LOW_STOCK_THRESHOLD = 5;

export const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [stateStats, setStateStats] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [adminName, setAdminName] = useState("");
  const [revenueView, setRevenueView] = useState("daily");
  const [loading, setLoading] = useState(true);
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
            await fetchAllData();
          } else {
            alert("Access denied. No user document found for UID: " + user.uid);
            await signOut(auth);
            navigate("/");
          }
        } catch (error) {
          console.error("Firestore error:", error);
          alert("Access denied. Firestore error: " + error.message);
          await signOut(auth);
          navigate("/");
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersSnap, productsSnap, customersSnap, couponsSnap] = await Promise.all([
        getDocs(collection(db, "orders")),
        getDocs(collection(db, "products")),
        getDocs(collection(db, "customers")),
        getDocs(collection(db, "coupons"))
      ]);

      const ordersList = ordersSnap.docs.map(d => d.data());
      const productsList = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const customersList = customersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const couponsList = couponsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setOrders(ordersList);
      setProducts(productsList);
      setCustomers(customersList);
      setCoupons(couponsList);

      const stateCount = {};
      let total = 0;
      ordersList.forEach((order) => {
        const state = order.state || "Unknown";
        stateCount[state] = (stateCount[state] || 0) + 1;
        total += Number(order.totalAmount || order.total || 0);
      });
      setStateStats(stateCount);
      setTotalAmount(total);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Revenue over time
  const getRevenueData = () => {
    const map = {};
    orders.forEach(order => {
      const ts = order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : null;
      if (!ts) return;
      let key;
      if (revenueView === "daily") {
        key = ts.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      } else if (revenueView === "weekly") {
        const weekStart = new Date(ts);
        weekStart.setDate(ts.getDate() - ts.getDay());
        key = weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      } else {
        key = ts.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      }
      map[key] = (map[key] || 0) + Number(order.totalAmount || order.total || 0);
    });
    return Object.entries(map)
      .map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }))
      .slice(-15);
  };

  // Top selling products
  const getTopProducts = () => {
    const map = {};
    orders.forEach(order => {
      (order.items || order.cart || []).forEach(item => {
        const name = item.name || "Unknown";
        map[name] = (map[name] || 0) + (item.quantity || 1);
      });
    });
    return Object.entries(map)
      .map(([name, sold]) => ({ name: name.length > 18 ? name.slice(0, 18) + "…" : name, sold }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 6);
  };

  // Customer acquisition over time (by month)
  const getCustomerTrends = () => {
    const map = {};
    orders.forEach(order => {
      const ts = order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : null;
      if (!ts) return;
      const key = ts.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      if (!map[key]) map[key] = new Set();
      if (order.userId) map[key].add(order.userId);
    });
    return Object.entries(map).map(([month, users]) => ({
      month,
      customers: users.size
    }));
  };

  // Coupon usage analytics
  const getCouponData = () => {
    return coupons
      .filter(c => (c.used_count || 0) > 0 || c.usage_limit > 0)
      .map(c => ({
        name: c.code,
        used: c.used_count || 0,
        limit: c.usage_limit || 0
      }))
      .slice(0, 8);
  };

  // Inventory alerts
  const getLowStockProducts = () => {
    return products
      .filter(p => p.inventory != null && p.inventory <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => (a.inventory || 0) - (b.inventory || 0));
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F5F0E8", fontFamily: "Georgia, serif" }}>
        <p style={{ fontSize: "1.5rem", color: "#6B5D4F" }}>Loading dashboard...</p>
      </div>
    );
  }

  const lowStockProducts = getLowStockProducts();

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
        <motion.div className="admin-header" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
          <h1>Welcome, {adminName || "Admin"}</h1>
        </motion.div>

        {/* Inventory Alerts */}
        <AnimatePresence>
          {lowStockProducts.length > 0 && (
            <motion.section
              className="inventory-alerts"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h3>⚠️ Inventory Alerts ({lowStockProducts.length})</h3>
              <div className="alert-grid">
                {lowStockProducts.map(p => (
                  <div key={p.id} className={`alert-card ${p.inventory === 0 ? "out-of-stock" : "low-stock"}`}>
                    <span className="alert-badge">{p.inventory === 0 ? "OUT OF STOCK" : `${p.inventory} left`}</span>
                    <p className="alert-product-name">{p.name}</p>
                    <p className="alert-lot">Lot: {p.lot_id}</p>
                    <button onClick={() => navigate("/admin/products")}>Restock →</button>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Stat Cards */}
        <section className="dashboard-cards">
          <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
            <h3>Total Orders</h3>
            <p>{orders.length}</p>
          </motion.div>
          <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
            <h3>Total Revenue</h3>
            <p>₹{totalAmount.toLocaleString()}</p>
          </motion.div>
          <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
            <h3>Customers</h3>
            <p>{customers.length}</p>
          </motion.div>
          <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
            <h3>Products</h3>
            <p>{products.length}</p>
          </motion.div>
          <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
            <h3>Shipped</h3>
            <p>{orders.filter(o => o.status === "Shipping").length}</p>
          </motion.div>
          <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
            <h3>Delivered</h3>
            <p>{orders.filter(o => o.status === "Delivered").length}</p>
          </motion.div>
        </section>

        {/* Revenue Chart */}
        <section className="chart-section">
          <div className="chart-header">
            <h3>📈 Revenue Over Time</h3>
            <div className="chart-toggle">
              {["daily", "weekly", "monthly"].map(v => (
                <button key={v} className={revenueView === v ? "active" : ""} onClick={() => setRevenueView(v)}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getRevenueData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#6B8E23" strokeWidth={3} dot={{ r: 5, fill: "#6B8E23" }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Top Products & Customer Trends side by side */}
        <div className="charts-row">
          <section className="chart-section half">
            <h3>🏆 Top Selling Products</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getTopProducts()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, "Units Sold"]} />
                <Bar dataKey="sold" radius={[0, 6, 6, 0]}>
                  {getTopProducts().map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="chart-section half">
            <h3>👥 Customer Acquisition</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getCustomerTrends()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, "Unique Customers"]} />
                <Bar dataKey="customers" fill="#667eea" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>

        {/* Coupon Usage & Orders by State */}
        <div className="charts-row">
          <section className="chart-section half">
            <h3>🎟️ Coupon Usage</h3>
            {getCouponData().length === 0 ? (
              <p style={{ textAlign: "center", color: "#999", padding: "40px" }}>No coupon usage data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getCouponData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="used" name="Used" fill="#4CAF50" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="limit" name="Limit" fill="#D4A574" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>

          <section className="chart-section half">
            <h3>📍 Orders by State</h3>
            {Object.keys(stateStats).length === 0 ? (
              <p style={{ textAlign: "center", color: "#999", padding: "40px" }}>No order data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(stateStats).map(([name, value]) => ({ name, value }))}
                    cx="50%" cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {Object.keys(stateStats).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </section>
        </div>
      </motion.main>
    </motion.div>
  );
};

export default AdminDashboard;
