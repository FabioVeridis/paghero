import Airtable from 'airtable';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Paghero({ ledgerItems }) {
  const router = useRouter();
  const [apiError, setApiError] = useState(null);

  const handlePayNow = async (itemId) => {
    setApiError(null);

    try {
      const res = await fetch('/api/ledger/pay-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url; // 🔥 redirect Stripe
      } else {
        setApiError(data.error || 'Errore nel pagamento');
      }
    } catch (err) {
      console.error(err);
      setApiError('Errore nella richiesta di pagamento');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Pagherò digitale</h1>

      {router.query.success && (
        <p style={{ color: 'green' }}>Pagamento completato con successo</p>
      )}

      {router.query.canceled && (
        <p style={{ color: 'orange' }}>Pagamento annullato</p>
      )}

      {apiError && (
        <p style={{ color: 'red' }}>{apiError}</p>
      )}

      {!ledgerItems || ledgerItems.length === 0 ? (
        <p>Nessun pagamento aperto</p>
      ) : (
        ledgerItems.map(item => (
          <div
            key={item.id}
            style={{
              border: '1px solid #ccc',
              padding: 10,
              marginBottom: 10,
              borderRadius: 6
            }}
          >
            <p><strong>Merchant:</strong> {item['Merchant Name'] || 'N/A'}</p>
            <p><strong>Descrizione:</strong> {item.Description || 'N/A'}</p>
            <p><strong>Importo:</strong> {item.Amount} €</p>

            <button
              onClick={() => handlePayNow(item.id)}
              style={{
                padding: '8px 12px',
                background: '#0070f3',
                color: '#fff',
                border: 'none',
                borderRadius: 5,
                cursor: 'pointer'
              }}
            >
              Paga ora
            </button>
          </div>
        ))
      )}
    </div>
  );
}

