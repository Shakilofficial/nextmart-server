import { Request, Response } from "express";
import config from "../../config";
import catchAsync from "../../utils/catchAsync";
import { sslService } from "./sslcommerz.service";

const validatePaymentService = catchAsync(
  async (req: Request, res: Response) => {
    const tran_id = req.query.tran_id as string;
    const result = await sslService.validatePaymentService(tran_id);
    console.log(result);

    if (result) {
      res.redirect(301, config.ssl.success_url as string);
    } else {
      res.redirect(301, config.ssl.failed_url as string);
    }
  }
);

export const SSLController = {
  validatePaymentService,
};
