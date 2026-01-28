import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homepage" style={{ width: '100vw', margin: '0', padding: '0', overflowX: 'hidden' }}>
      {/* Introduction Section */}
      <section className="intro-section" style={{ width: '100%', margin: '0', padding: '60px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <div className="intro-container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          <h1 className="intro-title">Welcome to AdVenture</h1>
          <p className="intro-text">
            AdVenture is a revolutionary ad auction platform that connects publishers with advertisers. 
            We offer a transparent, real-time marketplace where publishers can monetize their ad spaces 
            and advertisers can reach their target audience at competitive prices. Our platform uses 
            advanced auction mechanisms to ensure fair pricing and maximum value for both parties.
          </p>
        </div>
      </section>

      <div className="separator" style={{ width: '100vw', margin: '0', padding: '0', height: '1px' }}></div>

      {/* How It Works Section */}
      <section className="how-section" style={{ width: '100%', margin: '0', padding: '60px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', backgroundColor: '#f9f9f9' }}>
        <h2 className="section-title" style={{ width: '100%', textAlign: 'center', margin: '0 0 50px 0', fontSize: '2.8rem' }}>How It Works</h2>
        <div className="roles-grid" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px', padding: '0 20px' }}>
          <div className="role-card">
            <h3>Publishers</h3>
            <p>
              Publishers list their ad spaces with dimensions, categories, and minimum bid prices. 
              When advertisers bid on these spaces, the highest bidder wins the placement.
            </p>
            <ul>
              <li>Create ad spaces</li>
              <li>Set minimum bids</li>
              <li>Receive bids</li>
              <li>Earn revenue</li>
            </ul>
          </div>

          <div className="role-card">
            <h3>Advertisers</h3>
            <p>
              Advertisers create campaigns and browse available ad spaces. They bid competitively 
              to win placements that match their target audience.
            </p>
            <ul>
              <li>Create campaigns</li>
              <li>Browse inventory</li>
              <li>Place bids</li>
              <li>Win placements</li>
            </ul>
          </div>

          <div className="role-card">
            <h3>The Auction</h3>
            <p>
              Our auction system operates in real-time with transparent bidding. Publishers set 
              minimum bid floors and advertisers compete to win the best ad spaces.
            </p>
            <ul>
              <li>Competitive bidding</li>
              <li>Transparent pricing</li>
              <li>Instant results</li>
              <li>Fair outcomes</li>
            </ul>{/*  */}
          </div>

          <div className="role-card">
            <h3>Payment & Results</h3>
            <p>
              Winning bids are processed instantly. Advertisers pay once per auction. Publishers 
              receive their earnings. Everyone wins in our marketplace.
            </p>
            <ul>
              <li>Instant settlement</li>
              <li>One-time payment</li>
              <li>Verified transactions</li>
              <li>Analytics dashboard</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="separator" style={{ width: '100vw', margin: '0', padding: '0', height: '1px' }}></div>

      {/* Q&A Section */}
      <section className="qa-section" style={{ width: '100%', margin: '0', padding: '60px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', backgroundColor: 'white' }}>
        <h2 className="section-title" style={{ width: '100%', textAlign: 'center', margin: '0 0 50px 0', fontSize: '2.8rem' }}>Frequently Asked Questions</h2>
        <div className="qa-grid" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto 50px auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', padding: '0 20px' }}>
          <div className="qa-card">
            <h4>How much does it cost?</h4>
            <p>AdVenture is free to join! Publishers earn revenue from bids, and advertisers only pay when they win an auction.</p>
          </div>

          <div className="qa-card">
            <h4>How long does an auction last?</h4>
            <p>Auction durations vary. Publishers can set custom time periods for their auctions, typically ranging from minutes to hours.</p>
          </div>

          <div className="qa-card">
            <h4>Can I set a minimum bid?</h4>
            <p>Yes! Publishers can set a minimum bid floor for each ad space to ensure competitive pricing.</p>
          </div>

          <div className="qa-card">
            <h4>How do I get paid?</h4>
            <p>Publishers receive payments for winning bids directly to their account. Payouts are processed automatically after auction close.</p>
          </div>
        </div>

        <div className="analytics-box" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0', background: 'transparent', borderRadius: '0', boxShadow: 'none', border: 'none' }}>
          <h3 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '40px', textAlign: 'center', color: '#1a1a1a' }}>Platform Statistics</h3>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '50px', width: '100%', margin: '0', padding: '0' }}>
            <div className="stat" style={{ textAlign: 'center' }}>
              <div className="stat-number" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#667eea', lineHeight: '1', marginBottom: '15px' }}>10,000+</div>
              <div className="stat-label" style={{ fontSize: '1rem', color: '#666', fontWeight: '600' }}>Active Users</div>
            </div>
            <div className="stat" style={{ textAlign: 'center' }}>
              <div className="stat-number" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#667eea', lineHeight: '1', marginBottom: '15px' }}>50,000+</div>
              <div className="stat-label" style={{ fontSize: '1rem', color: '#666', fontWeight: '600' }}>Auctions Completed</div>
            </div>
            <div className="stat" style={{ textAlign: 'center' }}>
              <div className="stat-number" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#667eea', lineHeight: '1', marginBottom: '15px' }}>$5M+</div>
              <div className="stat-label" style={{ fontSize: '1rem', color: '#666', fontWeight: '600' }}>Total Value Traded</div>
            </div>
            <div className="stat" style={{ textAlign: 'center' }}>
              <div className="stat-number" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#667eea', lineHeight: '1', marginBottom: '15px' }}>99.8%</div>
              <div className="stat-label" style={{ fontSize: '1rem', color: '#666', fontWeight: '600' }}>Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      <div className="separator" style={{ width: '100vw', margin: '0', padding: '0', height: '1px' }}></div>

      {/* Contact & CTA Section */}
      <section className="contact-section" style={{ width: '100%', margin: '0', padding: '60px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <div className="contact-container" style={{ width: '100%', maxWidth: '900px', margin: '0 auto', background: 'transparent', padding: '0', borderRadius: '0', textAlign: 'center', boxShadow: 'none', border: 'none' }}>
          <h2 className="section-title" style={{ fontSize: '2.8rem' }}>Join the AdVenture Community</h2>
          <p className="contact-text" style={{ fontSize: '1.1rem', marginBottom: '40px' }}>
            Ready to monetize your audience or reach new customers? Join thousands of publishers 
            and advertisers already using AdVenture to succeed in the digital marketplace.
          </p>
          
          <div className="contact-buttons" style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '60px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-large" onClick={() => navigate('/register')}>
              Get Started Today
            </button>
            <button className="btn btn-secondary btn-large" onClick={() => navigate('/login')}>
              Already a Member? Login
            </button>
          </div>
        </div>
      </section>

      <div className="separator" style={{ width: '100vw', margin: '0', padding: '0', height: '1px' }}></div>

      {/* Get in Touch Section */}
      <section className="contact-info-section" style={{ width: '100%', margin: '0', padding: '60px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' }}>
        <div className="contact-info" style={{ width: '100%', maxWidth: '900px', margin: '0 auto', background: 'transparent', padding: '0', borderRadius: '0', border: 'none', textAlign: 'center' }}>
          <h3 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '30px', color: '#1a1a1a' }}>Get in Touch</h3>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#666', margin: '12px 0' }}>Email: support@adventure.io</p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#666', margin: '12px 0' }}>Phone: +1 (555) 123-4567</p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#666', margin: '12px 0' }}>Discord: Join our community server</p>
        </div>
      </section>
    </div>
  );
}
