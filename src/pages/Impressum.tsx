export default function Impressum() {
  return (
    <div className="impressum-page" style={{ width: '100vw', margin: '0', padding: '0', overflowX: 'hidden' }}>
      {/* Impressum Section */}
      <section className="impressum-section" style={{ width: '100%', margin: '0', padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: 'white' }}>
        <div className="impressum-container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '50px', color: '#1a1a1a', letterSpacing: '-0.5px' }}>Impressum (Imprint)</h1>
          
          {/* Grid Container for Sections - 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px', marginBottom: '25px' }}>
            {/* Company Information */}
            <section style={{ padding: '40px 35px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '20px', color: '#667eea' }}>Company</h2>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
                <p style={{ margin: '6px 0' }}>AdVenture GmbH</p>
                <p style={{ margin: '6px 0' }}>Headquarters: Vienna, Austria</p>
                <p style={{ margin: '6px 0' }}>VAT ID: ATU99999999</p>
              </div>
            </section>

            {/* Contact Information */}
            <section style={{ padding: '40px 35px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '20px', color: '#667eea' }}>Contact Information</h2>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
                <p style={{ margin: '6px 0' }}>AdVenture GmbH<br />Ringstraße 42<br />1010 Vienna, Austria</p>
                <p style={{ margin: '12px 0 6px 0' }}><strong>Email:</strong> <a href="mailto:info@adventure.io" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}>info@adventure.io</a></p>
                <p style={{ margin: '6px 0' }}><strong>Phone:</strong> +43 (1) 234-5678</p>
              </div>
            </section>

            {/* Management */}
            <section style={{ padding: '40px 35px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '20px', color: '#667eea' }}>Management</h2>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
                <p style={{ margin: '6px 0' }}>Isra Kuci<br />Ismihan Eda Gövercin <br /> Muhammed Kacakci </p>
              </div>
            </section>

            {/* Responsible for Content */}
            <section style={{ padding: '40px 35px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '20px', color: '#667eea' }}>Content Responsibility</h2>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
                <p style={{ margin: '6px 0' }}>Sarah Williams<br /><a href="mailto:content@adventure.io" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}>content@adventure.io</a></p>
              </div>
            </section>

            {/* Data Protection Officer */}
            <section style={{ padding: '40px 35px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '20px', color: '#667eea' }}>Data Protection</h2>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
                <p style={{ margin: '6px 0' }}><strong>Data Protection Officer:</strong><br /><a href="mailto:dpo@adventure.io" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}>dpo@adventure.io</a></p>
                <p style={{ margin: '12px 0 0 0' }}>Compliant with GDPR and Austrian Data Protection Act.</p>
              </div>
            </section>

            {/* Web Hosting */}
            <section style={{ padding: '40px 35px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '20px', color: '#667eea' }}>Hosting & Technical Support</h2>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
                <p style={{ margin: '6px 0' }}><strong>Operator:</strong> AdVenture GmbH</p>
                <p style={{ margin: '6px 0' }}><strong>Hosting:</strong> Cloud Infrastructure Partner</p>
                <p style={{ margin: '6px 0' }}><strong>Support:</strong> <a href="mailto:support@adventure.io" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}>support@adventure.io</a></p>
              </div>
            </section>
          </div>

          {/* Liability and Disclaimer - Full Width */}
          <section style={{ padding: '40px 35px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', marginBottom: '25px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '20px', color: '#667eea' }}>Liability Disclaimer</h2>
            <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
              <p style={{ margin: '8px 0' }}>The content of this website is provided "as is" without warranty. AdVenture GmbH shall not be liable for any damages resulting from the use of this website. External links are checked regularly, but AdVenture GmbH is not responsible for their content.</p>
            </div>
          </section>

          {/* Copyright - Full Width */}
          <section style={{ padding: '40px 35px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', marginBottom: '25px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '20px', color: '#667eea' }}>Copyright</h2>
            <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
              <p style={{ margin: '8px 0' }}>All content on this website is protected by copyright. Reproduction or publication without consent is not permitted.</p>
            </div>
          </section>

          {/* Last Updated */}
          <section style={{ paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
            <p style={{ fontSize: '0.85rem', color: '#999' }}>
              <strong>Last Updated:</strong> January 2026
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
