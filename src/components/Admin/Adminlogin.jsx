import "../../assets/Adminlog.css"; // your CSS file
import { useState } from "react";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import img from "../../assets/images/2.jpg"

export const Adminlogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().role === "admin") {
        navigate("/admin");
      } else {
        setError("Access denied. You are not an admin.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-login-container">
        
      <motion.div
        className="admin-login-box"
        initial={{ opacity: 0, y: -60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <img className="img1" src={img} />
        <h2 className="admin-login-title">Admin Login</h2>

        <form onSubmit={handleLogin} className="admin-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && <p className="admin-error">{error}</p>}

          <motion.button
            type="submit"
            className="admin-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Login
          </motion.button>
        </form>

        <motion.button
          className="back-home-button"
          onClick={() => navigate("/")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Back to home"
        >
          ← Back to Home
        </motion.button>
      </motion.div>
    </div>
  );
};
