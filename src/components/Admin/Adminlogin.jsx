import "../../assets/Adminlog.css";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import img from "../../assets/images/2.jpg";
import toast, { Toaster } from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";

export const Adminlogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Auto redirect if email is verified
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().role === "admin") {
            toast.success("Email verified! Redirecting...");
            navigate("/admin");
          }
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setShowResend(false);
    setLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await user.reload();

      if (!user.emailVerified) {
        toast.error(`Email not verified. Verification email sent to ${email}`);
        setShowResend(true);
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().role === "admin") {
        toast.success("Login successful!");
        navigate("/admin");
      } else {
        toast.error("Access denied. You are not an admin.");
      }
    } catch (err) {
      toast.error("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        await user.sendEmailVerification();
        toast.success(`Verification email sent to ${email}`);
      } else {
        toast.error("Please login again to resend verification.");
      }
    } catch (e) {
      toast.error("Failed to send verification email.");
    }
  };

  return (
    <div className="admin-login-container">
      <Toaster position="top-center" reverseOrder={false} />

      <motion.div
        className="admin-login-box"
        initial={{ opacity: 0, y: -60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <img className="img1" src={img} alt="Admin Login" />
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

          <motion.button
            type="submit"
            className="admin-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            {loading ? (
              <FaSpinner className="spinner" />
            ) : (
              "Login"
            )}
          </motion.button>
        </form>

        {showResend && (
          <motion.button
            type="button"
            className="admin-button resend-button"
            onClick={resendVerification}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Resend Verification Email
          </motion.button>
        )}

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
