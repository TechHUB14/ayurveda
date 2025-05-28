import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaInstagram, FaPhoneAlt } from "react-icons/fa";
import "../assets/Product.css"
// Import images
import underEyeImg from "../assets/images/im3.png";
import facePackImg from "../assets/images/img4.png";
import serumImg from "../assets/images/img5.png";

const products = [
  {
    id: 1,
    name: "Surya Varnya Serum",
    image: serumImg,
    price: "₹450",
    description:
      "This rejuvenating serum brightens skin tone, reduces pigmentation, and promotes a radiant complexion with traditional Ayurvedic herbs.",
  },
  {
    id: 2,
    name: "Surya Varnya Face Pack",
    image: facePackImg,
    price: "₹200",
    description:
      "A detoxifying face pack that cleanses deeply, tightens pores, and restores your skin's natural glow using time-tested herbal blends.",
  },
  {
    id: 3,
    name: "Ima Varnaka UnderEye Lepum",
    image: underEyeImg,
    price: "₹180",
    description:
      "Specially crafted to reduce dark circles, puffiness, and fine lines around the eyes, this herbal lepam nourishes and soothes tired skin.",
  },
];

export const Product = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="product-page">
      <h2 className="product-title">Our Available Products</h2>
      <div className="product-grid">
        {products.map((product) => (
          <motion.div
            className="product-card"
            key={product.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedProduct(product);
              setShowContact(false);
            }}
            layout
          >
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p className="price">{product.price}</p>
          </motion.div>
        ))}
      </div>

      <motion.h2
        className="product-title"
        animate={{
          opacity: [1, 0.8, 1],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        More Products Coming Soon...!
      </motion.h2>

      {/* Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="product-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              className="product-modal-content"
              layoutId={`product-${selectedProduct.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedProduct.image} alt={selectedProduct.name} />
              <h2>{selectedProduct.name}</h2>
              <p>{selectedProduct.description}</p>
              <h3>{selectedProduct.price}</h3>

              <div className="button-row">
                <button onClick={() => setSelectedProduct(null)}>Close</button>
                <button onClick={() => setShowContact(true)}>Contact Us</button>
              </div>

              {/* Contact Info Popup */}
              <AnimatePresence>
                {showContact && (
                  <motion.div
                    className="contact-popup"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h4>Contact Us to Place Your Order</h4>
                    <p>
                      <FaPhoneAlt /> Mobile/WhatsApp:{" "}
                      <a
                        href="https://wa.link/0s0pho"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        +91 98765 43210
                      </a>
                    </p>
                    <p>
                      <FaInstagram /> Instagram:{" "}
                      <a
                        href="https://www.instagram.com/trisandhya_ayurveda_"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        @trisandhya_ayurveda_
                      </a>
                    </p>
                    <button onClick={() => setShowContact(false)}>Close</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="home-button"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        whileHover={{ scale: 1.1, backgroundColor: "#2e7d32" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/")}
      >
        Home
      </motion.button>
    </div>
  );
};
