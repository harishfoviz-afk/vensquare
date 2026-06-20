export type MarkType = 'BRT' | 'RS' | 'TS' | 'DV' | 'BVB';

export interface Transaction {
  id: string; // Auto-generated: [Date]-[Lot]-[Bags]-[ShortAgentName]-[Mark]
  date: string; // YYYY-MM-DD
  bags: number; // Integer
  rate: number; // Decimal (Rate per Bag)
  agentName: string;
  lotNumber: string;
  mark: MarkType;
  totalValue: number; // Computed: bags * rate
  timestamp: string; // ISO String when created/synced
}

export interface GoogleSheetsSettings {
  spreadsheetId: string;
  clientId: string;
  apiKey: string;
  useLiveSync: boolean;
}

export interface FilterState {
  searchQuery: string;
  mark: string; // 'ALL' or MarkType
  date: string; // 'ALL' or YYYY-MM-DD
}
