import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(process.env.AIRTABLE_BASE);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { customerId, merchant, amount, description, stripeAccount } = req.body;

  await base('Ledger Items').create({
    fields: {
      'Customer ID': [customerId],
      'Merchant Name': merchant,
      'Amount': amount,
      'Description': description,
      'Status': 'open',
      'StripeAccountID': stripeAccount
    }
  });

  res.status(200).json({ success: true });
}

