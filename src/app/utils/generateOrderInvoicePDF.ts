import PDFDocument from "pdfkit";
import { IOrder } from "../modules/order/order.interface";
import axios from "axios";
export const generateOrderInvoicePDF = async (
  order: IOrder
): Promise<Buffer> => {
  return new Promise<Buffer>(async (resolve, reject) => {
    try {
      const logoUrl =
        "https://res.cloudinary.com/dcyupktj6/image/upload/v1743785261/kr6igjlpka34xpm4rxbp.png";
      const response = await axios.get(logoUrl, {
        responseType: "arraybuffer",
      });
      const logoBuffer = Buffer.from(response.data);

      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        info: {
          Title: `Nexa Invoice #${order._id}`,
          Author: "Nexa",
          Subject: "Order Invoice",
        },
      });

      const buffers: Buffer[] = [];
      doc.registerFont("Sora", "../../assets/fonts/Sora-Regular.ttf");
      doc.registerFont("Sora-Bold", "../../assets/fonts/Sora-Bold.ttf");
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: Error) => reject(err));

      // Updated color palette
      const colors = {
        header: "#fce7f3", // Rose-100 (lighter header)
        banner: "#fb7185", // Rose-400
        highlight: "#f43f5e", // Rose-500
        background: "#ffffff",
        text: "#000000",
        lightRow: "#fdf2f8", // Rose-50
      };

      // HEADER
      const headerHeight = 100;
      doc.rect(0, 0, doc.page.width, headerHeight).fill(colors.header);

      // Float logo image to the right (replacing "NEXA" text)
      const logoWidth = 80;
      const logoX = doc.page.width - logoWidth - 50; // 50px right margin
      doc.image(logoBuffer, logoX, 30, { width: logoWidth });

      // Contact info (still aligned to the right)
      doc
        .fillColor(colors.text)
        .fontSize(10)
        .font("Sora")
        .text("Level-2, 00, Nexa Plaza, Tangail, Dhaka", 0, 60, {
          align: "right",
        })
        .text("Email: support@nexa.com", 0, 75, { align: "right" })
        .text("Phone: + 06 223 456 678", 0, 90, { align: "right" });

      // INVOICE BANNER
      doc
        .rect(50, headerHeight + 20, doc.page.width - 100, 30)
        .fill(colors.banner);
      doc
        .fillColor("#ffffff")
        .fontSize(16)
        .font("Sora-Bold")
        .text("INVOICE", 0, headerHeight + 28, { align: "center" });

      // DETAILS
      const detailsY = headerHeight + 60;
      doc
        .fillColor(colors.text)
        .fontSize(10)
        .font("Sora-Bold")
        .text("INVOICE DETAILS", 50, detailsY)
        .font("Sora")
        .fontSize(9)
        .text(`Invoice ID: ${order._id}`, 50, detailsY + 20)
        .text(
          `Date: ${(order.createdAt as Date).toLocaleDateString()}`,
          50,
          detailsY + 35
        )
        .text(`Payment Method: ${order.paymentMethod}`, 50, detailsY + 50)
        .text(`Payment Status: ${order.paymentStatus}`, 50, detailsY + 65);

      doc
        .font("Sora-Bold")
        .text("CUSTOMER DETAILS", 300, detailsY)
        .font("Sora")
        //@ts-ignore
        .text(`Name: ${order.user.name}`, 300, detailsY + 20)
        .text(`Shipping Address:`, 300, detailsY + 35)
        .text(order.shippingAddress, 300, detailsY + 50, { width: 200 });

      // PRODUCT TABLE
      const tableTop = detailsY + 100;
      doc.rect(50, tableTop, doc.page.width - 100, 25).fill(colors.banner);

      doc
        .fontSize(10)
        .font("Sora-Bold")
        .fillColor("#ffffff")
        .text("PRODUCT", 60, tableTop + 8)
        .text("QTY", 300, tableTop + 8)
        .text("UNIT PRICE", 370, tableTop + 8)
        .text("AMOUNT", 470, tableTop + 8);

      let currentY = tableTop + 25;

      order.products.forEach((item, index) => {
        const bgColor = index % 2 === 0 ? "#ffffff" : colors.lightRow;
        doc.rect(50, currentY, doc.page.width - 100, 25).fill(bgColor);
        //@ts-ignore
        const productName = item.product?.name || "Unknown Product";
        const quantity = item.quantity;
        const unitPrice = item.unitPrice || 0;
        const price = unitPrice * quantity;

        doc
          .fontSize(9)
          .font("Sora")
          .fillColor(colors.text)
          .text(productName, 60, currentY + 8, { width: 220 })
          .text(quantity.toString(), 300, currentY + 8)
          .text(unitPrice.toFixed(2), 370, currentY + 8)
          .text(price.toFixed(2), 470, currentY + 8);

        currentY += 25;
      });

      // NOTES & SUMMARY
      const summaryTop = currentY + 10;

      doc
        .fontSize(10)
        .font("Sora-Bold")
        .fillColor(colors.text)
        .text("NOTES", 50, summaryTop);
      doc
        .fontSize(9)
        .font("Sora")
        .text(
          "Thank you for your business. We appreciate your trust in Nexa.",
          50,
          summaryTop + 20,
          { width: 250 }
        );

      const summaryBoxWidth = 180;
      const summaryBoxX = doc.page.width - 50 - summaryBoxWidth;

      doc
        .rect(summaryBoxX, summaryTop, summaryBoxWidth, 110)
        .lineWidth(1)
        .stroke(colors.highlight);

      doc
        .font("Sora-Bold")
        .text("ORDER SUMMARY", summaryBoxX + 10, summaryTop + 10)
        .font("Sora")
        .fontSize(9)
        .fillColor(colors.text)
        .text("Subtotal:", summaryBoxX + 10, summaryTop + 30)
        .text(
          `${order.totalAmount.toFixed(2)} /-`,
          summaryBoxX + summaryBoxWidth - 10,
          summaryTop + 30,
          { align: "right" }
        )
        .text("Discount:", summaryBoxX + 10, summaryTop + 50)
        .text(
          `-${order.discount.toFixed(2)} /-`,
          summaryBoxX + summaryBoxWidth - 10,
          summaryTop + 50,
          { align: "right" }
        )
        .text("Delivery Charge:", summaryBoxX + 10, summaryTop + 70)
        .text(
          `${order.deliveryCharge.toFixed(2)} /-`,
          summaryBoxX + summaryBoxWidth - 10,
          summaryTop + 50,
          { align: "right" }
        );

      doc
        .rect(summaryBoxX, summaryTop + 90, summaryBoxWidth, 20)
        .fill(colors.highlight);
      doc
        .fontSize(10)
        .font("Sora-Bold")
        .fillColor("#ffffff")
        .text("TOTAL:", summaryBoxX + 10, summaryTop + 95)
        .text(
          `${order.finalAmount.toFixed(2)} /-`,
          summaryBoxX + summaryBoxWidth - 10,
          summaryTop + 95,
          { align: "right" }
        );

      // FOOTER
      const footerY = doc.page.height - 80;
      doc.rect(0, footerY, doc.page.width, 50).fill(colors.header);

      doc
        .fontSize(10)
        .font("Sora-Bold")
        .fillColor(colors.text)
        .text("Thank you for shopping with Nexa!", 0, footerY + 10, {
          align: "center",
        });

      doc
        .fontSize(8)
        .font("Sora")
        .text(
          "This is a computer-generated invoice and does not require a signature.",
          0,
          footerY + 28,
          { align: "center" }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
