import Stripe from 'stripe';
import Airtable from 'airtable';

const stripe = new Stripe(process.env.STRIPE_KEY);
const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY })
  .base(process.env.AIRTABLE_BASE);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ error: 'Missing itemId' });
    }

    // Recupera ledger item
    const record = await base('Ledger Items').find(itemId);
    const item = record.fields;

    if (item.Status !== 'open') {
      return res.status(400).json({ error: 'Pagamento non disponibile' });
    }

    if (!item.Amount || item.Amount <= 0) {
      return res.status(400).json({ error: 'Importo non valido' });
    }

    if (!item.Customer) {
      return res.status(400).json({ error: 'Ledger item senza Customer associato' });
    }

    // Costruisci URL dinamici di ritorno
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL; // es. https://tuo-progetto.vercel.app
    const successUrl = `${baseUrl}/paghero/${item.Customer}?success=1`;
    const cancelUrl = `${baseUrl}/paghero/${item.Customer}?canceled=1`;

    // Crea Checkout Session Stripe
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(item.Amount * 100),
            product_data: {
              name: item.Description || 'Pagamento'
            }
          },
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { ledgerItemId: itemId }
    });

    // Aggiorna Airtable → pending
    await base('Ledger Items').update(itemId, {
      Status: 'pending',
      StripeSessionId: session.id
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Errore /api/ledger/pay-item:', error);
    return res.status(500).json({ error: 'Errore durante la creazione del pagamento' });
  }
}


