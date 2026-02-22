import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaLeaf, FaSeedling, FaSpa, FaInstagram, FaWhatsapp } from "react-icons/fa";
import "../assets/About.css";
import doctorImage from "../assets/images/doctor.png";
import bgImage from "../assets/images/pro.jpg";

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 1) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.3, duration: 0.6 },
    }),
};

export const About = () => {
    const navigate = useNavigate();
    
    return (
        <div className="about" style={{ backgroundImage: `url(${bgImage})` }}>
            <motion.div
                className="about-container"
                initial="hidden"
                animate="visible"
                exit="hidden"
            >
                <motion.h1 className="about-title" variants={fadeUp} custom={0}>
                    Discover Trisandhya Ayurveda
                </motion.h1>

                <motion.p className="about-intro" variants={fadeUp} custom={1}>
                    At Trisandhya Ayurveda, we celebrate the ancient healing traditions of Ayurveda,
                    blending time-tested wisdom with modern quality standards to bring you authentic
                    wellness products sourced directly from nature.
                </motion.p>

                <motion.div className="about-mission" variants={fadeUp} custom={2}>
                    <h2>Our Mission</h2>
                    <p>
                        To empower individuals on their health journey by providing pure, sustainable, and
                        effective Ayurvedic remedies. We prioritize ethical sourcing and eco-friendly practices
                        to protect both your wellbeing and the planet.
                    </p>
                </motion.div>

                <motion.div className="about-values" variants={fadeUp} custom={3}>
                    <h2>Our Core Values</h2>
                    <div className="values-grid">
                        <div className="value-card">
                            <FaLeaf className="value-icon" />
                            <h3>Purity</h3>
                            <p>Only natural, pesticide-free herbs and ingredients.</p>
                        </div>
                        <div className="value-card">
                            <FaSeedling className="value-icon" />
                            <h3>Sustainability</h3>
                            <p>Supporting eco-friendly farming and responsible harvesting.</p>
                        </div>
                        <div className="value-card">
                            <FaSpa className="value-icon" />
                            <h3>Healing</h3>
                            <p>Formulations designed for holistic body, mind, and soul wellness.</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div className="about-founder" variants={fadeUp} custom={4}>
                    <h2>Meet Our Founder</h2>
                    <div className="founder-profile">
                        <img src={doctorImage} alt="Dr. Malavika Sadanandan" className="founder-img" />
                        <div className="founder-info">
                            <h3>Dr. Malavika Sadanandan</h3>
                            <p>
                                Dr. Malavika Sadanandan, a dedicated BAMS and MD student of Ayurveda, is deeply passionate about reviving the ancient wisdom of natural healing. Though early in her journey, she has recently launched these wellness products with a mission to promote preventive healthcare and bring authentic Ayurvedic solutions to modern lifestyles.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div className="about-social" variants={fadeUp} custom={5}>
                    <h2>Connect with Us</h2>
                    <p>Follow us on social media for the latest updates and wellness tips!</p>
                    <div className="social-icons">
                        <motion.a
                            href="https://www.instagram.com/trisandhya_ayurveda_"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.3, color: "#C13584" }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Instagram"
                        >
                            <FaInstagram />
                        </motion.a>
                        <motion.a
                            href="https://wa.link/0s0pho"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.3, color: "#25D366" }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="WhatsApp"
                        >
                            <FaWhatsapp />
                        </motion.a>
                    </div>
                </motion.div>
            </motion.div>
            
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

export default About;
