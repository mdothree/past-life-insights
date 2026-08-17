'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastlives-api.vercel.app';

// Entitlements written by /success after Stripe verification — same localStorage
// contract as shared/ui-components/entitlement.js. Peek before the API call,
// consume only after a successful premium response so a failed call doesn't
// burn the credit.
const ENT_KEY = 'mdo3d_premium';
function entIndex(list: any[]): number {
  return list.findIndex((e: any) => !e.consumed &&
    (!/monthly/.test(e.readingType || '') || Date.now() - e.verifiedAt < 30 * 24 * 60 * 60 * 1000));
}
function hasEntitlement(): boolean {
  try { return entIndex(JSON.parse(localStorage.getItem(ENT_KEY) || '[]')) !== -1; }
  catch { return false; }
}
function activeSessionId(): string | null {
  try {
    const list = JSON.parse(localStorage.getItem(ENT_KEY) || '[]');
    const i = entIndex(list);
    return i === -1 ? null : (list[i].sessionId || null);
  } catch { return null; }
}
function consumeEntitlement(): void {
  try {
    const list = JSON.parse(localStorage.getItem(ENT_KEY) || '[]');
    const idx = entIndex(list);
    if (idx !== -1 && !/monthly/.test(list[idx].readingType || '')) {
      list[idx].consumed = true;
      localStorage.setItem(ENT_KEY, JSON.stringify(list));
    }
  } catch {}
}

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    currentChallenges: '',
    interests: '',
    fears: '',
    talents: '',
    question: ''
  });
  const [reading, setReading] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.birthDate) {
      setError('Please enter your birth date');
      return;
    }

    setLoading(true);
    setError('');

    const premium = hasEntitlement();
    try {
      const response = await fetch(`${API_URL}/api/reading/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthData: {
            name: formData.name,
            birthDate: formData.birthDate,
            birthTime: formData.birthTime || undefined,
            birthPlace: formData.birthPlace || undefined,
            currentChallenges: formData.currentChallenges || undefined,
            interests: formData.interests || undefined,
            fears: formData.fears || undefined,
            talents: formData.talents || undefined
          },
          question: formData.question,
          premium,
          sessionId: premium ? activeSessionId() : undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        if (premium) consumeEntitlement();
        setReading(data.reading);
      } else {
        setError(data.error || 'Failed to generate reading');
      }
    } catch (err) {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReading(null);
    setError('');
  };

  // Dynamic Stripe checkout — creates a session so /success gets a session_id to verify.
  const startCheckout = async () => {
    const email = window.prompt('Enter your email to receive your premium reading:');
    if (!email) return;
    try {
      const res = await fetch(`${API_URL}/api/payment/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readingType: 'single-life', email }),
      });
      const data = await res.json();
      if (data.success && data.checkoutUrl) window.location.href = data.checkoutUrl;
      else alert('Unable to process payment. Please try again.');
    } catch {
      alert('Payment error. Please try again.');
    }
  };

  return (
    <main className="container">
      <header>
        <h1>Past Life Insights</h1>
        <p className="subtitle">Discover the echoes of your soul's journey</p>
      </header>

      {!reading ? (
        <form onSubmit={handleSubmit} className="reading-form">
          <div className="form-section">
            <h3>Birth Information</h3>

            <div className="form-group">
              <label>Your Name (Optional)</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Birth Date *</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={e => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Birth Time (Optional)</label>
                <input
                  type="time"
                  value={formData.birthTime}
                  onChange={e => setFormData(prev => ({ ...prev, birthTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Birth Place (Optional)</label>
              <input
                type="text"
                placeholder="City, Country"
                value={formData.birthPlace}
                onChange={e => setFormData(prev => ({ ...prev, birthPlace: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Soul Clues (Optional but helpful)</h3>
            <p className="section-hint">These details help reveal more specific past life connections</p>

            <div className="form-group">
              <label>Current Life Challenges</label>
              <textarea
                placeholder="What patterns or challenges keep appearing in your life?"
                value={formData.currentChallenges}
                onChange={e => setFormData(prev => ({ ...prev, currentChallenges: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Strong Interests or Passions</label>
              <textarea
                placeholder="What topics, time periods, or cultures inexplicably draw you?"
                value={formData.interests}
                onChange={e => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Unexplained Fears or Phobias</label>
              <textarea
                placeholder="Any fears that don't have an origin in this life?"
                value={formData.fears}
                onChange={e => setFormData(prev => ({ ...prev, fears: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Natural Talents</label>
              <textarea
                placeholder="Skills that came easily to you without much training?"
                value={formData.talents}
                onChange={e => setFormData(prev => ({ ...prev, talents: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Your Question</h3>
            <div className="form-group">
              <textarea
                placeholder="What would you like to know about your past lives? (e.g., 'What past life is affecting my current relationships?')"
                value={formData.question}
                onChange={e => setFormData(prev => ({ ...prev, question: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Connecting to your soul...' : 'Reveal My Past Life'}
          </button>
        </form>
      ) : (
        <div className="reading-results">
          <div className="result-header">
            <h2>Your Past Life Glimpse</h2>
          </div>

          {reading.glimpse && (
            <div className="result-section glimpse">
              <div className="glimpse-icon">👁️</div>
              <p className="glimpse-text">{reading.glimpse}</p>
            </div>
          )}

          {reading.message && (
            <p className="upgrade-message">{reading.message}</p>
          )}

          {reading.pastLifeVision && (
            <>
              <div className="result-section">
                <h3>Past Life Vision</h3>
                <div className="vision-details">
                  <div className="vision-meta">
                    <span className="vision-tag">{reading.pastLifeVision.timePeriod}</span>
                    <span className="vision-tag">{reading.pastLifeVision.location}</span>
                    <span className="vision-tag">{reading.pastLifeVision.role}</span>
                  </div>
                  <p>{reading.pastLifeVision.narrative}</p>
                </div>
              </div>

              {reading.soulLessons && (
                <div className="result-section">
                  <h3>Soul Lessons</h3>
                  <p>{reading.soulLessons}</p>
                </div>
              )}

              {reading.giftsCarriedForward && reading.giftsCarriedForward.length > 0 && (
                <div className="result-section">
                  <h3>Gifts You Carry</h3>
                  <ul className="gifts-list">
                    {reading.giftsCarriedForward.map((gift: string, i: number) => (
                      <li key={i}>{gift}</li>
                    ))}
                  </ul>
                </div>
              )}

              {reading.soulMessage && (
                <div className="result-section soul-message">
                  <h3>Message from Your Past Self</h3>
                  <blockquote>"{reading.soulMessage}"</blockquote>
                </div>
              )}
            </>
          )}

          <div className="premium-cta">
            <h3>Unlock Your Full Soul Journey</h3>
            <p>Get a comprehensive past life reading with detailed narratives, karmic patterns, healing guidance, and integration practices.</p>
            <button
              className="btn-premium"
              onClick={startCheckout}
            >
              Get Full Reading - $5.99
            </button>
          </div>

          <button className="btn-secondary" onClick={resetForm}>
            Explore Another Life
          </button>
        </div>
      )}

      <footer>
        <p>Part of the <a href="https://mdo3d.com">MDO3D Divination</a> suite</p>
      </footer>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem;
          font-family: system-ui, -apple-system, sans-serif;
          color: #f1f5f9;
          background: #0f0f1a;
          min-height: 100vh;
        }
        header { text-align: center; margin-bottom: 2rem; }
        h1 {
          font-size: 2.5rem;
          background: linear-gradient(135deg, #a855f7, #6366f1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .subtitle { color: #94a3b8; }
        .reading-form {
          background: #1a1a2e;
          border-radius: 1rem;
          padding: 2rem;
        }
        .form-section {
          margin-bottom: 2rem;
        }
        .form-section h3 {
          margin-bottom: 0.5rem;
          color: #a855f7;
        }
        .section-hint {
          color: #64748b;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 600px) {
          .form-row { grid-template-columns: 1fr; }
        }
        .form-group {
          margin-bottom: 1rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #94a3b8;
          font-size: 0.9rem;
        }
        input, textarea {
          width: 100%;
          padding: 0.75rem;
          background: #252542;
          border: 1px solid transparent;
          border-radius: 0.5rem;
          color: #f1f5f9;
          font-size: 1rem;
          font-family: inherit;
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: #a855f7;
        }
        .btn-primary {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #a855f7, #6366f1);
          border: none;
          border-radius: 0.5rem;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-secondary {
          width: 100%;
          padding: 1rem;
          background: #252542;
          border: none;
          border-radius: 0.5rem;
          color: #f1f5f9;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
        }
        .error-message {
          background: #7f1d1d;
          color: #fecaca;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }
        .reading-results {
          background: #1a1a2e;
          border-radius: 1rem;
          padding: 2rem;
        }
        .result-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .result-section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #252542;
        }
        .result-section h3 { color: #a855f7; margin-bottom: 1rem; }
        .glimpse {
          text-align: center;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(99, 102, 241, 0.1));
          border-radius: 1rem;
        }
        .glimpse-icon { font-size: 3rem; margin-bottom: 1rem; }
        .glimpse-text {
          font-size: 1.1rem;
          line-height: 1.8;
          font-style: italic;
        }
        .upgrade-message {
          text-align: center;
          color: #94a3b8;
          margin-top: 1rem;
        }
        .vision-details {
          background: #252542;
          padding: 1.5rem;
          border-radius: 0.5rem;
        }
        .vision-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .vision-tag {
          background: #a855f7;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.85rem;
        }
        .gifts-list {
          list-style: none;
          padding: 0;
        }
        .gifts-list li {
          padding: 0.75rem 0;
          border-bottom: 1px solid #252542;
        }
        .gifts-list li:before {
          content: '✨ ';
        }
        .soul-message {
          text-align: center;
        }
        .soul-message blockquote {
          font-size: 1.2rem;
          font-style: italic;
          color: #c4b5fd;
          border-left: 4px solid #a855f7;
          padding-left: 1rem;
          margin: 1rem 0;
        }
        .premium-cta {
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(99, 102, 241, 0.1));
          border: 1px solid #a855f7;
          border-radius: 1rem;
          padding: 2rem;
          text-align: center;
          margin: 2rem 0;
        }
        .btn-premium {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border: none;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          color: white;
          font-weight: 600;
          cursor: pointer;
          margin-top: 1rem;
        }
        footer {
          text-align: center;
          padding: 2rem;
          color: #94a3b8;
        }
        footer a { color: #a855f7; }
      `}</style>
    </main>
  );
}
