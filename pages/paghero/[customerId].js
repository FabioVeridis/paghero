import Airtable from 'airtable';

// ===== SERVER SIDE =====
export async function getServerSideProps({ params, query }) {
  try {
    // Legge il customerId da rotta dinamica o query string
    const customerId = params.customerId || query.nxtPcustomerId;

    if (!customerId) {
      return { props: { ledgerItems: [] } };
    }

    const base = new Airtable({
      apiKey: process.env.AIRTABLE_KEY
    }).base(process.env.AIRTABLE_BASE);

    // Fetch ledger items filtrando per customerId e status "open"
    const ledgerItemsRecords = await base('Ledger Items').select({
      filterByFormula: `AND(
        {Customer} = '${customerId}',
        FIND('open', ARRAYJOIN({Status})) > 0
      )`
    }).firstPage();

    const ledgerItems = ledgerItemsRecords.map(record => ({
      id: record.id,
      ...record.fields
    }));

    console.log('Ledger items trovati:', ledgerItems);

    return { props: { ledgerItems } };
  } catch (error) {
    console.error('Errore fetch Airtable:', error);
    return { props: { ledgerItems: [] } };
  }
}

// ===== FRONTEND =====
export default function Paghero({ ledgerItems }) {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Pagherò digitale</h1>

      {ledgerItems.length === 0 ? (
        <p>Nessun pagamento aperto</p>
      ) : (
        ledgerItems.map(item => (
          <div
            key={item.id}
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '6px'
            }}
          >
            <p><strong>Merchant:</strong> {item.MerchantName || 'N/A'}</p>
            <p><strong>Descrizione:</strong> {item.Description || 'N/A'}</p>
            <p><strong>Importo:</strong> {item.Amount || '0'} €</p>

            <button
              style={{
                padding: '8px 12px',
                background: '#0070f3',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
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
