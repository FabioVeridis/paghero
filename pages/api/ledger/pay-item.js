import Stripe from 'stripe';
import Airtable from 'airtable';

const stripe = new Stripe(process.env.STRIPE_KEY);
const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(process.env.AIRTABLE_BASE);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { itemId } = req.body;
  const record = await base('Ledger Items').find(itemId);
  const item = record.fields;

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(item.Amount * 100),
        currency: 'eur',
        automatic_payment_methods: { enabled: true }
      },
      {
        stripeAccount: item.StripeAccountID // Direct Charges
      }
    );

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

