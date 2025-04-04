import QueryBuilder from "../../builder/QueryBuilder";
import { IJwtPayload } from "../auth/auth.interface";
import { Payment } from "./payment.model";

const getAllPayments = async (user:IJwtPayload,query: Record<string, unknown>) => {
    if(user.role !== 'admin'){
        throw new Error('You are not authorized');
    }
    const paymentQuery = new QueryBuilder(Payment.find(),query)
    .filter()
    .sort()
    .paginate()
    .fields();
    const payments = await paymentQuery.modelQuery;
    const meta = await paymentQuery.countTotal();
    return {
        payments,
        meta, 
    }
};

export const paymentServices = {
    getAllPayments,
};