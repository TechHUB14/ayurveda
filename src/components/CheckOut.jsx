import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import "../assets/Check.css";

export const CheckOut = ({ cart = [], setCart }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    houseNo: "",
    street: "",
    locality: "",
    city: "",
    state: "",
    pincode: ""
  });

  const [loading, setLoading] = useState(false);
  const totalAmount = cart.reduce((acc, item) => acc + item.price, 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone || !form.city || !form.state || !form.pincode) {
      toast.error("Please fill all required fields.");
      return;
    }

    setLoading(true);
    const orderData = {
      ...form,
      cart,
      total: totalAmount,
      createdAt: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, "orders"), orderData);
      toast.success(" Order placed successfully!");
      setCart([]);
      setTimeout(() => navigate("/product"), 2000);
    } catch (error) {
      console.error("Order Error:", error);
      toast.error(" Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-wrapper">
      <Toaster position="top-center" />
      <div className="checkout-box">
        <h2>🧾 Checkout</h2>

        <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input type="tel" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />

        <input type="text" name="houseNo" placeholder="House No." value={form.houseNo} onChange={handleChange} />
        <input type="text" name="street" placeholder="Street" value={form.street} onChange={handleChange} />
        <input type="text" name="locality" placeholder="Locality" value={form.locality} onChange={handleChange} />
        <input type="text" name="city" placeholder="City/Town" value={form.city} onChange={handleChange} />
        <input type="text" name="state" placeholder="State" value={form.state} onChange={handleChange} />
        <input type="text" name="pincode" placeholder="Pincode" value={form.pincode} onChange={handleChange} />

        <button className="checkout-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Placing Order..." : "Place Order"}
        </button>
        <button className="back-btn" onClick={() => navigate("/cart")}>Back to Cart</button>
      </div>
    </div>
  );
};
