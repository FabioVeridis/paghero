import Airtable from 'airtable';

// ===== SERVER SIDE =====
export async function getServerSideProps({ params, query }) {
  try {
    const customerId = params.customerId || query.nxtPcustomerId;

    if (!customerId) {
      return { props: { ledgerItems: [] } };
    }

    const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(process.env.AIRTABLE_BASE);

    // ===== DEBUG: fetch senza formula per vedere i valori reali =====
    const allLedgerItems = await base('Ledger Items').select({
      maxRecords: 20
    }).firstPage();

    allLedgerItems.forEach(r => {
      console.log('Ledger item ID:', r.id);
      console.log('Customer field (array):', r.fields.Customer);
      console.log('CustomerIDText:', r.fields.CustomerIDText);
      console.log('Status field:', r.fields.Status);
    });

    // ===== FETCH filtrando per customerId e status "open" usando CustomerIDText =====
    const ledgerItemsRecords = await base('Ledger Items').select({
      filterByFormula: `AND(
        FIND('${customerId}', {CustomerIDText}) > 0,
        {Status} = "open"
      )`
    }).firstPage();

    const ledgerItems = ledgerItemsRecords.map(record => ({
      id: record.id,
      ...record.fields
    }));

    console.log('Ledger items filtrati trovati:', ledgerItems);

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
