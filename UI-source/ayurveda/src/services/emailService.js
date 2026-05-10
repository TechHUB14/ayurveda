import emailjs from "@emailjs/browser";
import jsPDF from "jspdf";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const generateInvoicePDF = (orderData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Trisandhya Ayurveda", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Invoice", pageWidth / 2, y, { align: "center" });
  y += 12;

  // Order info
  doc.setFontSize(10);
  doc.text(`Order: ${orderData.orderNumber}`, 14, y);
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, pageWidth - 14, y, { align: "right" });
  y += 8;

  // Customer info
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(orderData.userName, 14, y); y += 5;
  doc.text(orderData.userPhone, 14, y); y += 5;
  doc.text(orderData.userEmail, 14, y); y += 5;
  doc.text(orderData.address, 14, y, { maxWidth: pageWidth - 28 }); y += 12;

  // Table header
  doc.setFillColor(76, 175, 80);
  doc.rect(14, y, pageWidth - 28, 8, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.text("Item", 16, y + 6);
  doc.text("Qty", 120, y + 6);
  doc.text("Price", 140, y + 6);
  doc.text("Total", pageWidth - 16, y + 6, { align: "right" });
  y += 12;
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");

  // Items
  orderData.items.forEach((item) => {
    if (y > 260) { doc.addPage(); y = 20; }
    const name = item.isBundle ? `🎁 ${item.name}` : item.name;
    const qty = item.quantity || 1;
    doc.text(name, 16, y, { maxWidth: 100 });
    doc.text(String(qty), 120, y);
    doc.text(`₹${item.isBundle ? item.original_price : item.original_price * qty}`, 140, y);
    doc.text(`₹${item.final_price}`, pageWidth - 16, y, { align: "right" });
    y += 8;
  });

  // Totals
  y += 4;
  doc.line(14, y, pageWidth - 14, y);
  y += 8;
  doc.text(`Subtotal: ₹${orderData.subtotal}`, pageWidth - 16, y, { align: "right" }); y += 6;
  if (orderData.discount > 0) {
    doc.setTextColor(76, 175, 80);
    doc.text(`Discount: -₹${orderData.discount}`, pageWidth - 16, y, { align: "right" }); y += 6;
    doc.setTextColor(0);
  }
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ₹${orderData.totalAmount}`, pageWidth - 16, y, { align: "right" });

  // Footer
  y += 16;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for shopping with Trisandhya Ayurveda!", pageWidth / 2, y, { align: "center" });
  doc.text("Contact: +91 81529 36826", pageWidth / 2, y + 5, { align: "center" });

  return doc.output("datauristring");
};

export const sendInvoiceEmail = async (orderData) => {
  try {
    const pdfDataUri = generateInvoicePDF(orderData);
    const itemsList = orderData.items
      .map((i) => `${i.isBundle ? "🎁 " : ""}${i.name} - ₹${i.final_price}`)
      .join("\n");

    await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      to_name: orderData.userName,
      to_email: orderData.userEmail,
      order_number: orderData.orderNumber,
      order_date: new Date().toLocaleDateString("en-IN"),
      items_list: itemsList,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      total: orderData.totalAmount,
      address: orderData.address,
      invoice_pdf: pdfDataUri,
    }, PUBLIC_KEY);

    return true;
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    return false;
  }
};
