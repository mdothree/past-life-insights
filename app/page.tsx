'use client';

import { useEffect, useRef, useState } from 'react';
// Synced from projects/divination/shared/pricing.json by sync-pricing.mjs; the
// API charges from the same slice (JARVIS #63), so shown price == charged price.
import pricing from './lib/pricing.json';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastlives-api.vercel.app';

// Entitlements written by /success after Stripe verification — same localStorage
// contract as shared/ui-components/entitlement.js. Peek before the API call,
// consume only after a successful premium response so a failed call doesn't
// burn the credit.
const ENT_KEY = 'mdo3d_premium';

// The reading sold on this page.
const READING_TYPE = 'single-life';
function priceLabel(type: string): string {
  const entry = (pricing.types as Record<string, { amount_cents: number }>)[type];
  if (!entry) return '';
  const c = entry.amount_cents;
  return '$' + (c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2));
}
function entIndex(list: any[]): number {
  // Every reading is a one-shot credit (no monthly tier, JARVIS #63b).
  return list.findIndex((e: any) => !e.consumed);
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
    if (idx !== -1) {
      list[idx].consumed = true;
      localStorage.setItem(ENT_KEY, JSON.stringify(list));
    }
  } catch {}
}

// The model sometimes answers in Markdown. Render it as plain paragraphs via
// React text nodes (never innerHTML): drop headings and rules, strip
// emphasis asterisks/underscores, keep the words.
function toParagraphs(text: string): string[] {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map(block => block
      .split('\n')
      // horizontal rules and headings (the page already has its own heading)
      .filter(line => !/^\s*([-*_]\s*){3,}$/.test(line) && !/^\s{0,3}#{1,6}\s/.test(line))
      .map(line => line
        .replace(/^\s*>\s?/, '')
        .replace(/^\s*[-*+]\s+/, '')
        .replace(/(\*\*|__)(.+?)\1/g, '$2')
        .replace(/(^|[^*\w])[*_]([^*_\n]+)[*_](?![*\w])/g, '$1$2')
        .trim())
      .filter(Boolean)
      .join(' '))
    .filter(Boolean);
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
  // Paid from first use (JARVIS #94): set when there is no verified purchase
  // (or the API refused it), so the checkout prompt shows instead of a reading.
  const [needsPurchase, setNeedsPurchase] = useState(false);
  // The API refused the stored purchase this visit (kept in memory only, so a
  // transient verification error never burns a valid credit).
  const [entitlementRejected, setEntitlementRejected] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // The form is swapped for the results; bring the results into view so the
  // user doesn't land mid-page on the upsell.
  useEffect(() => {
    if (reading) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [reading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.birthDate) {
      setError('Please enter your birth date');
      return;
    }

    setError('');

    // No unpaid reading tier: without a verified purchase, offer checkout.
    if (!hasEntitlement() || entitlementRejected) {
      setNeedsPurchase(true);
      return;
    }
    setNeedsPurchase(false);
    setLoading(true);
    const premium = true;
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

      if (response.status === 402 || response.status === 403) {
        // The purchase on this device was used up or isn't valid here.
        setEntitlementRejected(true);
        setNeedsPurchase(true);
        return;
      }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic Stripe checkout — creates a session so /success gets a session_id to verify.
  const startCheckout = async () => {
    const email = window.prompt('Enter your email to receive your premium reading:');
    if (!email) return;
    try {
      const res = await fetch(`${API_URL}/api/payment/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readingType: READING_TYPE, email }),
      });
      const data = await res.json();
      if (data.success && data.checkoutUrl) window.location.href = data.checkoutUrl;
      else alert('Unable to process payment. Please try again.');
    } catch {
      alert('Payment error. Please try again.');
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Past Life Insights</h1>
        <p className="subtitle">Discover the echoes of your soul's journey</p>
      </header>

      <main id="main-content">
      {!reading ? (
        <form onSubmit={handleSubmit} className="reading-form">
          <div className="form-section">
            <h2>Birth Information</h2>

            <div className="form-group">
              <label htmlFor="pl-name">Your Name (Optional)</label>
              <input
                id="pl-name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pl-birthDate">Birth Date *</label>
                <input
                  id="pl-birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={e => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pl-birthTime">Birth Time (Optional)</label>
                <input
                  id="pl-birthTime"
                  type="time"
                  value={formData.birthTime}
                  onChange={e => setFormData(prev => ({ ...prev, birthTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pl-birthPlace">Birth Place (Optional)</label>
              <input
                id="pl-birthPlace"
                type="text"
                placeholder="City, Country"
                value={formData.birthPlace}
                onChange={e => setFormData(prev => ({ ...prev, birthPlace: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Soul Clues (Optional but helpful)</h2>
            <p className="section-hint">These details help reveal more specific past life connections</p>

            <div className="form-group">
              <label htmlFor="pl-currentChallenges">Current Life Challenges</label>
              <textarea
                id="pl-currentChallenges"
                placeholder="What patterns or challenges keep appearing in your life?"
                value={formData.currentChallenges}
                onChange={e => setFormData(prev => ({ ...prev, currentChallenges: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pl-interests">Strong Interests or Passions</label>
              <textarea
                id="pl-interests"
                placeholder="What topics, time periods, or cultures inexplicably draw you?"
                value={formData.interests}
                onChange={e => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pl-fears">Unexplained Fears or Phobias</label>
              <textarea
                id="pl-fears"
                placeholder="Any fears that don't have an origin in this life?"
                value={formData.fears}
                onChange={e => setFormData(prev => ({ ...prev, fears: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pl-talents">Natural Talents</label>
              <textarea
                id="pl-talents"
                placeholder="Skills that came easily to you without much training?"
                value={formData.talents}
                onChange={e => setFormData(prev => ({ ...prev, talents: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Your Question</h2>
            <div className="form-group">
              <textarea
                aria-label="Your question"
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
          {loading && (
            <p className="loading-note" role="status">Your reading is being written — this can take a few seconds.</p>
          )}

          {needsPurchase && (
            <div className="premium-cta" role="status">
              <h3>Unlock Your Past Life Reading</h3>
              <p>A detailed past life narrative with karmic patterns, healing guidance, and integration practices.</p>
              <button type="button" className="btn-premium" onClick={startCheckout}>
                Get Full Reading - {priceLabel(READING_TYPE)}
              </button>
            </div>
          )}
        </form>
      ) : (
        <div className="reading-results" ref={resultsRef}>
          <div className="result-header">
            <h2>Your Past Life Glimpse</h2>
          </div>

          {reading.glimpse && (
            <div className="result-section glimpse">
              <div className="glimpse-icon">👁️</div>
              {toParagraphs(reading.glimpse).map((para, i) => (
                <p key={i} className="glimpse-text">{para}</p>
              ))}
            </div>
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
              Get Full Reading - {priceLabel(READING_TYPE)}
            </button>
          </div>

          <button className="btn-secondary" onClick={resetForm}>
            Explore Another Life
          </button>
        </div>
      )}
      </main>

      <footer>
        <p>Part of the <a href="https://mdo3d.com">MDO3D Divination</a> suite</p>
        <p>For reflection and entertainment; not professional advice.</p>
      </footer>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem;
          font-family: system-ui, -apple-system, sans-serif;
          color: var(--text);
          background: var(--bg);
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
        .subtitle { color: var(--muted); }
        .reading-form {
          background: var(--surface);
          border-radius: 1rem;
          padding: 2rem;
        }
        .form-section {
          margin-bottom: 2rem;
        }
        .form-section h2 {
          font-size: 1.17em;
          margin-top: 1em;
          margin-bottom: 0.5rem;
          color: var(--accent);
        }
        .section-hint {
          color: var(--muted);
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
          color: var(--muted);
          font-size: 0.9rem;
        }
        input, textarea {
          box-sizing: border-box;
          width: 100%;
          padding: 0.75rem;
          background: var(--field);
          border: 1px solid var(--field-border);
          border-radius: 0.5rem;
          color: var(--text);
          font-size: 1rem;
          font-family: inherit;
          color-scheme: var(--scheme);
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: var(--accent);
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
        .loading-note {
          text-align: center;
          color: var(--muted);
          margin-top: 0.75rem;
        }
        .btn-secondary {
          width: 100%;
          padding: 1rem;
          background: var(--field);
          border: 1px solid var(--field-border);
          border-radius: 0.5rem;
          color: var(--text);
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
        }
        .error-message {
          background: var(--err-bg);
          color: var(--err-fg);
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }
        .reading-results {
          background: var(--surface);
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
          border-bottom: 1px solid var(--line);
        }
        .result-section h3 { color: var(--accent); margin-bottom: 1rem; }
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
          margin: 0 0 1rem;
        }
        .glimpse-text:last-child { margin-bottom: 0; }
        .upgrade-message {
          text-align: center;
          color: var(--muted);
          margin-top: 1rem;
        }
        .vision-details {
          background: var(--field);
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
          background: #7e22ce;
          color: #fff;
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
          border-bottom: 1px solid var(--line);
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
          color: var(--quote);
          border: 1px solid var(--accent);
          border-radius: 0.75rem;
          padding: 1rem;
          margin: 1rem 0;
        }
        .premium-cta {
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(99, 102, 241, 0.1));
          border: 1px solid var(--accent);
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
          color: #1a1a2e;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 1rem;
        }
        footer {
          text-align: center;
          padding: 2rem;
          color: var(--muted);
        }
        footer a { color: var(--accent); }
      `}</style>
    </div>
  );
}
