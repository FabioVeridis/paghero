import Stripe from 'stripe';
import Airtable from 'airtable';

const stripe = new Stripe(process.env.STRIPE_KEY);
const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(process.env.AIRTABLE_BASE);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ error: 'Missing itemId' });

    // Recupera ledger item
    const record = await base('Ledger Items').find(itemId);
    const item = record.fields;

    if (item.Status !== 'open') return res.status(400).json({ error: 'Pagamento non disponibile' });
    if (!item.Amount || item.Amount <= 0) return res.status(400).json({ error: 'Importo non valido' });

    // Crea PaymentIntent (test mode)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(item.Amount * 100),
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: { ledgerItemId: itemId }
    });

    // Aggiorna ledger item → pending
    await base('Ledger Items').update(itemId, {
      Status: 'pending',
      PaymentIntentId: paymentIntent.id
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Errore /api/pay:', error);
    return res.status(500).json({ error: 'Errore durante la creazione del pagamento' });
  }
}
