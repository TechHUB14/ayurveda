import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import VoiceButton from './components/VoiceButton';
import Home from './components/Home';
import About from './components/About';
import Product from './components/Product';
import CartPage from './components/CartPage';
import Checkout from './components/Checkout';
import UserLogin from './components/UserLogin';
import UserOrders from './components/UserOrders';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import Orders from './components/admin/Orders';
import Settings from './components/admin/Settings';
import ManageProducts from './components/admin/ManageProducts';
import Promotions from './components/admin/Promotions';
import Coupons from './components/admin/Coupons';
import './App.css';

function AppContent() {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const voiceActionsRef = useRef({});
  const navigate = useNavigate();
  const voice = useVoiceAssistant();

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const registerVoiceActions = useCallback((actions) => {
    Object.assign(voiceActionsRef.current, actions);
  }, []);

  const unregisterVoiceActions = useCallback((keys) => {
    keys.forEach((k) => delete voiceActionsRef.current[k]);
  }, []);

  // Global command handler
  useEffect(() => {
    voice.setCommandHandler((text) => {
      // Page-specific commands first
      if (voiceActionsRef.current.handleCommand) {
        const handled = voiceActionsRef.current.handleCommand(text);
        if (handled) return;
      }

      // Global navigation commands
      if (text.includes("go home") || text.includes("go to home")) {
        voice.speak("Going to home page");
        navigate("/");
        return;
      }
      if (text.includes("go to cart") || text.includes("view cart") || text.includes("open cart") || text.includes("show cart")) {
        voice.speak(`Opening cart. You have ${cart.length} items.`);
        navigate("/cart");
        return;
      }
      if (text.includes("checkout") || text.includes("check out")) {
        if (cart.length === 0) {
          voice.speak("Your cart is empty. Add some products first.");
          return;
        }
        voice.speak("Going to checkout");
        navigate("/checkout");
        return;
      }
      if (text.includes("show product") || text.includes("go to product") || text.includes("browse product")) {
        voice.speak("Opening products page");
        navigate("/product");
        return;
      }
      if (text.includes("my order") || text.includes("track order")) {
        voice.speak("Opening your orders");
        navigate("/orders");
        return;
      }
      if (text.includes("login") || text.includes("sign in")) {
        voice.speak("Opening login page");
        navigate("/login");
        return;
      }

      voice.speak("Sorry, please try again.");
    });
  }, [voice, navigate, cart.length]);

  const voiceProps = { registerVoiceActions, unregisterVoiceActions, speak: voice.speak };

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/product" element={<Product cart={cart} setCart={setCart} voice={voiceProps} />} />
        <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} voice={voiceProps} />} />
        <Route path="/checkout" element={<Checkout cart={cart} setCart={setCart} voice={voiceProps} />} />
        <Route path="/orders" element={<UserOrders setCart={setCart} />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<Orders />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/products" element={<ManageProducts />} />
        <Route path="/admin/promotions" element={<Promotions />} />
        <Route path="/admin/coupons" element={<Coupons />} />
      </Routes>
      <VoiceButton
        isListening={voice.isListening}
        transcript={voice.transcript}
        supported={voice.supported}
        onToggle={voice.isListening ? voice.stopListening : voice.startListening}
        voices={voice.voices}
        selectedVoice={voice.selectedVoice}
        onVoiceChange={voice.setSelectedVoice}
        rate={voice.rate}
        onRateChange={voice.setRate}
        pitch={voice.pitch}
        onPitchChange={voice.setPitch}
        onTestVoice={voice.speak}
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
