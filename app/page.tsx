import PayButton from './components/PayButton';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Past Life Insights</h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        Discover your past lives through regression
      </p>

      <section style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h2>Free Preview</h2>
        <p>Enter your birth date for a glimpse:</p>
        <input 
          type="date" 
          style={{ 
            padding: '10px', 
            width: '100%', 
            maxWidth: '300px',
            marginTop: '0.5rem' 
          }}
        />
        <button style={{
          display: 'block',
          marginTop: '1rem',
          padding: '10px 20px',
          backgroundColor: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Get Free Preview
        </button>
      </section>

      <section style={{ marginTop: '2rem', padding: '1.5rem', border: '2px solid #635bff', borderRadius: '8px' }}>
        <h2>Full Past Life Reading</h2>
        <ul>
          <li>Complete past life narrative</li>
          <li>Key life lessons</li>
          <li>Patterns in current life</li>
          <li>Soul purpose insights</li>
          <li>PDF report delivered to your email</li>
        </ul>
        <PayButton 
          priceId="price_pastlife_full" 
          label="Get Full Reading - $24.99"
        />
      </section>

      <p style={{ color: '#666', marginTop: '3rem', fontSize: '0.9rem' }}>
        Deployed via Project HACK
      </p>
    </main>
  );
}
