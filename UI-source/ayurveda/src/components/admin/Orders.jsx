import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import "../../assets/Orders.css";

const pageVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: 40, transition: { duration: 0.3, ease: "easeIn" } },
};

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(list);
    };

    fetchOrders();
  }, []);

  const getNextStatus = (status) => {
    if (status === "Not Packed") return "Shipping";
    if (status === "Shipping") return "Delivered";
    return "Delivered";
  };

  const updateStatus = async (id, currentStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    try {
      await updateDoc(doc(db, "orders", id), {
        status: nextStatus,
      });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id ? { ...order, status: nextStatus } : order
        )
      );
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const deleteOrder = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, "orders", id));
        setOrders((prev) => prev.filter((order) => order.id !== id));
      } catch (err) {
        console.error("Failed to delete order:", err);
      }
    }
  };

  const filteredOrders =
    filter === "All" ? orders : orders.filter((order) => order.status === filter);

  const exportAllCSV = () => {
    const headers = [
      "Order ID",
      "Name",
      "Full Address",
      "Phone",
      "Email",
      "State",
      "Total",
      "Date",
      "Time",
      "Status",
    ];
    const rows = filteredOrders.map((order) => [
      order.id,
      order.name,
      `${order.houseNo}, ${order.street}, ${order.locality}, ${order.city}, ${order.state}, ${order.pincode}`,
      order.phone,
      order.email,
      order.state,
      order.total,
      new Date(order.createdAt?.seconds * 1000).toLocaleDateString(),
      new Date(order.createdAt?.seconds * 1000).toLocaleTimeString(),
      order.status,
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "all_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateInvoicePDF = (order) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Order Invoice", 20, 20);
    doc.setFontSize(12);

    const addr = `${order.houseNo}, ${order.street}, ${order.locality}, ${order.city}, ${order.state}, ${order.pincode}`;
    const date = new Date(order.createdAt?.seconds * 1000);

    doc.text(`Order ID: ${order.id}`, 20, 35);
    doc.text(`Name: ${order.name}`, 20, 45);
    doc.text(`Phone: ${order.phone}`, 20, 55);
    doc.text(`Email: ${order.email}`, 20, 65);
    doc.text(`Address: ${addr}`, 20, 75);
    doc.text(`Date: ${date.toLocaleDateString()}`, 20, 85);
    doc.text(`Time: ${date.toLocaleTimeString()}`, 20, 95);
    doc.text(`Status: ${order.status}`, 20, 105);

    doc.text("Items:", 20, 120);
    let yPos = 130;
    order.cart?.forEach((item) => {
      doc.text(`• ${item.name}`, 25, yPos);
      if (item.promo_price) {
        doc.text(`  Original: ₹${item.original_price}`, 30, yPos + 7);
        doc.text(`  Discounted: ₹${item.final_price}`, 30, yPos + 14);
        yPos += 21;
      } else {
        doc.text(`  Price: ₹${item.final_price}`, 30, yPos + 7);
        yPos += 14;
      }
    });

    yPos += 10;
    if (order.subtotal) {
      doc.text(`Original Price: ₹${order.subtotal}`, 20, yPos);
      yPos += 10;
      if (order.discount > 0) {
        doc.text(`Discount: -₹${order.discount}`, 20, yPos);
        yPos += 10;
      }
    }
    doc.setFontSize(14);
    doc.text(`Total: ₹${order.total}`, 20, yPos);

    return doc;
  };

  const uploadInvoiceBase64 = async (orderId, base64String) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        invoiceBase64: base64String,
      });
    } catch (err) {
      console.error("Error uploading invoice:", err);
    }
  };

  const handleDownloadInvoice = (order) => {
    const doc = generateInvoicePDF(order);
    doc.save(`invoice_${order.id}.pdf`);
  };

  const handleWhatsAppInvoice = async (order) => {
    const docPDF = generateInvoicePDF(order);
    const base64String = docPDF.output("datauristring");
    await uploadInvoiceBase64(order.id, base64String);
    const message = encodeURIComponent(
      `Hello ${order.name},\n\nThank you for your order (ID: ${order.id}).\nTotal: ₹${order.total}\nStatus: ${order.status}`
    );
    const phone = order.phone.replace(/[^0-9]/g, "");
    const waLink = `https://wa.me/91${phone}?text=${message}`;
    window.open(waLink, "_blank");
  };

  return (
    <motion.div
      className="admin-orders-page"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={pageVariants}
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

        <h2>📦 Orders</h2>

        <div className="filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="Not Packed">Not Packed</option>
            <option value="Shipping">Shipping</option>
            <option value="Delivered">Delivered</option>
          </select>
          <motion.button
            className="export-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportAllCSV}
          >
            Export All CSV
          </motion.button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              className="order-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p><strong>Order ID:</strong> {order.id}</p>
              <p><strong>Name:</strong> {order.name}</p>
              <p><strong>Address:</strong> {`${order.houseNo}, ${order.street}, ${order.locality}, ${order.city}, ${order.state}, ${order.pincode}`}</p>
              <p><strong>Phone:</strong> {order.phone}</p>
              <p><strong>Email:</strong> {order.email}</p>
              <p><strong>Status:</strong> {order.status}</p>
              {order.subtotal && (
                <>
                  <p><strong>Original Price:</strong> ₹{order.subtotal}</p>
                  {order.discount > 0 && (
                    <p style={{ color: '#4CAF50' }}><strong>Discount:</strong> -₹{order.discount}</p>
                  )}
                </>
              )}
              <p><strong>Total:</strong> ₹{order.total}</p>
              <p><strong>Date:</strong> {new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {new Date(order.createdAt?.seconds * 1000).toLocaleTimeString()}</p>

              <div className="action-buttons">
                {order.status !== "Delivered" && (
                  <motion.button
                    className="status-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updateStatus(order.id, order.status)}
                  >
                    Mark as {getNextStatus(order.status)}
                  </motion.button>
                )}

                <motion.button
                  className="delete-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => deleteOrder(order.id)}
                >
                  ❌ Delete
                </motion.button>

                <motion.button
                  className="export-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDownloadInvoice(order)}
                >
                  ⬇️ Download Invoice
                </motion.button>

                <motion.button
                  className="export-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleWhatsAppInvoice(order)}
                >
                  📲 Send on WhatsApp
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Orders;
