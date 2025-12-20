// /pages/paghero/[customerId].js
import { useState, useEffect } from 'react';

export default function Paghero({ ledgerItems }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const handlePayNow = async (itemId) => {
    try {
      const res = await fetch('/api/ledger/pay-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });

      const data = await res.json();

      if (data.url) {
        // reindirizza direttamente alla Checkout Session Stripe
        window.location.href = data.url;
      } else {
        alert(data.error || 'Errore nel pagamento');
      }
    } catch (err) {
      console.error(err);
      alert('Errore nella richiesta di pagamento');
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h1>Pagherò digitale</h1>
        <p>Caricamento pagamenti...</p>
      </div>
    );
  }

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
    </div>
  );
}

// Server-side props: fetch ledger items filtrati per customerId
export async function getServerSideProps({ params }) {
  try {
    const customerId = params.customerId;
    if (!customerId) return { props: { ledgerItems: [] } };

    const Airtable = (await import('airtable')).default;
    const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(process.env.AIRTABLE_BASE);

    // Prendi tutti i ledger items aperti
    const allLedgerItems = await base('Ledger Items').select({
      filterByFormula: `{Status} = "open"`,
      maxRecords: 100
    }).firstPage();

    // Filtra lato server per linked Customer (array)
    const ledgerItems = allLedgerItems
      .filter(item => Array.isArray(item.fields.Customer) && item.fields.Customer.includes(customerId))
      .map(item => ({ id: item.id, ...item.fields }));

    return { props: { ledgerItems } };
  } catch (error) {
    console.error('Errore fetch Airtable:', error);
    return { props: { ledgerItems: [] } };
  }
}

