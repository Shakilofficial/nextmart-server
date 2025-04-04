import { Request, Response } from 'express';
import { paymentServices, } from './payment.service';
import { IJwtPayload } from '../auth/auth.interface';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentServices.getAllPayments(req.user as IJwtPayload, req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Users are retrieved successfully',
    meta: result.meta,
    data: result.payments,
 });
})

export const paymentControllers = {
  getAllPayments,
};