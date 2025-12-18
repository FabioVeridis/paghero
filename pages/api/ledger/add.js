import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(process.env.AIRTABLE_BASE);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, merchant, amount, description, stripeAccount } = req.body;

    await base('Ledger Items').create({
      fields: {
        Customer: [customerId], // linked record
        'Merchant Name': merchant, // verifica nome esatto campo Airtable
        Amount: amount,
        Description: description,
        Status: 'open',
        StripeAccountID: stripeAccount
      }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Errore Airtable create:', error);
    return res.status(500).json({ error: 'Errore durante la creazione del ledger item' });
  }
}


