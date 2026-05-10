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
      if (item.isBogo) {
        const purchaseTotal = (item.purchaseProducts || []).reduce((sum, p) => sum + (p.price * (item.purchase_quantity || 1)), 0);
        const giftOriginalTotal = (item.giftProducts || []).reduce((sum, p) => sum + (p.price * (item.get_quantity || 1)), 0);
        let giftFinalTotal = 0;
        if (item.for_type === "PERCENT_OFF") {
          giftFinalTotal = (item.giftProducts || []).reduce((sum, p) => sum + (p.price * (item.get_quantity || 1) * (1 - (item.for_discount || 0) / 100)), 0);
        } else if (item.for_type === "FIXED_PRICE") {
          giftFinalTotal = (item.for_discount || 0) * (item.get_quantity || 1);
        }
        // FREE = 0

        const originalTotal = purchaseTotal + giftOriginalTotal;
        const bundlePrice = purchaseTotal + giftFinalTotal;
        const discount = originalTotal - bundlePrice;

        subtotal += originalTotal;
        totalDiscount += discount;

        itemsWithPromo.push({
          isBundle: true,
          isBogo: true,
          name: item.name,
          products: item.products,
          purchaseProducts: item.purchaseProducts,
          giftProducts: item.giftProducts,
          purchase_quantity: item.purchase_quantity,
          get_quantity: item.get_quantity,
          for_type: item.for_type,
          for_discount: item.for_discount,
          same_lot: item.same_lot,
          original_price: Math.round(originalTotal),
          final_price: Math.round(bundlePrice),
          discount: Math.round(discount)
        });
        return;
      }

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

export const processCheckout = async (userData, cart) => {
  const checkoutData = await calculateCheckoutTotal(cart);
  
  const ordersSnapshot = await getDocs(collection(db, "orders"));
  const orderNumber = ordersSnapshot.size + 1;

  // Strip heavy image data from items before saving to Firestore
  const stripImage = (p) => ({ name: p.name, price: p.price, lot_id: p.lot_id });
  const lightItems = checkoutData.items.map(item => {
    if (item.isBogo) {
      const { image, ...rest } = item;
      return {
        ...rest,
        products: (item.products || []).map(stripImage),
        purchaseProducts: (item.purchaseProducts || []).map(stripImage),
        giftProducts: (item.giftProducts || []).map(stripImage)
      };
    }
    if (item.isBundle) {
      const { image, ...rest } = item;
      return {
        ...rest,
        products: (item.products || []).map(stripImage)
      };
    }
    const { image, ...rest } = item;
    return rest;
  });
  
  const orderData = {
    orderNumber: `ORD${String(orderNumber).padStart(5, '0')}`,
    userId: userData.uid || userData.id,
    userName: userData.name,
    userEmail: userData.email,
    userPhone: userData.phone,
    address: `${userData.houseNo}, ${userData.street}, ${userData.locality}, ${userData.city}, ${userData.state} - ${userData.pincode}`,
    state: userData.state || "",
    items: lightItems,
    subtotal: checkoutData.subtotal,
    discount: checkoutData.totalDiscount,
    totalAmount: checkoutData.finalTotal,
    status: "Not Packed",
    createdAt: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, "orders"), orderData);
  
  return {
    orderId: docRef.id,
    orderNumber: orderData.orderNumber,
    ...checkoutData
  };
};
