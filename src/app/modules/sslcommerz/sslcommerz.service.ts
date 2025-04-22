import express, { Request, Response } from 'express';
import SSLCommerzPayment from 'sslcommerz-lts';
import config from '../../config';
import AppError from '../../errors/appError';
import { StatusCodes } from 'http-status-codes';
import { Payment } from '../payment/payment.model';
import { Order } from '../order/order.model';
import mongoose from 'mongoose';
import { generateOrderInvoicePDF } from '../../utils/generateOrderInvoicePDF';
import { EmailHelper } from '../../utils/emailHelper';

const app = express();

const store_id = config.ssl.store_id as string;
const store_passwd = config.ssl.store_pass as string;
const is_live = false; // true for live, false for sandbox


// SSLCommerz init
const initPayment = async (paymentData: { total_amount: number, tran_id: string }) => {
    const { total_amount, tran_id } = paymentData;

    const data = {
        total_amount,
        currency: 'BDT',
        tran_id,
        success_url: `${config.ssl.validation_url}?tran_id=${tran_id}`,
        fail_url: config.ssl.failed_url as string,
        cancel_url: config.ssl.cancel_url as string,
        ipn_url: 'https://nexa-server.vercel.app/api/v1/ssl/ipn',
        shipping_method: 'Courier',
        product_name: 'N/A.',
        product_category: 'N/A',
        product_profile: 'general',
        cus_name: 'N/A',
        cus_email: 'N/A',
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'N/A',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

    try {
        const apiResponse = await sslcz.init(data);

        // Redirect the user to the payment gateway
        const GatewayPageURL = apiResponse.GatewayPageURL;

        if (GatewayPageURL) {
            return GatewayPageURL;
        } else {
            throw new AppError(StatusCodes.BAD_GATEWAY, "Failed to generate payment gateway URL.");
        }
    } catch (error) {
        throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "An error occurred while processing payment.");
    }
};


const validatePaymentService = async (tran_id: string): Promise<boolean> => {
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

    const session = await mongoose.startSession();
    session.startTransaction();

    let updatedOrder: any;

    try {
        // @ts-ignore
        const validationResponse = await sslcz.transactionQueryByTransactionId({
            tran_id
        });

        const element = validationResponse.element[0];

        const data = {
            status: (element.status === 'VALID' || element.status === 'VALIDATED') ? 'Paid' : 'Failed',
            gatewayResponse: element
        };

        const updatedPayment = await Payment.findOneAndUpdate(
            { transactionId: element.tran_id },
            data,
            { new: true, session }
        );

        if (!updatedPayment) {
            throw new Error("Payment not updated");
        }

        updatedOrder = await Order.findByIdAndUpdate(
            updatedPayment.order,
            { paymentStatus: data.status },
            { new: true, session }
        ).populate('user products.product');

        if (!updatedOrder) {
            throw new Error("Order not updated");
        }

        if (data.status === 'Failed') {
            throw new Error("Payment failed");
        }

        await session.commitTransaction(); 
        session.endSession();

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Transaction Error:", error);
        return false;
    }

    try {
        const pdfBuffer = await generateOrderInvoicePDF(updatedOrder);
        const emailContent = await EmailHelper.createEmailContent(
            { userName: updatedOrder?.user?.name || "" },
            'orderInvoice'
        );

        const attachment = {
            filename: `Invoice_${updatedOrder._id}.pdf`,
            content: pdfBuffer,
            encoding: 'base64',
        };

        await EmailHelper.sendEmail(
            updatedOrder?.user?.email,
            emailContent,
            "Order confirmed-Payment Success!",
            attachment
        );

        return true;

    } catch (emailErr) {
        console.error("Email Sending Error:", emailErr);
        return true;
    }
};



export const sslService = {
    initPayment,
    validatePaymentService
};

