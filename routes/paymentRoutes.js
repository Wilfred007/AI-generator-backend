import express from 'express';
import { initializePayment, verifyPayment, webhookHandler } from '../controllers/paymentControllers.js';

const router = express.Router();

router.post('/initialize', initializePayment);
router.get('/verify', verifyPayment);

// Use express.raw for webhook if signature verification is needed
router.post('/webhook', express.raw({ type: '*/*' }), webhookHandler);

export default router;
