import { useState, useEffect } from 'react';
import type { Transaction, GoogleSheetsSettings } from './types';
import { GoogleSheetsService } from './services/googleSheets';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { ReviewModal } from './components/ReviewModal';
import { SettingsModal } from './components/SettingsModal';
import { TransactionList } from './components/TransactionList';
import { 
  Plus, 
  Settings, 
  Search, 
  RefreshCw, 
  Database,
  CloudLightning,
  AlertCircle
} from 'lucide-react';

function App() {
  // Application Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<GoogleSheetsSettings>({
    spreadsheetId: '',
    clientId: '',
    apiKey: '',
    useLiveSync: false
  });
  
  // Loading & UI Sync States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMark, setFilterMark] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');

  // Modals & Panels Control
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [stagedData, setStagedData] = useState<Omit<Transaction, 'id' | 'totalValue' | 'timestamp'> | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Success Notification banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load Settings and Data on mount
  useEffect(() => {
    const loadedSettings = GoogleSheetsService.getSettings();
    setSettings(loadedSettings);
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await GoogleSheetsService.fetchTransactions();
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load ledger data. Please check settings.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth manual re-login trigger
  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await GoogleSheetsService.loginGoogle();
      const data = await GoogleSheetsService.fetchTransactions();
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Callback when settings are saved in SettingsModal
  const handleSettingsSave = (newSettings: GoogleSheetsSettings) => {
    setSettings(newSettings);
    setError(null);
    setIsLoading(true);
    
    // Attempt sheets setup check if live sync is on
    if (newSettings.useLiveSync && newSettings.spreadsheetId) {
      GoogleSheetsService.initializeSheetHeaders().catch(console.warn);
    }
    
    // Refresh ledger data
    setTimeout(() => {
      loadData();
    }, 300);
  };

  // Callback when Form submits (Stages the data for review)
  const handleFormSubmitStaged = (data: Omit<Transaction, 'id' | 'totalValue' | 'timestamp'>) => {
    setStagedData(data);
    setIsReviewOpen(true);
  };

  // Callback when Review is confirmed (Writes to Google Sheets / LocalStorage)
  const handleConfirmLedger = async (finalTransaction: Transaction) => {
    setIsSubmitting(true);
    try {
      await GoogleSheetsService.addTransaction(finalTransaction);
      
      // Close all modals
      setIsReviewOpen(false);
      setIsFormOpen(false);
      setStagedData(null);
      
      // Trigger Success Toast
      showToast(`Ledged successfully! ID: ${finalTransaction.id.slice(-15)}`);
      
      // Reload spreadsheet/local storage data
      loadData();
    } catch (err: any) {
      alert(`Ledger operation failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Global live filters logic applied on client-side array
  const filteredTransactions = transactions.filter((t) => {
    // 1. Search Query filter (matches Agent Name, Lot Number, or Transaction ID)
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      t.agentName.toLowerCase().includes(query) ||
      t.lotNumber.toLowerCase().includes(query) ||
      t.id.toLowerCase().includes(query);

    // 2. Mark filter
    const matchesMark = filterMark === 'ALL' || t.mark === filterMark;

    // 3. Date filter
    const matchesDate = !filterDate || t.date === filterDate;

    return matchesSearch && matchesMark && matchesDate;
  });

  return (
    <div className="app-container">
      
      {/* Dynamic Toast Success Banner */}
      {toastMessage && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#065f46',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: 'var(--radius-full)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            fontSize: '0.85rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px', borderRadius: '50%' }}>✓</span>
          {toastMessage}
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="header">
        <div className="logo-section">
          <div className="logo-icon">
            <CloudLightning size={24} style={{ fill: 'currentColor' }} />
          </div>
          <h1>Agro<span>Sync</span></h1>
          
          {/* Status Indicators */}
          {settings.useLiveSync && settings.spreadsheetId ? (
            <span className="status-indicator status-live" title="Live sync to Google Sheets active">
              <Database size={10} /> Live
            </span>
          ) : (
            <span className="status-indicator status-demo" title="Mock Database stored in Local Browser">
              <Database size={10} /> Demo Mode
            </span>
          )}
        </div>

        <div className="header-actions">
          <button 
            type="button" 
            className="btn-icon-only" 
            title="Refresh database"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'spinner' : ''} style={{ animationDuration: '2s' }} />
          </button>
          
          <button 
            type="button" 
            className="btn-icon-only" 
            title="Configure integration"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={18} />
          </button>

          <button 
            type="button" 
            className="btn btn-primary"
            style={{ display: 'none' }} /* Desktop handles this or shown as flex in medium min-width */
            onClick={() => setIsFormOpen(true)}
          >
            <Plus size={16} /> New Transaction
          </button>
          
          <button 
            type="button" 
            className="btn btn-primary"
            style={{ display: 'inline-flex' }}
            onClick={() => setIsFormOpen(true)}
          >
            <Plus size={16} /> <span style={{ display: 'inline' }}>Add Row</span>
          </button>
        </div>
      </header>

      {/* DASHBOARD REAL-TIME METRICS */}
      <Dashboard transactions={filteredTransactions} />

      {/* TOOLBAR FOR SEARCH & FILTERS */}
      <section className="toolbar" aria-label="Search and filter controls">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search Agent, Lot Number, or ID..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-row">
          <select
            className="select-input"
            value={filterMark}
            onChange={(e) => setFilterMark(e.target.value)}
            aria-label="Filter by Mark"
          >
            <option value="ALL">All Marks (BRT, RS...)</option>
            <option value="BRT">BRT Only</option>
            <option value="RS">RS Only</option>
            <option value="TS">TS Only</option>
            <option value="DV">DV Only</option>
            <option value="BVB">BVB Only</option>
          </select>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="date"
              className="date-input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              aria-label="Filter by specific date"
            />
            {filterDate && (
              <button 
                type="button" 
                onClick={() => setFilterDate('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-light)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* MAIN TECHNICAL GRID AND COMPACT CARDS LIST */}
      <main style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {settings.useLiveSync && !GoogleSheetsService.getToken() && settings.clientId && (
          <div 
            style={{ 
              backgroundColor: '#fffbeb', 
              border: '1px solid #fef3c7', 
              padding: '12px 16px', 
              borderRadius: 'var(--radius-lg)', 
              marginTop: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.85rem', color: '#92400e' }}>
              <AlertCircle size={16} />
              <span>Google Sheet Live Sync - Auth Required</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#78350f' }}>
              You are configured for Live Sync, but not currently authorized with Google Drive. Click below to sign in.
            </p>
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={handleGoogleLogin}
              style={{ alignSelf: 'flex-start', fontSize: '0.75rem', padding: '4px 10px', borderColor: '#fde68a', backgroundColor: '#fffbeb' }}
            >
              Authorize Sheets Connection
            </button>
          </div>
        )}

        <TransactionList 
          transactions={filteredTransactions} 
          isLoading={isLoading} 
          error={error} 
          useLiveSync={settings.useLiveSync}
          onGoogleLogin={handleGoogleLogin}
        />
      </main>

      {/* MOBILE FLOATING ACTION BUTTON (FAB) FOR ENTRY */}
      <div className="mobile-fab-container">
        <button 
          className="btn btn-primary mobile-fab"
          onClick={() => setIsFormOpen(true)}
          aria-label="Create New Entry"
        >
          <Plus size={18} /> New Ledger Row
        </button>
      </div>

      {/* BOTTOM SHEET SLIDE-OVER FORM */}
      <TransactionForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        onSubmitStaged={handleFormSubmitStaged}
      />

      {/* MANDATORY REVIEW STEP MODAL */}
      <ReviewModal 
        isOpen={isReviewOpen} 
        stagedData={stagedData} 
        onCancel={() => setIsReviewOpen(false)}
        onConfirm={handleConfirmLedger}
        isSubmitting={isSubmitting}
      />

      {/* INTEGRATIONS & SETTINGS MODAL */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSettingsSave}
      />

    </div>
  );
}

export default App;
