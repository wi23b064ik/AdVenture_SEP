export default function Impressum() {
  return (
    <div className="impressum-page" style={{ width: '100vw', margin: '0', padding: '0', overflowX: 'hidden' }}>
      {/* Impressum Section */}
      <section className="impressum-section" style={{ width: '100%', margin: '0', padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: 'white' }}>
        <div className="impressum-container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '900', marginBottom: '40px', color: '#1a1a1a', letterSpacing: '-0.5px' }}>Impressum (Imprint)</h1>
          
          {/* Grid Container for Sections - 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px', marginBottom: '25px' }}>
            {/* Business Information */}
            <section style={{ padding: '50px 40px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '15px', color: '#667eea' }}>Business Information</h2>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
                <p style={{ margin: '8px 0' }}><strong>Company Name:</strong> AdVenture GmbH</p>
                <p style={{ margin: '8px 0' }}><strong>Business Type:</strong> Digital Advertising Platform</p>
                <p style={{ margin: '8px 0' }}><strong>Registration Number:</strong> HRB 12345678</p>
                <p style={{ margin: '8px 0' }}><strong>VAT ID:</strong> DE123456789</p>
              </div>
            </section>

            {/* Contact Information */}
            <section style={{ padding: '50px 40px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
                <p style={{ margin: '8px 0' }}><strong>Address:</strong><br />AdVenture GmbH<br />123 Digital Street<br />10115 Berlin<br />Germany</p>
                <p style={{ margin: '15px 0 8px 0' }}><strong>Email:</strong> <a href="mailto:info@adventure.io" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}>info@adventure.io</a></p>
                <p style={{ margin: '8px 0' }}><strong>Phone:</strong> <a href="tel:+491234567890" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}>+49 (123) 456-7890</a></p>
                <p style={{ margin: '8px 0' }}><strong>Website:</strong> <a href="https://www.adventure.io" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}>www.adventure.io</a></p>
              </div>
            </section>

            {/* Management */}
            <section style={{ padding: '50px 40px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
                <p style={{ margin: '8px 0' }}><strong>Managing Directors:</strong><br />John Smith<br />Jane Doe<br />Michael Johnson</p>
              </div>
            </section>

            {/* Responsible for Editorial */}
            <section style={{ padding: '50px 40px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
                <p style={{ margin: '8px 0' }}><strong>Content Manager:</strong> Sarah Williams<br /><strong>Email:</strong> <a href="mailto:content@adventure.io" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}>content@adventure.io</a></p>
              </div>
            </section>

            {/* Technical Information */}
            <section style={{ padding: '50px 40px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
                <p style={{ margin: '8px 0' }}><strong>Technical Support Email:</strong> <a href="mailto:support@adventure.io" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}>support@adventure.io</a></p>
                <p style={{ margin: '8px 0' }}><strong>Website Hosting:</strong> Cloud Infrastructure Partners</p>
              </div>
            </section>

            {/* Legal Information */}
            <section style={{ padding: '50px 40px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
                <p style={{ margin: '8px 0' }}>
                  <strong>Disclaimer:</strong> The content of this website is provided "as is" without warranty of any kind. 
                  AdVenture GmbH makes no representations or warranties regarding the accuracy, completeness, or timeliness of the content.
                </p>
                <p style={{ marginTop: '12px', margin: '12px 0' }}>
                  <strong>Liability:</strong> AdVenture GmbH shall not be liable for any damages resulting from the use of this website 
                  or the information contained herein, including but not limited to direct, indirect, incidental, consequential, 
                  and punitive damages.
                </p>
                <p style={{ margin: '12px 0' }}>
                  <strong>External Links:</strong> This website may contain links to external websites. AdVenture GmbH is not responsible 
                  for the content, accuracy, or practices of these external sites.
                </p>
              </div>
            </section>

            {/* Data Protection */}
            <section style={{ padding: '50px 40px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
                <p style={{ margin: '8px 0' }}>
                  For information regarding data protection and how we handle your personal data, please refer to our 
                  <a href="#" style={{ color: '#667eea', textDecoration: 'none', marginLeft: '5px', fontWeight: '500' }}>Privacy Policy</a>.
                </p>
                <p style={{ margin: '12px 0' }}>
                  <strong>Data Protection Officer:</strong> <a href="mailto:dpo@adventure.io" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}>dpo@adventure.io</a>
                </p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section style={{ padding: '50px 40px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
                <p style={{ margin: '8px 0' }}>
                  All content on this website, including text, graphics, logos, images, and software, is the property of AdVenture GmbH 
                  or its content suppliers and is protected by international copyright, trademark, and other intellectual property laws. 
                  Unauthorized reproduction or use is strictly prohibited.
                </p>
              </div>
            </section>
          </div>

          {/* Terms of Use - Full Width */}
          <section style={{ padding: '50px 40px', background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f3f8 100%)', borderRadius: '12px', borderLeft: '4px solid #667eea', marginBottom: '25px', minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '15px', color: '#667eea' }}>Terms of Use</h2>
            <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555' }}>
              <p style={{ margin: '8px 0' }}>
                By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
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
