import { Router } from 'express';

import auth from '../../middleware/auth';
import { UserRole } from '../user/user.interface';
import { paymentControllers } from './payment.controller';

const router = Router();

// Define routes
router.get('/', auth(UserRole.ADMIN), paymentControllers.getAllPayments);

export const paymentRoutes = router;
