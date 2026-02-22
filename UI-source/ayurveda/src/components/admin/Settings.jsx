import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { onAuthStateChanged, updateEmail, updatePassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import "../../assets/Admin.css";

export const Settings = () => {
    const user = auth.currentUser;
    const [editField, setEditField] = useState(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [joinedDate, setJoinedDate] = useState("");
    const [lastLogin, setLastLogin] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (loggedUser) => {
            if (loggedUser) {
                const userRef = doc(db, "users", loggedUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setName(userData.name || "");
                    setEmail(loggedUser.email || "");

                    const createdAt = new Date(loggedUser.metadata.creationTime);
                    const lastLoginAt = new Date(loggedUser.metadata.lastSignInTime);

                    setJoinedDate(createdAt.toLocaleString());
                    setLastLogin(lastLoginAt.toLocaleString());
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const handleUpdate = async () => {
        try {
            if (editField === "name") {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, { name });
                toast.success("Name updated!");
            } else if (editField === "email") {
                await updateEmail(user, email);
                toast.success("Email updated!");
            } else if (editField === "password") {
                await updatePassword(user, password);
                toast.success("Password updated!");
            }
            setEditField(null);
        } catch (error) {
            toast.error("Error: " + error.message);
        }
    };

    const renderInputCard = (type) => (
        <motion.div className="settings-card expanded" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            {type === "name" && (
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter new name" />
            )}
            {type === "email" && (
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter new email" />
            )}
            {type === "password" && (
                <div className="password-field">
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                    />
                    <span className="eye-icon" onClick={() => setShowPassword((prev) => !prev)}>
                        {showPassword ? "🙈" : "👁️"}
                    </span>
                </div>
            )}
            <div className="settings-btns">
                <button onClick={handleUpdate}>Update</button>
                <button className="cancel" onClick={() => setEditField(null)}>Cancel</button>
            </div>
        </motion.div>
    );

    return (
        <motion.div
            className="settings-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            <Toaster position="top-center" />
            <h2>Update Profile</h2>
            <div className="settings-grid">
                {editField === "name" ? (
                    renderInputCard("name")
                ) : (
                    <motion.div className="settings-card" onClick={() => setEditField("name")}>
                        <h4>Display Name</h4>
                        <p>{name || "Not set"}</p>
                    </motion.div>
                )}

                {editField === "email" ? (
                    renderInputCard("email")
                ) : (
                    <motion.div className="settings-card" onClick={() => setEditField("email")}>
                        <h4>Email</h4>
                        <p>{email}</p>
                    </motion.div>
                )}

                {editField === "password" ? (
                    renderInputCard("password")
                ) : (
                    <motion.div className="settings-card" onClick={() => setEditField("password")}>
                        <h4>Change Password</h4>
                        <p>••••••••</p>
                        <button
                            className="show-password-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                toast("Password cannot be shown for security reasons", { icon: "⚠️" });
                            }}
                        >
                            Show Password
                        </button>
                    </motion.div>
                )}

                <motion.div className="settings-card info-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h4>Joined On</h4>
                    <p>{joinedDate || "Loading..."}</p>
                </motion.div>

                <motion.div className="settings-card info-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h4>Last Login</h4>
                    <p>{lastLogin || "Loading..."}</p>
                </motion.div>
            </div>

            <motion.div
                className="back-button-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="back-button"
                    onClick={() => navigate("/admin/dashboard")}
                >
                    ← Back to Dashboard
                </motion.button>
            </motion.div>
        </motion.div>
    );
};

export default Settings;
