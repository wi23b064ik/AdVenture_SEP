import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Typen definieren
interface Bid {
  id: string;
  advertiserName: string;
  bidAmountCPM: number;
  submitTime: string;
  status: string;
}

interface AuctionDetail {
  id: string;
  adSpaceName: string;
  adSpaceId: string;
  publisherId: string;
  startTime: string;
  endTime: string;
  status: 'open' | 'closed';
  minimumBidFloor: number;
  mediaUrl?: string; // <--- NEU: Das Bild
  totalBids: number;
  allBids: Bid[];
}

export default function AuctionDetails() {
  const { id } = useParams<{ id: string }>(); 
  const navigate = useNavigate();
  
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/auctions/${id}`);
        if (!response.ok) throw new Error('Auktion nicht gefunden');
        const data = await response.json();
        setAuction(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Fehler beim Laden';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetails();
  }, [id]);

  if (loading) return <div style={{padding: '2rem'}}>Lade Details...</div>;
  if (error) return <div style={{padding: '2rem', color: 'red'}}>Fehler: {error}</div>;
  if (!auction) return <div style={{padding: '2rem'}}>Keine Daten gefunden.</div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>← Zurück</button>
      
      <div style={styles.header}>
        <h1>{auction.adSpaceName} <span style={styles.idTag}>#{auction.id}</span></h1>
        <div style={{
          ...styles.statusBadge, 
          backgroundColor: auction.status === 'open' ? '#d1fae5' : '#f3f4f6',
          color: auction.status === 'open' ? '#065f46' : '#374151'
        }}>
          {auction.status.toUpperCase()}
        </div>
      </div>

      <div style={styles.grid}>
        {/* Linke Seite: Bild & Infos */}
        <div style={styles.card}>
          
          {/* --- NEU: Bild Anzeige --- */}
          {auction.mediaUrl ? (
            <div style={styles.imageContainer}>
              <img 
                src={`http://localhost:3001${auction.mediaUrl}`} 
                alt={auction.adSpaceName} 
                style={styles.image} 
              />
            </div>
          ) : (
            <div style={styles.placeholderImage}>Kein Bild verfügbar</div>
          )}

          <h3>Details</h3>
          <p><strong>Startzeit:</strong> {new Date(auction.startTime).toLocaleString()}</p>
          <p><strong>Endzeit:</strong> {new Date(auction.endTime).toLocaleString()}</p>
          <p><strong>Mindestgebot:</strong> €{Number(auction.minimumBidFloor).toFixed(2)}</p>
          <p><strong>Ad Space ID:</strong> {auction.adSpaceId}</p>
        </div>

        {/* Rechte Seite: Gebots-Verlauf */}
        <div style={styles.card}>
          <h3>Gebotsverlauf ({auction.totalBids})</h3>
          {auction.allBids.length === 0 ? (
            <p>Noch keine Gebote.</p>
          ) : (
            <ul style={styles.bidList}>
              {auction.allBids.map((bid, index) => (
                <li key={bid.id} style={styles.bidItem}>
                  <div style={styles.bidInfo}>
                    <span style={styles.rank}>#{index + 1}</span>
                    <span>{bid.advertiserName || 'Unbekannt'}</span>
                  </div>
                  <div style={styles.bidValue}>
                    €{Number(bid.bidAmountCPM).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// Styles mit Bild-Styling
const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '2rem', fontFamily: 'Arial, sans-serif' },
  backButton: { marginBottom: '1rem', padding: '0.5rem 1rem', cursor: 'pointer', border: 'none', background: '#e5e7eb', borderRadius: '4px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' },
  idTag: { fontSize: '1rem', color: '#6b7280', fontWeight: 'normal' },
  statusBadge: { padding: '0.5rem 1rem', borderRadius: '99px', fontWeight: 'bold', fontSize: '0.875rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' },
  bidList: { listStyle: 'none', padding: 0, margin: 0 },
  bidItem: { display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' },
  bidInfo: { display: 'flex', gap: '10px' },
  rank: { color: '#9ca3af', fontWeight: 'bold' },
  bidValue: { fontWeight: 'bold', color: '#2563eb' },
  
  // NEU: Styles für das Bild
  imageContainer: {
    width: '100%',
    height: '200px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' // Sorgt dafür, dass das Bild den Bereich füllt ohne verzerrt zu werden
  },
  placeholderImage: {
    width: '100%',
    height: '200px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#9ca3af',
    fontStyle: 'italic'
  }
};