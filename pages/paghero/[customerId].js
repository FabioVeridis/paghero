// /pages/paghero/[customerId].js
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Airtable from 'airtable';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK);

// Componente per il form di pagamento
function CheckoutForm({ clientSecret, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href }
    });

    if (error) alert(error.message);
    setLoading(false);
    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px', borderRadius: '6px' }}
    >
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        style={{ marginTop: '10px', padding: '8px 12px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '5px' }}
      >
        {loading ? 'Processing...' : 'Paga ora'}
      </button>
    </form>
  );
}

// Frontend principale
export default function Paghero({ ledgerItems }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const handlePayNow = async (itemId) => {
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setSelectedItemId(itemId);
      } else {
        alert(data.error || 'Errore nel pagamento');
      }
    } catch (err) {
      console.error(err);
      alert('Errore nella richiesta di pagamento');
    }
  };

  const handleCloseForm = () => {
    setClientSecret(null);
    setSelectedItemId(null);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Pagherò digitale</h1>

      {!ledgerItems || ledgerItems.length === 0 ? (
        <p>Nessun pagamento aperto</p>
      ) : (
        ledgerItems.map(item => (
          <div key={item.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '6px' }}>
            <p><strong>Merchant:</strong> {item['Merchant Name'] || 'N/A'}</p>
            <p><strong>Descrizione:</strong> {item.Description || 'N/A'}</p>
            <p><strong>Importo:</strong> {item.Amount || '0'} €</p>
            <button
              onClick={() => handlePayNow(item.id)}
              style={{ padding: '8px 12px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Paga ora
            </button>
          </div>
        ))
      )}

      {clientSecret && selectedItemId && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} onClose={handleCloseForm} />
        </Elements>
      )}
    </div>
  );
}

// Server-side props per recuperare ledger items dal Customer
export async function getServerSideProps({ params, query }) {
  const customerId = params.customerId || query.nxtPcustomerId;

  if (!customerId) return { props: { ledgerItems: [] } };

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(process.env.AIRTABLE_BASE);

    const records = await base('Ledger Items').select({
      filterByFormula: `AND(
        FIND('${customerId}', ARRAYJOIN({Customer})) > 0,
        FIND('open', ARRAYJOIN({Status})) > 0
      )`
    }).firstPage();

    const ledgerItems = records.map(r => ({ id: r.id, ...r.fields }));

    return { props: { ledgerItems } };
  } catch (err) {
    console.error('Errore fetch Airtable:', err);
    return { props: { ledgerItems: [] } };
  }
}

