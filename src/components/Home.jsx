import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/Home.css";
import img from "../assets/images/2.jpg";
import im from "../assets/images/im3.png"
import toast, { Toaster } from "react-hot-toast";


export const Home = () => {
    const navigate = useNavigate();
    const [showPopup, setShowPopup] = useState(true); // show popup initially

    const handleProduct = () => {
        navigate("/product");
    };

    const handleAbout = () => {
        navigate("/about");
    };
    const handleChange = () => {
        navigate("/product");
    }


    return (
        <div className="home-container">
            <img className="img" src={img} />
            <div className="back">
                <motion.h1
                    className="home-title"
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    Welcome to Trisandhya Ayurveda
                </motion.h1>

                <motion.p
                    className="home-description"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                >
                    Discover the healing power of nature with our curated Ayurvedic products.
                </motion.p>

                <motion.button
                    className="shop-button"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{
                        scale: 1.5,
                        rotate: -5,
                        boxShadow: "0px 4px 15px rgba(1, 22, 1, 0.3)",
                        backgroundColor: "#2e7d32"
                    }}
                    onClick={handleProduct}
                >
                    View Products
                </motion.button><br /><br />

                <motion.button
                    className="shop-button"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{
                        scale: 1.5,
                        rotate: -5,
                        boxShadow: "0px 4px 15px rgba(1, 22, 1, 0.3)",
                        backgroundColor: "#2e7d32"
                    }}
                    onClick={handleAbout}
                >
                    About Us
                </motion.button><br />
                <Toaster position="top-center" />
                <motion.button
                    className="admin-button1"
                    whileHover={{ scale: 1.2 }}
                    onClick={() => {
                        toast("⚠️ Only Admin Users must login", {
                            duration: 1500,
                        });

                        setTimeout(() => {
                            navigate("/adminlogin");
                        }, 1500); // Delay matches toast duration
                    }}
                >
                    Admin
                </motion.button>

            </div>

            {showPopup && (
                <motion.div
                    className="popup-card"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}

                >
                    <img src={im} alt="limited-stock" className="popup-image" />
                    <p>🔥 Limited Stock Available!</p>
                    <button className="shop-now-btn" onClick={handleChange}>
                        Shop Now
                    </button>
                    <button className="close-btn" onClick={() => setShowPopup(false)}>×</button>
                </motion.div>
            )}

        </div>
    );
};
