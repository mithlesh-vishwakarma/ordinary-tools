import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { CopyIcon, CheckIcon, SparklesIcon } from '../components/Icons';

interface PasswordSuggestion {
  id: string;
  password: string;
  style: string;
  strength: string;
}

export default function PasswordGenerator() {
  const [contentInput, setContentInput] = useState('');
  const [suggestions, setSuggestions] = useState<PasswordSuggestion[]>([]);
  const [selectedPassword, setSelectedPassword] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Helper to generate random characters
  const getRandomChars = (chars: string, len: number): string => {
    let result = '';
    const array = new Uint32Array(len);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < len; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  };

  const toLeet = (text: string): string => {
    const map: Record<string, string> = {
      a: '@', A: '4', e: '3', E: '3', i: '1', I: '!', o: '0', O: '0', s: '$', S: '5', t: '7', T: '7'
    };
    return text.split('').map(char => map[char] || char).join('');
  };

  const generateSuggestions = () => {
    const rawWords = contentInput.trim()
      ? contentInput.trim().split(/[\s,._-]+/).filter(Boolean)
      : ['Nova', 'Swift'];

    // Cleaned words
    const baseWord = rawWords[0] || 'Swift';
    const capBase = baseWord.charAt(0).toUpperCase() + baseWord.slice(1);
    const secondWord = rawWords[1] ? (rawWords[1].charAt(0).toUpperCase() + rawWords[1].slice(1)) : 'Vault';

    const symbols = '!@#$%^&*+=~';
    const digits = '0123456789';
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';

    const newSuggestions: PasswordSuggestion[] = [
      // 1. Leetspeak + Secure Salt
      {
        id: 'leet-salt',
        style: 'Leet & Salted',
        strength: 'Very Strong',
        password: `${toLeet(capBase)}${getRandomChars(symbols, 1)}${getRandomChars(digits, 3)}${getRandomChars(symbols, 1)}${getRandomChars(upper, 2)}${getRandomChars(lower, 2)}`
      },
      // 2. Passphrase Style with Separators
      {
        id: 'passphrase',
        style: 'Smart Passphrase',
        strength: 'Strong',
        password: `${capBase}${getRandomChars('_-@#', 1)}${secondWord}${getRandomChars(digits, 4)}${getRandomChars(symbols, 2)}`
      },
      // 3. Enclosed Shield (Prefix + Keyword + Suffix)
      {
        id: 'enclosed',
        style: 'Enclosed Shield',
        strength: 'Very Strong',
        password: `${getRandomChars(symbols, 1)}${getRandomChars(digits, 2)}${getRandomChars(upper, 1)}#${capBase}${secondWord}${getRandomChars(symbols, 1)}${getRandomChars(digits, 2)}`
      },
      // 4. Compact Mixed Entropy
      {
        id: 'compact',
        style: 'High Entropy Mix',
        strength: 'Very Strong',
        password: `${capBase.toLowerCase()}${getRandomChars(symbols, 1)}${capBase.toUpperCase()}${getRandomChars(digits, 3)}${getRandomChars(symbols, 1)}${getRandomChars(upper, 1)}${getRandomChars(lower, 2)}`
      }
    ];

    setSuggestions(newSuggestions);
    setSelectedPassword(newSuggestions[0].password);
    setCopiedId(null);
  };

  const handleSelectAndCopy = (item: PasswordSuggestion) => {
    setSelectedPassword(item.password);
    navigator.clipboard.writeText(item.password);
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="password-gen-page animate-fade-in-up">
      <Header tagline="PASSWORD GENERATOR" />

      <div className="container">
        {/* Navigation Breadcrumb */}
        <div className="hub-breadcrumbs">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to="/tools" className="breadcrumb-link">Tools</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Password Generator</span>
        </div>

        <div className="header__hero">
          <h1 className="header__title">Password Generator</h1>
          <p className="header__subtitle">
            Enter words or topics you like, and we'll generate strong, memorable passwords for you to choose from.
          </p>
        </div>

        <div className="password-simple-card glass-card">
          {/* Content Prompt Input */}
          <div className="password-input-section">
            <label htmlFor="seed-content" className="password-label">
              Enter contents or keywords:
            </label>
            <div className="password-input-row">
              <input 
                id="seed-content"
                type="text" 
                value={contentInput}
                onChange={(e) => setContentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') generateSuggestions();
                }}
                placeholder="e.g. coffee, space, summer, crypto..."
                className="password-text-input"
              />
              <button 
                onClick={generateSuggestions} 
                className="btn btn--primary password-generate-btn"
              >
                <SparklesIcon />
                <span>Generate Passwords</span>
              </button>
            </div>
          </div>

          {/* Suggested Passwords List */}
          {suggestions.length > 0 && (
            <div className="password-suggestions-box">
              <div className="suggestions-header">
                <span className="suggestions-title">Select a password below:</span>
                <span className="suggestions-hint">Click any password to select & copy</span>
              </div>

              <div className="suggestions-list">
                {suggestions.map((item) => {
                  const isSelected = selectedPassword === item.password;
                  const isCopied = copiedId === item.id;

                  return (
                    <div 
                      key={item.id} 
                      className={`suggestion-item glass-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectAndCopy(item)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="suggestion-radio">
                        <div className={`radio-dot ${isSelected ? 'active' : ''}`}></div>
                      </div>

                      <div className="suggestion-content">
                        <div className="suggestion-password">{item.password}</div>
                        <div className="suggestion-meta">
                          <span className="meta-style">{item.style}</span>
                          <span className="meta-badge">{item.strength}</span>
                        </div>
                      </div>

                      <button 
                        className={`btn btn--small ${isCopied ? 'btn--success' : 'btn--ghost'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndCopy(item);
                        }}
                      >
                        {isCopied ? <CheckIcon /> : <CopyIcon />}
                        <span>{isCopied ? 'Copied!' : 'Select & Copy'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {suggestions.length === 0 && (
            <div className="password-empty-state">
              <p>Type your keywords above and click <strong>"Generate Passwords"</strong> to see suggested options.</p>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '20px' }}>
          <Link to="/tools" className="btn btn--secondary">
            ← Back to Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
