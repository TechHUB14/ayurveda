import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

function App() {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/product" element={<Product cart={cart} setCart={setCart} />} />
        <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} />} />
        <Route path="/checkout" element={<Checkout cart={cart} setCart={setCart} />} />
        <Route path="/orders" element={<UserOrders setCart={setCart} />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<Orders />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/products" element={<ManageProducts />} />
        <Route path="/admin/promotions" element={<Promotions />} />
        <Route path="/admin/coupons" element={<Coupons />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
