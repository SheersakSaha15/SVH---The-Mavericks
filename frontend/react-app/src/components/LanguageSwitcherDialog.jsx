import React, { useState } from 'react';
import { useTranslation } from './LanguageProvider';

export default function LanguageSwitcherDialog() {
  const { lang, changeLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (selectedLang) => {
    changeLanguage(selectedLang);
    setIsOpen(false);
  };

  return (
    <>
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 12px', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}
        onClick={() => setIsOpen(true)}
      >
        <span>🌐</span>
        <span style={{ fontWeight: 500 }}>{lang}</span>
        <span>▼</span>
      </div>

      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '300px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>Select Language</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {["English", "Hindi", "Odia", "Bengali", "Telugu"].map((l) => (
                <button 
                  key={l}
                  onClick={() => handleSelect(l)}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: lang === l ? '#e0f2fe' : 'transparent',
                    color: lang === l ? '#0369a1' : '#333',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: lang === l ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ cursor: 'pointer', padding: '8px 16px', border: '1px solid #ddd', background: 'transparent', borderRadius: '6px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
