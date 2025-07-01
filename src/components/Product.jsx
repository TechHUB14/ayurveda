import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaInstagram, FaPhoneAlt } from "react-icons/fa";
import { db } from "../firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import "../assets/Product.css";
// Images
import underEyeImg from "../assets/images/im3.png";
import facePackImg from "../assets/images/img4.png";
import serumImg from "../assets/images/img5.png";

const products = [
  {
    id: 1,
    name: "Surya Varnya Serum",
    image: serumImg,
    price: 450,
    description:
      "This rejuvenating serum brightens skin tone, reduces pigmentation, and promotes a radiant complexion with traditional Ayurvedic herbs.",
  },
  {
    id: 2,
    name: "Surya Varnya Face Pack",
    image: facePackImg,
    price: 200,
    description:
      "A detoxifying face pack that cleanses deeply, tightens pores, and restores your skin's natural glow using time-tested herbal blends.",
  },
  {
    id: 3,
    name: "Ima Varnaka UnderEye Lepum",
    image: underEyeImg,
    price: 180,
    description:
      "Specially crafted to reduce dark circles, puffiness, and fine lines around the eyes, this herbal lepam nourishes and soothes tired skin.",
  },
];

export const Product = ({ cart, setCart }) => {

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", address: "" });
  const [showCheckout, setShowCheckout] = useState(false);
  const navigate = useNavigate();

  const addToCart = (product) => {
    setCart([...cart, product]);
    setSelectedProduct(null);
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.price, 0);

  const handleCheckout = async () => {
    try {
      await addDoc(collection(db, "orders"), {
        ...checkoutForm,
        cart,
        total: totalAmount,
        createdAt: Timestamp.now(),
      });
      setCart([]);
      setShowCheckout(false);
      alert("Order placed successfully!");
    } catch (error) {
      console.error("Order Error:", error);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="product-page">
      <h2 className="product-title">Our Available Products</h2>
      <div className="product-grid">
        {products.map((product) => (
          <motion.div
            className="product-card"
            key={product.id}
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              setSelectedProduct(product);
              setShowContact(false);
            }}
          >
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p className="price">₹{product.price}</p>
          </motion.div>
        ))}
      </div>

      <motion.h2
        className="product-title"
        animate={{ opacity: [1, 0.8, 1], scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        More Products Coming Soon...!
      </motion.h2>

      <AnimatePresence>
        {selectedProduct && (
          <motion.div className="product-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)}>
            <motion.div className="product-modal-content" onClick={(e) => e.stopPropagation()}>
              <img src={selectedProduct.image} alt={selectedProduct.name} />
              <h2>{selectedProduct.name}</h2>
              <p>{selectedProduct.description}</p>
              <h3>₹{selectedProduct.price}</h3>
              <div className="button-row">
                <button onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
                <button onClick={() => setShowContact(true)}>Contact</button>
              </div>
              {showContact && (
                <motion.div className="contact-popup" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <h4>Contact Us to Place Your Order</h4>
                  <p>
                    <FaPhoneAlt />{" "}
                    <a href="https://wa.link/0s0pho" target="_blank" rel="noopener noreferrer">+91 98765 43210</a>
                  </p>
                  <p>
                    <FaInstagram />{" "}
                    <a href="https://www.instagram.com/trisandhya_ayurveda_" target="_blank" rel="noopener noreferrer">@trisandhya_ayurveda_</a>
                  </p>
                  <button onClick={() => setShowContact(false)}>Close</button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <motion.button
        className="cart-button"
        whileHover={{ scale: 1.1 }}
        onClick={() => navigate("/cart")}
      >
        View Cart ({cart.length})
      </motion.button>

      <motion.button
        className="home-button"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => navigate("/")}
      >
        Home
      </motion.button>
    </div>
  );
};
