import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export const calculateCheckoutTotal = async (cart) => {
  const snapshot = await getDocs(collection(db, "promotions"));
  const promotions = snapshot.docs.map(doc => doc.data());
  
  const now = new Date();
  let subtotal = 0;
  let totalDiscount = 0;
  const itemsWithPromo = [];

  cart.forEach(item => {
    if (item.isBundle) {
      const originalTotal = item.products.reduce((sum, p) => sum + p.price, 0);
      const bundlePrice = item.price;
      const discount = originalTotal - bundlePrice;
      
      subtotal += originalTotal;
      totalDiscount += discount;
      
      itemsWithPromo.push({
        isBundle: true,
        name: item.name,
        products: item.products,
        original_price: originalTotal,
        final_price: bundlePrice,
        discount: discount
      });
      return;
    }
    
    const quantity = item.quantity || 1;
    const activePromo = promotions.find(promo => {
      if (promo.lot_id !== item.lot_id) return false;
      const startTime = promo.start_datetime || promo.start_date;
      const endTime = promo.end_datetime || promo.end_date;
      const startValid = !startTime || new Date(startTime) <= now;
      const endValid = !endTime || new Date(endTime) >= now;
      return startValid && endValid;
    });

    const originalPrice = item.price * quantity;
    const promoPrice = activePromo?.promo_price ? Number(activePromo.promo_price) : null;
    const finalPrice = promoPrice ? promoPrice * quantity : originalPrice;
    const discount = promoPrice ? (item.price - promoPrice) * quantity : 0;

    subtotal += originalPrice;
    totalDiscount += discount;

    itemsWithPromo.push({
      lot_id: item.lot_id,
      name: item.name,
      image: item.image,
      quantity: quantity,
      original_price: item.price,
      promo_price: promoPrice,
      final_price: finalPrice,
      discount: discount,
      promotion_label: activePromo?.marketing_label || null
    });
  });

  return {
    items: itemsWithPromo,
    subtotal: Math.round(subtotal),
    totalDiscount: Math.round(totalDiscount),
    finalTotal: Math.round(subtotal - totalDiscount)
  };
};

export const processCheckout = async (formData, cart) => {
  const checkoutData = await calculateCheckoutTotal(cart);
  
  const orderData = {
    ...formData,
    cart: checkoutData.items,
    subtotal: checkoutData.subtotal,
    discount: checkoutData.totalDiscount,
    total: checkoutData.finalTotal,
    status: "Not Packed",
    createdAt: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, "orders"), orderData);
  
  return {
    orderId: docRef.id,
    ...checkoutData
  };
};
