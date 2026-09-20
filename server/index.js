import express from 'express';
import cors from 'cors';
import { Webhook } from 'standardwebhooks';
import DodoPayments from 'dodopayments';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { 
  upsertUser, updateUserSubscription, getAllUsers, 
  getAllQuestions, addQuestion, updateQuestion, deleteQuestion 
} from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Capture raw body for webhook verification
app.use('/api/webhook/dodo', express.text({ type: '*/*' }));
app.use(express.json());
app.use(cors());

// Initialize DodoPayments SDK (Delay initialization to prevent server crash if key is missing)
let dodoClient;
const initDodoClient = () => {
  if (dodoClient) return dodoClient;
  const token = process.env.VITE_DODO_API_KEY || process.env.DODO_API_KEY;
  if (!token) throw new Error('DODO_API_KEY is not set in .env');
  
  dodoClient = new DodoPayments({
    bearerToken: token,
    environment: process.env.VITE_DODO_MODE === 'test' ? 'test_mode' : 'live_mode',
  });
  return dodoClient;
};

// ─── API: Create Checkout Session ─────────────────────────────────────────────

app.post('/api/checkout', async (req, res) => {
  try {
    const { packageKey, customerEmail } = req.body;
    
    // Determine product ID from environment variables
    let productId = process.env.VITE_DODO_PRODUCT_MONTHLY;
    if (packageKey === 'pro_annual') {
      productId = process.env.VITE_DODO_PRODUCT_ANNUAL;
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is not configured in .env' });
    }

    // Generate checkout session via API
    // This securely generates a one-time session URL instead of hardcoding /buy/:id
    const sessionPayload = {
      product_cart: [{ product_id: productId, quantity: 1 }]
    };

    if (customerEmail) {
      sessionPayload.customer = { email: customerEmail };
    }

    const client = initDodoClient();
    const session = await client.checkoutSessions.create(sessionPayload);

    // If Dodo API returns the redirect url, we append our redirect param if possible
    // Alternatively, Dodo allows configuring redirect URLs in their dashboard.
    res.json({ url: session.checkout_url });
  } catch (error) {
    console.error('Checkout creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
});

// ─── API: Webhook Listener ────────────────────────────────────────────────────

app.post('/api/webhook/dodo', async (req, res) => {
  try {
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('⚠️ Webhook secret not set (DODO_WEBHOOK_SECRET). Skipping signature verification.');
    } else {
      const webhook = new Webhook(webhookSecret);
      const headers = {
        'webhook-id': req.headers['webhook-id'],
        'webhook-signature': req.headers['webhook-signature'],
        'webhook-timestamp': req.headers['webhook-timestamp'],
      };
      // standardwebhooks requires the raw text body to compute signature
      webhook.verify(req.body, headers); 
    }

    // Parse the payload
    const payload = JSON.parse(req.body);
    const event = payload.type;
    const data = payload.data; 

    console.log(`📦 Received Dodo Webhook: ${event}`);

    const customerEmail = data?.customer?.email || data?.email || 'unknown@example.com';
    const customerId = data?.customer?.id || data?.customer_id;
    const subscriptionId = data?.subscription_id || data?.id;

    // Handle standard subscription lifecycle events
    if (event === 'subscription.active' || event === 'payment.succeeded') {
      upsertUser({
        id: crypto.randomUUID(), 
        email: customerEmail,
        name: data?.customer?.name || 'Pro User',
        plan: 'pro',
        subscription_status: 'active',
        subscription_id: subscriptionId,
        customer_id: customerId
      });
      console.log(`✅ Provisioned Pro access for ${customerEmail}`);
    } 
    else if (event === 'subscription.canceled') {
      updateUserSubscription(customerEmail, 'pro', 'canceled', subscriptionId, customerId);
      console.log(`❌ Subscription canceled for ${customerEmail}`);
    }
    else if (event === 'subscription.past_due' || event === 'subscription.failed') {
      updateUserSubscription(customerEmail, 'free', 'past_due', subscriptionId, customerId);
      console.log(`⚠️ Subscription past due for ${customerEmail} - Access Revoked`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// ─── API: Admin Dashboard Data ────────────────────────────────────────────────

app.get('/api/admin/users', (req, res) => {
  try {
    const users = getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin endpoint to manually control a user's subscription status
app.post('/api/admin/users/status', (req, res) => {
  try {
    const { email, action } = req.body;
    
    if (!email || !action) {
      return res.status(400).json({ error: 'Email and action are required' });
    }

    if (action === 'grant_pro') {
      // Force user into active Pro state
      upsertUser({
        id: crypto.randomUUID(), 
        email,
        name: 'Manual Admin Grant',
        plan: 'pro',
        subscription_status: 'active',
        subscription_id: 'sub_manual_' + Date.now(),
        customer_id: 'cus_manual_' + Date.now()
      });
      return res.json({ success: true, message: `Granted PRO access to ${email}` });
    } 
    
    if (action === 'revoke') {
      // Force user into canceled/inactive state
      updateUserSubscription(email, 'free', 'canceled', null, null);
      return res.json({ success: true, message: `Revoked access for ${email}` });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Admin status update error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// ─── API: Interview Questions ────────────────────────────────────────────────

app.get('/api/questions', (req, res) => {
  try {
    const questions = getAllQuestions();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

app.post('/api/admin/questions', (req, res) => {
  try {
    const q = req.body;
    q.id = crypto.randomUUID();
    addQuestion(q);
    res.json({ success: true, message: 'Question added', question: q });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

app.put('/api/admin/questions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const q = req.body;
    updateQuestion(id, q);
    res.json({ success: true, message: 'Question updated' });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

app.delete('/api/admin/questions/:id', (req, res) => {
  try {
    const { id } = req.params;
    deleteQuestion(id);
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

app.listen(port, () => {
  console.log(`\n🚀 Backend Server running on http://localhost:${port}`);
  console.log(`💳 Dodo Checkout API: http://localhost:${port}/api/checkout`);
  console.log(`📡 Webhooks listening on: http://localhost:${port}/api/webhook/dodo`);
});
