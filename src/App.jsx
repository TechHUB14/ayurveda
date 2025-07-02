import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./components/Home";
import { Product } from "./components/Product";
import { About } from "./components/About";
import { Adminlogin } from "./components/Admin/Adminlogin";
import { Admin } from "./components/Admin/Admin";
import { Orders } from "./components/Admin/Orders";
import { Settings } from "./components/Admin/Settings";
import { CartPage } from "./components/CartPage";
import { CheckOut } from "./components/CheckOut";
import {Invoice} from "./components/Inovice";
function App() {
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false); // ✅ Define this state

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product" element={<Product cart={cart} setCart={setCart} />} />
        <Route path="/about" element={<About />} />
        <Route path="/adminlogin" element={<Adminlogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/orders" element={<Orders />} />
<Route path="/invoice/:id" element={<Invoice />} />
        <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} />} />
<Route path="/checkout" element={<CheckOut cart={cart} setCart={setCart} />} />

      </Routes>
    </Router>
  );
}

export default App;
