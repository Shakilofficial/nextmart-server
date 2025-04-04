import { Router } from 'express';
import { AuthController } from './auth.controller';
import clientInfoParser from '../../middleware/clientInfoParser';
import auth from '../../middleware/auth';
import { UserRole } from '../user/user.interface';
import validateRequest from '../../middleware/validateRequest';
import { AuthValidation } from './auth.validation';

const router = Router();

router.post('/login',validateRequest(AuthValidation.loginZodSchema), clientInfoParser, AuthController.loginUser);

router.post(
   '/refresh-token',
   validateRequest(AuthValidation.refreshTokenZodSchema),
   clientInfoParser,
   AuthController.refreshToken
);

router.post(
   '/change-password',
   auth(UserRole.ADMIN, UserRole.USER),
   validateRequest(AuthValidation.changePasswordZodSchema),
   AuthController.changePassword
);

router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-otp', AuthController.verifyOTP);
router.post('/reset-password', AuthController.resetPassword);

export const AuthRoutes = router;
