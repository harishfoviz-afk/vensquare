import React, { useState } from 'react';
import type { GoogleSheetsSettings } from '../types';
import { GoogleSheetsService } from '../services/googleSheets';
import { X, Save, AlertCircle, HelpCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: GoogleSheetsSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const currentSettings = GoogleSheetsService.getSettings();

  // Settings State
  const [spreadsheetId, setSpreadsheetId] = useState(currentSettings.spreadsheetId);
  const [clientId, setClientId] = useState(currentSettings.clientId);
  const [useLiveSync, setUseLiveSync] = useState(currentSettings.useLiveSync);
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (useLiveSync) {
      if (!spreadsheetId.trim()) {
        setError('Spreadsheet ID is required for live synchronization.');
        return;
      }
      if (!clientId.trim()) {
        setError('Google Client ID is required for client-side OAuth2.');
        return;
      }
    }

    const updated: GoogleSheetsSettings = {
      spreadsheetId: spreadsheetId.trim(),
      clientId: clientId.trim(),
      apiKey: '',
      useLiveSync,
    };

    GoogleSheetsService.saveSettings(updated);
    onSave(updated);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} role="dialog" aria-modal="true">
      <div className="modal-window" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3>Integration Settings</h3>
          <button className="btn-icon-only" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            {error && (
              <div 
                style={{
                  backgroundColor: 'var(--danger-light)',
                  color: 'var(--danger)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid #fca5a5'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  userSelect: 'none',
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: 'var(--text-main)'
                }}
              >
                <input
                  type="checkbox"
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: 'var(--primary-accent)',
                    cursor: 'pointer'
                  }}
                  checked={useLiveSync}
                  onChange={(e) => setUseLiveSync(e.target.checked)}
                />
                Enable Google Sheet Live Sync
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '26px' }}>
                Toggle off to run in local **Demo Mode** (offline mock database).
              </span>
            </div>

            {useLiveSync && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label htmlFor="sheet-id-input">Google Spreadsheet ID</label>
                  <input
                    id="sheet-id-input"
                    type="text"
                    placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
                    className="form-control"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    required={useLiveSync}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                    Extracted from your spreadsheet's URL: `/d/SPREADSHEET_ID/edit`
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="client-id-input">Google OAuth Client ID</label>
                  <input
                    id="client-id-input"
                    type="text"
                    placeholder="e.g. xxxxxxxx.apps.googleusercontent.com"
                    className="form-control"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required={useLiveSync}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                    Generated in Google Cloud Console Credentials.
                  </span>
                </div>
                
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ 
                    alignSelf: 'flex-start', 
                    fontSize: '0.75rem', 
                    padding: '4px 10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    borderStyle: 'dashed' 
                  }}
                  onClick={() => setShowGuide(!showGuide)}
                >
                  <HelpCircle size={14} /> {showGuide ? 'Hide Setup Guide' : 'Show Setup Guide'}
                </button>

                {showGuide && (
                  <div className="settings-instructions">
                    <h4>How to configure Live Sheets Integration:</h4>
                    <ol>
                      <li>Create a Google Sheet and verify its first worksheet tab is named `Sheet1`.</li>
                      <li>In Google Sheet columns, name the first row headers exactly like so:
                        <br/>
                        <code style={{ fontSize: '0.65rem', color: 'var(--primary)', wordBreak: 'break-all' }}>
                          Transaction ID, Date, Lot Number, Number of Bags, Rate per Bag, Total Value, Agent Name, Mark, Timestamp
                        </code>
                      </li>
                      <li>Go to **Google Cloud Console**, create a project, and enable the **Google Sheets API**.</li>
                      <li>Configure **OAuth Consent Screen** (Internal or External).</li>
                      <li>Go to **Credentials** &rarr; **Create Credentials** &rarr; **OAuth Client ID**.</li>
                      <li>Select Application type: **Web Application**. Add your server URL (e.g. `http://localhost:5173` or your web URL) to **Authorized JavaScript origins**.</li>
                      <li>Copy the generated **Client ID** and **Spreadsheet ID** above and click **Save Settings**.</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
              <Save size={16} /> Save & Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
