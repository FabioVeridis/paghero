import Stripe from 'stripe';
import Airtable from 'airtable';

const stripe = new Stripe(process.env.STRIPE_KEY);
const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(process.env.AIRTABLE_BASE);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Ricevuto request body:', req.body);

    const { itemId } = req.body;
    if (!itemId) {
      console.warn('itemId mancante nella richiesta');
      return res.status(400).json({ error: 'Missing itemId' });
    }

    // Recupera ledger item da Airtable
    const record = await base('Ledger Items').find(itemId);
    const item = record.fields;
    console.log('Ledger item trovato:', item);

    if (item.Status !== 'open') {
      return res.status(400).json({ error: 'Pagamento non disponibile' });
    }
    if (!item.Amount || item.Amount <= 0) {
      return res.status(400).json({ error: 'Importo non valido' });
    }

    // Crea PaymentIntent su Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(item.Amount * 100),
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: { ledgerItemId: itemId }
    });
    console.log('PaymentIntent creato:', paymentIntent.id);

    // Aggiorna ledger item → pending
    await base('Ledger Items').update(itemId, {
      Status: 'pending',
      PaymentIntentId: paymentIntent.id
    });
    console.log('Ledger item aggiornato a pending');

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Errore /api/ledger/pay-item:', error);
    return res.status(500).json({ error: 'Errore durante la creazione del pagamento' });
  }
}
