import { Router } from 'express';
import userRoutes from '../user/routes';
import orderRoutes from '../order/routes';

const router = Router();

router.use('/user', userRoutes);
router.use('/order', orderRoutes);

export default router;
