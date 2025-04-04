import PDFDocument from 'pdfkit';
import { IOrder } from '../modules/order/order.interface';
import axios from 'axios';

/**
 * Generates a PDF invoice for an order with a modern, professional design.
 * @param {IOrder} order - The order object to generate the invoice for.
 * @returns {Promise<Buffer>} - The generated PDF as a Buffer.
 */
export const generateOrderInvoicePDF = async (order: IOrder): Promise<Buffer> => {
    return new Promise<Buffer>(async (resolve, reject) => {
        try {
            // Company logo
            const logoUrl = 'https://res.cloudinary.com/dcyupktj6/image/upload/v1743785261/kr6igjlpka34xpm4rxbp.png';
            const response = await axios.get(logoUrl, { responseType: 'arraybuffer' });
            const logoBuffer = Buffer.from(response.data);

            // PDF document setup with better margins
            const doc = new PDFDocument({ 
                margin: 50,
                size: 'A4',
                info: {
                    Title: `Nexa Invoice #${order._id}`,
                    Author: 'Nexa',
                    Subject: 'Order Invoice',
                }
            });

            // Buffer collection for final PDF
            const buffers: Buffer[] = [];
            //@ts-ignore
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err: Error) => reject(err));

            // Color scheme - Rose theme
            const colors = {
                primary: '#f43f5e',      // Rose-500
                secondary: '#fb7185',    // Rose-400
                dark: '#881337',         // Rose-900
                light: '#fecdd3',        // Rose-200
                text: '#1f2937',         // Gray-800
                textLight: '#6b7280',    // Gray-500
                background: '#fff1f2',   // Rose-50
            };

            // Add a subtle background color to the entire page
            doc.rect(0, 0, doc.page.width, doc.page.height)
               .fill(colors.background);

            // Header with modern design
            const headerHeight = 120;
            doc.rect(0, 0, doc.page.width, headerHeight)
               .fill(colors.primary);
            
            // Logo placement
            const logoWidth = 80;
            const logoX = 50;
            const logoY = 30;
            doc.image(logoBuffer, logoX, logoY, { width: logoWidth });
            
            // Company name and info in header
            doc.fontSize(24)
               .font('Helvetica-Bold')
               .fillColor('#ffffff')
               .text('NEXA', 50, logoY + 10, { align: 'right' });
            
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#ffffff')
               .text('Level-2, 00, Nexa Plaza, Banani, Dhaka', 50, logoY + 40, { align: 'right' })
               .text('Email: support@nexa.com', 50, logoY + 55, { align: 'right' })
               .text('Phone: + 06 223 456 678', 50, logoY + 70, { align: 'right' });

            // Invoice title banner
            doc.rect(50, headerHeight + 20, doc.page.width - 100, 40)
               .fill(colors.dark);
            
            doc.fontSize(16)
               .font('Helvetica-Bold')
               .fillColor('#ffffff')
               .text('INVOICE', 0, headerHeight + 32, { align: 'center' });

            // Invoice and customer details section
            const detailsY = headerHeight + 80;
            
            // Left column - Invoice details
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .fillColor(colors.dark)
               .text('INVOICE DETAILS', 50, detailsY);
            
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor(colors.text)
               .text(`Invoice ID: ${order._id}`, 50, detailsY + 20)
               .text(`Date: ${(order.createdAt as Date).toLocaleDateString()}`, 50, detailsY + 35)
               .text(`Payment Method: ${order.paymentMethod}`, 50, detailsY + 50)
               .text(`Payment Status: ${order.paymentStatus}`, 50, detailsY + 65);
            
            // Right column - Customer details
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .fillColor(colors.dark)
               .text('CUSTOMER DETAILS', 300, detailsY);
            
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor(colors.text)
               //@ts-ignore
               .text(`Name: ${order.user.name}`, 300, detailsY + 20)
               .text(`Shipping Address:`, 300, detailsY + 35)
               .text(order.shippingAddress, 300, detailsY + 50, { width: 200 });

            // Products table with modern styling
            const tableTop = detailsY + 100;
            
            // Table header background
            doc.rect(50, tableTop, doc.page.width - 100, 25)
               .fill(colors.secondary);
            
            // Table headers
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .fillColor('#ffffff')
               .text('PRODUCT', 60, tableTop + 8)
               .text('QTY', 300, tableTop + 8)
               .text('UNIT PRICE', 370, tableTop + 8)
               .text('AMOUNT', 470, tableTop + 8);
            
            let currentY = tableTop + 25;
            
            // Alternating row colors for better readability
            order.products.forEach((item, index) => {
                // Alternating row background
                doc.rect(50, currentY, doc.page.width - 100, 25)
                   .fill(index % 2 === 0 ? '#ffffff' : colors.light);
                
                //@ts-ignore
                const productName = item.product?.name || 'Unknown Product';
                const quantity = item.quantity;
                //@ts-ignore
                const unitPrice = item.unitPrice || 0;
                //@ts-ignore
                const price = unitPrice * quantity;
                
                doc.fontSize(9)
                   .font('Helvetica')
                   .fillColor(colors.text)
                   .text(productName, 60, currentY + 8, { width: 220 })
                   .text(quantity.toString(), 300, currentY + 8)
                   .text(unitPrice.toFixed(2), 370, currentY + 8)
                   .text(price.toFixed(2), 470, currentY + 8);
                
                currentY += 25;
            });
            
            // Summary section with modern styling
            const summaryTop = currentY + 20;
            
            // Left side - Notes
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .fillColor(colors.dark)
               .text('NOTES', 50, summaryTop);
            
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor(colors.text)
               .text('Thank you for your business. We appreciate your trust in Nexa.', 50, summaryTop + 20, { width: 250 });
            
            // Right side - Order summary
            const summaryBoxWidth = 200;
            const summaryBoxX = doc.page.width - 50 - summaryBoxWidth;
            
            // Summary box with subtle border
            doc.rect(summaryBoxX, summaryTop, summaryBoxWidth, 110)
               .lineWidth(1)
               .stroke(colors.primary);
            
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .fillColor(colors.dark)
               .text('ORDER SUMMARY', summaryBoxX + 10, summaryTop + 10);
            
            // Summary items
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor(colors.text)
               .text('Subtotal:', summaryBoxX + 10, summaryTop + 30)
               .text(`${order.totalAmount.toFixed(2)} /-`, summaryBoxX + summaryBoxWidth - 70, summaryTop + 30, { align: 'right' })
               
               .text('Discount:', summaryBoxX + 10, summaryTop + 50)
               .text(`-${order.discount.toFixed(2)} /-`, summaryBoxX + summaryBoxWidth - 70, summaryTop + 50, { align: 'right' })
               
               .text('Delivery Charge:', summaryBoxX + 10, summaryTop + 70)
               .text(`${order.deliveryCharge.toFixed(2)} /-`, summaryBoxX + summaryBoxWidth - 70, summaryTop + 70, { align: 'right' });
            
            // Total amount with highlight
            doc.rect(summaryBoxX, summaryTop + 90, summaryBoxWidth, 20)
               .fill(colors.primary);
            
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .fillColor('#ffffff')
               .text('TOTAL:', summaryBoxX + 10, summaryTop + 95)
               .text(`${order.finalAmount.toFixed(2)} /-`, summaryBoxX + summaryBoxWidth - 70, summaryTop + 95, { align: 'right' });
            
            // Footer
            const footerY = doc.page.height - 50;
            
            doc.rect(0, footerY - 20, doc.page.width, 70)
               .fill(colors.primary);
            
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .fillColor('#ffffff')
               .text('Thank you for shopping with Nexa!', 0, footerY, { align: 'center' });
            
            doc.fontSize(8)
               .font('Helvetica')
               .fillColor('#ffffff')
               .text('This is a computer-generated invoice and does not require a signature.', 0, footerY + 20, { align: 'center' });
            
            // Finalize the document
            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};
