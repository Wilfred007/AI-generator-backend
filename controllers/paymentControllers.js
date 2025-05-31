import axios from 'axios';
import userModel from '../models/userModel.js';

// Initialize Paystack secret key
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

// ===============
// Initialize Payment
// ===============
export const initializePayment = async (req, res) => {
  try {
    console.log('Payment data recieved:', req.body)
    const { email, amount } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ success: false, message: 'Email and amount required' });
    }

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Paystack uses kobo
        currency: 'NGN',
        callback_url: 'http://localhost:5173/verify-payment', // Replace with your frontend callback URL
      },
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json({
      success: true,
      data: response.data.data, // Contains the payment URL
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Payment initialization failed' });
  }
};

// ===============
// Verify Payment
// ===============
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference is required' });
    }

    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    });

    const data = response.data.data;

    if (data.status === 'success') {
      // Find the user by email (or better: by your own user id if sent)
      const user = await userModel.findOne({ email: data.customer.email });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Update user credit balance
      user.creditBalance += 5; // You can adjust credit logic
      await user.save();

      return res.json({
        success: true,
        message: 'Payment verified and credits added',
        creditBalance: user.creditBalance,
      });
    } else {
      res.status(400).json({ success: false, message: 'Payment not successful' });
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

// ===============
// Webhook Handler (Optional for auto payment update)
// ===============
export const webhookHandler = async (req, res) => {
  try {
    const event = req.body;

    console.log('Webhook received:', event); // good to keep for debugging

    if (event.event === 'charge.success') {
      const { reference, customer } = event.data;

      // Find user by email in your DB
      const user = await userModel.findOne({ email: customer.email });

      if (user) {
        user.creditBalance = (user.creditBalance || 0) + 5; // add 5 credits
        await user.save();
        console.log(`Added 5 credits to user ${customer.email}`);
      } else {
        console.log(`User with email ${customer.email} not found.`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error in webhookHandler:', error);
    res.sendStatus(500);
  }
};

