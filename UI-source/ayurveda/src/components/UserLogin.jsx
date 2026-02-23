import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import "../assets/UserLogin.css";
import logo from "../assets/images/2.png";

export const UserLogin = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ 
    email: "", 
    password: "", 
    name: "",
    phone: "",
    houseNo: "",
    street: "",
    locality: "",
    city: "",
    state: "",
    pincode: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          houseNo: formData.houseNo,
          street: formData.street,
          locality: formData.locality,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          role: "user"
        });
        alert("Account created successfully!");
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
      navigate("/product");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="user-login-page">
      <div style={{ textAlign: 'center', padding: '20px 0', background: 'transparent', borderBottom: 'none' }}>
        <img src={logo} alt="Trisandhya Ayurveda" style={{ height: '100px', maxWidth: '90%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
      </div>
      <motion.div
        className="user-login-container"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2>{isSignUp ? "🌿 Create Account" : "🌿 Welcome Back"}</h2>
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div className="form-section">
                <div className="form-section-title">Personal Information</div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-section">
                <div className="form-section-title">Shipping Address</div>
                <input
                  type="text"
                  placeholder="House No / Building"
                  value={formData.houseNo}
                  onChange={(e) => setFormData({ ...formData, houseNo: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Street / Road"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Locality / Area"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  required
                />
              </div>
              <div className="form-section">
                <div className="form-section-title">Account Credentials</div>
              </div>
            </>
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit">{isSignUp ? "Create Account" : "Login"}</button>
        </form>
        <p className="toggle-text">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <span className="toggle-link" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Login" : "Sign Up"}
          </span>
        </p>
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back to Home
        </button>
      </motion.div>
    </div>
  );
};

export default UserLogin;
