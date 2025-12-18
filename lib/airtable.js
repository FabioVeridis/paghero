import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(process.env.AIRTABLE_BASE);

export async function fetchLedger(customerId) {
  const records = await base('Ledger Items')
    .select({ filterByFormula: `{Customer} = '${customerId}'` })
    .all();

  return {
    items: records.map(r => ({
      id: r.id,
      merchant: r.fields['Merchant Name'],
      amount: r.fields['Amount'],
      description: r.fields['Description'],
      status: r.fields['Status'],
      StripeAccountID: r.fields['StripeAccountID']
    }))
  };
}
