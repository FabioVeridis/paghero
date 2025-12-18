import Airtable from 'airtable';

// Funzione server-side per prendere i ledger items del customer
export async function getServerSideProps({ params }) {
  try {
    const customerId = params.customerId;

    const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(process.env.AIRTABLE_BASE);

    // Fetch ledger items filtrando per il campo corretto "customerId"
    const ledgerItemsRecords = await base('Ledger Items').select({
      filterByFormula: `{customerId} = '${customerId}'`
    }).firstPage();

    const ledgerItems = ledgerItemsRecords.map(record => ({
      id: record.id,
      ...record.fields
    }));

    return {
      props: { ledgerItems }
    };
  } catch (error) {
    console.error("Errore fetch Airtable:", error);
    return {
      props: { ledgerItems: [] } // evita errori 500
    };
  }
}

// Componente React per mostrare i ledger items
export default function Paghero({ ledgerItems }) {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Pagherò digitale</h1>
      {ledgerItems.length === 0 ? (
        <p>Nessun pagamento aperto</p>
      ) : (
        ledgerItems.map(item => (
          <div key={item.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            <p><strong>Merchant:</strong> {item.MerchantName || 'N/A'}</p>
            <p><strong>Descrizione:</strong> {item.Description || 'N/A'}</p>
            <p><strong>Importo:</strong> {item.Amount || '0'} €</p>
            <button style={{ padding: '5px 10px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '5px' }}>
              Paga ora
            </button>
          </div>
        ))
      )}
    </div>
  );
}
