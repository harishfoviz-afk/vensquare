import type { Transaction, GoogleSheetsSettings } from '../types';

// Default mock transactions to populate if local storage is empty
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '2026-06-20-L-101-120-RAJ-BRT',
    date: '2026-06-20',
    bags: 120,
    rate: 850.50,
    agentName: 'Rajesh Kumar',
    lotNumber: 'L-101',
    mark: 'BRT',
    totalValue: 102060.00,
    timestamp: '2026-06-20T10:30:00.000Z'
  },
  {
    id: '2026-06-20-L-102-85-ANIL-RS',
    date: '2026-06-20',
    bags: 85,
    rate: 910.00,
    agentName: 'Anil Sharma',
    lotNumber: 'L-102',
    mark: 'RS',
    totalValue: 77350.00,
    timestamp: '2026-06-20T11:15:00.000Z'
  },
  {
    id: '2026-06-19-L-98-150-VIJA-TS',
    date: '2026-06-19',
    bags: 150,
    rate: 780.00,
    agentName: 'Vijay Singh',
    lotNumber: 'L-98',
    mark: 'TS',
    totalValue: 117000.00,
    timestamp: '2026-06-19T09:45:00.000Z'
  },
  {
    id: '2026-06-18-L-95-60-SURE-DV',
    date: '2026-06-18',
    bags: 60,
    rate: 950.00,
    agentName: 'Suresh Patel',
    lotNumber: 'L-95',
    mark: 'DV',
    totalValue: 57000.00,
    timestamp: '2026-06-18T14:20:00.000Z'
  },
  {
    id: '2026-06-18-L-96-200-AMIT-BVB',
    date: '2026-06-18',
    bags: 200,
    rate: 890.00,
    agentName: 'Amit Verma',
    lotNumber: 'L-96',
    mark: 'BVB',
    totalValue: 178000.00,
    timestamp: '2026-06-18T16:05:00.000Z'
  }
];

const SETTINGS_KEY = 'agrosync_settings';
const TRANSACTIONS_KEY = 'agrosync_local_transactions';
const OAUTH_TOKEN_KEY = 'agrosync_oauth_token';
const OAUTH_EXPIRE_KEY = 'agrosync_oauth_expire';

const DEFAULT_SETTINGS: GoogleSheetsSettings = {
  spreadsheetId: '',
  clientId: '',
  apiKey: '',
  useLiveSync: false
};

// Global OAuth token cache to prevent React state reload issues
let cachedToken: string | null = null;

export const GoogleSheetsService = {
  // Settings Management
  getSettings(): GoogleSheetsSettings {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      // Check environment variables as defaults if available
      const envSettings: GoogleSheetsSettings = {
        spreadsheetId: (import.meta.env.VITE_GOOGLE_SHEET_ID as string) || '',
        clientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '',
        apiKey: (import.meta.env.VITE_GOOGLE_API_KEY as string) || '',
        useLiveSync: false
      };
      if (envSettings.spreadsheetId && envSettings.clientId) {
        envSettings.useLiveSync = true;
        this.saveSettings(envSettings);
        return envSettings;
      }
      return DEFAULT_SETTINGS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: GoogleSheetsSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (!settings.useLiveSync) {
      this.clearToken();
    }
  },

  // Token Management
  saveToken(token: string, expiresInSeconds: number): void {
    cachedToken = token;
    localStorage.setItem(OAUTH_TOKEN_KEY, token);
    const expireTime = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(OAUTH_EXPIRE_KEY, expireTime.toString());
  },

  getToken(): string | null {
    if (cachedToken) return cachedToken;
    
    const token = localStorage.getItem(OAUTH_TOKEN_KEY);
    const expireTime = localStorage.getItem(OAUTH_EXPIRE_KEY);
    
    if (token && expireTime) {
      if (Date.now() < parseInt(expireTime, 10)) {
        cachedToken = token;
        return token;
      }
    }
    this.clearToken();
    return null;
  },

  clearToken(): void {
    cachedToken = null;
    localStorage.removeItem(OAUTH_TOKEN_KEY);
    localStorage.removeItem(OAUTH_EXPIRE_KEY);
  },

  // OAuth Login Flow
  loginGoogle(): Promise<string> {
    return new Promise((resolve, reject) => {
      const settings = this.getSettings();
      if (!settings.clientId) {
        reject(new Error('Google Client ID is not configured. Please open settings.'));
        return;
      }

      if (typeof (window as any).google === 'undefined' || !(window as any).google.accounts) {
        reject(new Error('Google Identity Services SDK not loaded yet. Check internet connection.'));
        return;
      }

      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: settings.clientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets',
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(`OAuth Error: ${response.error_description || response.error}`));
              return;
            }
            if (response.access_token) {
              this.saveToken(response.access_token, response.expires_in || 3600);
              resolve(response.access_token);
            } else {
              reject(new Error('OAuth failed: No access token returned.'));
            }
          },
        });
        
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        reject(new Error(`Failed to initialize Google Login: ${err.message}`));
      }
    });
  },

  // Generate Unique Transaction ID
  generateTransactionId(data: Omit<Transaction, 'id' | 'totalValue' | 'timestamp'>): string {
    const formattedDate = data.date; // YYYY-MM-DD
    const lot = data.lotNumber.trim().replace(/\s+/g, '-').toUpperCase();
    const bags = data.bags;
    
    // Short Agent Name: First word, stripped of symbols, max 4 letters uppercase
    const cleanAgent = data.agentName.trim().replace(/[^a-zA-Z0-9\s]/g, '');
    const firstWord = cleanAgent.split(/\s+/)[0] || 'AGT';
    const shortAgent = firstWord.slice(0, 4).toUpperCase();
    
    const mark = data.mark;
    
    return `${formattedDate}-${lot}-${bags}-${shortAgent}-${mark}`;
  },

  // Fetch Transactions (Google Sheets or Local Storage fallback)
  async fetchTransactions(): Promise<Transaction[]> {
    const settings = this.getSettings();

    // If using LocalStorage Mock Mode
    if (!settings.useLiveSync || !settings.spreadsheetId) {
      return this.fetchLocalTransactions();
    }

    // Attempt Google Sheets Fetch
    let token = this.getToken();
    if (!token) {
      // Must authenticate
      try {
        token = await this.loginGoogle();
      } catch (err: any) {
        console.warn('Google Auth failed, falling back to Local Storage:', err.message);
        throw new Error(`Authentication required for live sync: ${err.message}`);
      }
    }

    try {
      const range = 'Sheet1!A2:I';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${settings.spreadsheetId}/values/${encodeURIComponent(range)}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear it and try once more
          this.clearToken();
          return this.fetchTransactions();
        }
        const errText = await response.text();
        throw new Error(`Sheets API responded with error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const rows = data.values || [];
      
      const parsedTransactions: Transaction[] = rows.map((row: any[]) => {
        return {
          id: row[0] || '',
          date: row[1] || '',
          lotNumber: row[2] || '',
          bags: parseInt(row[3], 10) || 0,
          rate: parseFloat(row[4]) || 0,
          totalValue: parseFloat(row[5]) || 0,
          agentName: row[6] || '',
          mark: (row[7] || 'BRT') as any,
          timestamp: row[8] || new Date().toISOString()
        };
      });

      // Filter out invalid rows (e.g. headers if they leaked, or empty rows)
      return parsedTransactions.filter(t => t.id && t.date && t.bags > 0);
    } catch (err: any) {
      console.error('Failed to fetch from Google Sheets:', err);
      throw err;
    }
  },

  // Append a Transaction
  async addTransaction(transaction: Transaction): Promise<void> {
    const settings = this.getSettings();

    // Local Storage Mock mode append
    if (!settings.useLiveSync || !settings.spreadsheetId) {
      const local = this.fetchLocalTransactions();
      const updated = [transaction, ...local];
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
      return;
    }

    // Google Sheets sync append
    let token = this.getToken();
    if (!token) {
      token = await this.loginGoogle();
    }

    try {
      // First let's check if the sheet headers are configured
      // We do a quick append. The API append will automatically put it at the bottom.
      const range = 'Sheet1!A:I';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${settings.spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
      
      const rowValues = [
        transaction.id,
        transaction.date,
        transaction.lotNumber,
        transaction.bags,
        transaction.rate,
        transaction.totalValue,
        transaction.agentName,
        transaction.mark,
        transaction.timestamp
      ];

      // To handle the case where sheet is completely blank, we check if Sheet1 is empty first.
      // If we get an error or if sheet has no rows, we write headers.
      // However, typical setup has headers. Let's do a safe append.
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [rowValues]
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          return this.addTransaction(transaction);
        }
        const errText = await response.text();
        throw new Error(`Sheets API append failed (${response.status}): ${errText}`);
      }
    } catch (err: any) {
      console.error('Failed to append to Google Sheets:', err);
      throw err;
    }
  },

  // Initialize sheet headers if spreadsheet is blank
  async initializeSheetHeaders(): Promise<void> {
    const settings = this.getSettings();
    if (!settings.useLiveSync || !settings.spreadsheetId) return;

    let token = this.getToken();
    if (!token) {
      token = await this.loginGoogle();
    }

    try {
      // Check if sheet has content by reading A1:I1
      const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${settings.spreadsheetId}/values/Sheet1!A1:I1`;
      const checkResponse = await fetch(checkUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (checkResponse.ok) {
        const data = await checkResponse.json();
        if (data.values && data.values.length > 0) {
          // Headers already exist, don't overwrite
          return;
        }
      }

      // If headers don't exist, update A1:I1
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${settings.spreadsheetId}/values/Sheet1!A1:I1?valueInputOption=USER_ENTERED`;
      const headers = [
        'Transaction ID',
        'Date',
        'Lot Number',
        'Number of Bags',
        'Rate per Bag',
        'Total Value',
        'Agent Name',
        'Mark',
        'Timestamp'
      ];

      await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [headers]
        })
      });
    } catch (err) {
      console.warn('Failed to initialize headers, sheet might not be empty:', err);
    }
  },

  // Helper: Read local storage transactions
  fetchLocalTransactions(): Transaction[] {
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    if (!stored) {
      // Save default mock transactions
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(MOCK_TRANSACTIONS));
      return MOCK_TRANSACTIONS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return MOCK_TRANSACTIONS;
    }
  },

  // Helper: Clear local transactions
  resetLocalTransactions(): void {
    localStorage.removeItem(TRANSACTIONS_KEY);
  }
};
