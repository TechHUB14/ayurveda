import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/Home.css";
import img from "../assets/images/2.jpg";

export const Home = () => {
    const navigate = useNavigate();

    const handleProduct = () => {
        navigate("/product");
    };

    const handleAbout = () => {
        navigate("/about");
    };

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
                </motion.button><br/><br/>

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
                </motion.button>
            </div>
        </div>
    );
};
