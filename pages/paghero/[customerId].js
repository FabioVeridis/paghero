import { fetchLedger } from '../../lib/airtable';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);

export async function getServerSideProps({ params }) {
  const ledger = await fetchLedger(params.customerId);
  return { props: { ledger } };
}

export default function Paghero({ ledger }) {
  const [loadingIds, setLoadingIds] = useState([]);

  async function payLineItem(item) {
    setLoadingIds(prev => [...prev, item.id]);
    try {
      const res = await fetch('/api/ledger/pay-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id })
      });
      const data = await res.json();

      if (data.clientSecret) {
        const stripe = await stripePromise;
        const { error } = await stripe.confirmCardPayment(data.clientSecret);
        if (error) alert('Errore pagamento: ' + error.message);
        else alert('Pagamento completato!');
      } else alert(data.error);
    } catch (err) {
      alert('Errore: ' + err.message);
    }
    setLoadingIds(prev => prev.filter(id => id !== item.id));
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Pagherò digitale</h1>

      <ul className="bg-white shadow rounded p-4">
        {ledger.items.map(item => (
          <li key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
            <div>
              <div className="font-semibold">{item.merchant}</div>
              <div className="text-sm text-gray-500">{item.description}</div>
              <div className="text-sm">€{item.amount} – {item.status}</div>
            </div>
            {item.status === 'open' && (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                onClick={() => payLineItem(item)}
                disabled={loadingIds.includes(item.id)}
              >
                {loadingIds.includes(item.id) ? 'Pagando...' : 'Paga ora'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

