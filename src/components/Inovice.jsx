// src/pages/InvoicePreview.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export const Invoice = () => {
  const { id } = useParams(); // order ID from URL
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const docRef = doc(db, "orders", id);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.invoiceBase64) {
            setInvoiceUrl(data.invoiceBase64);
          } else {
            alert("Invoice not available for this order.");
          }
        } else {
          alert("Order not found.");
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        alert("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  if (loading) return <p style={{ textAlign: "center" }}>Loading invoice...</p>;

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>🧾 Invoice Preview</h2>
      {invoiceUrl ? (
        <iframe
          src={invoiceUrl}
          title="Invoice"
          style={{ width: "90%", height: "90vh", border: "1px solid #ccc" }}
        />
      ) : (
        <p>Invoice not available.</p>
      )}
    </div>
  );
};


