import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import '../assets/Home.css';
import heroImage from '../assets/images/2.png';
import bgImage from '../assets/images/bgimg.webp';

function Home() {

  const navigate = useNavigate();

  return (
    <div className="home-container" style={{ backgroundImage: `url(${bgImage})` }}>

      <div className="back">
          <img className="hero-image" src={heroImage} alt="Ayurvedic Products" />
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
          Discover the healing power of nature with our curated Ayurvedic cosmetics.
        </motion.p>

        <motion.button
          className="shop-button"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{
            scale: 1.1,
            boxShadow: '0px 4px 15px rgba(1, 22, 1, 0.3)',
            backgroundColor: '#2e7d32'
          }}
      onClick={() => navigate('/product')}
        >
          View Products
        </motion.button>

        <motion.button
          className="shop-button"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{
            scale: 1.1,
            boxShadow: '0px 4px 15px rgba(1, 22, 1, 0.3)',
            backgroundColor: '#2e7d32'
          }}
          onClick={() => navigate('/about')}
        >
          About Us
        </motion.button>

        <Toaster position="top-center" />
      </div>
    </div>
  );
}

export default Home;
