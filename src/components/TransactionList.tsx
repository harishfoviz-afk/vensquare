import React from 'react';
import type { Transaction } from '../types';
import { Calendar, User, ShoppingBag, Key } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  useLiveSync: boolean;
  onGoogleLogin: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isLoading,
  error,
  useLiveSync,
  onGoogleLogin
}) => {
  // Format Currency
  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format Date from YYYY-MM-DD to readable DD MMM YYYY
  const formatDateReadable = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p style={{ fontWeight: '500', fontSize: '0.9rem' }}>Synchronizing with database...</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '2px' }}>
          Fetching latest entries
        </p>
      </div>
    );
  }

  // Error state - especially for Google Sheets OAuth expiration or config issues
  if (error) {
    return (
      <div className="empty-container" style={{ border: '1px solid #fecdd3', backgroundColor: '#fff5f5' }}>
        <p style={{ color: 'var(--danger)', fontWeight: '700', fontSize: '0.95rem' }}>Connection Error</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '380px' }}>
          {error}
        </p>
        {useLiveSync && (
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={onGoogleLogin}
            style={{ marginTop: '14px', fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Key size={14} /> Re-authenticate Google Sheet
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <div className="empty-container">
        <ShoppingBag size={24} style={{ marginBottom: '8px', color: 'var(--text-light)' }} />
        <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>No Ledger Entries Found</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '2px', maxWidth: '280px' }}>
          Try resetting your filters or search terms, or create a new entry below.
        </p>
      </div>
    );
  }

  return (
    <div className="list-container">
      <div className="list-header-row">
        <span className="list-title">Ledger Entries</span>
        <span className="list-count">{transactions.length} items</span>
      </div>

      {/* 1. MOBILE VIEW (Compact Stacked Cards) */}
      <div className="transaction-cards-list">
        {transactions.map((t) => (
          <div key={t.id} className="transaction-card">
            
            {/* Top row: ID and Mark Badge */}
            <div className="card-top">
              <span className="card-id-badge">{t.id}</span>
              <span className={`card-mark-badge mark-${t.mark}`}>{t.mark}</span>
            </div>

            {/* Middle row: Agent Name & Lot, Gross Total & Breakdown */}
            <div className="card-middle">
              <div className="card-agent-lot">
                <span className="card-agent">{t.agentName}</span>
                <span className="card-lot">Lot No: {t.lotNumber}</span>
              </div>
              <div className="card-value-display">
                <div className="card-total">{formatINR(t.totalValue)}</div>
                <div className="card-breakdown">
                  {t.bags} bags @ {formatINR(t.rate)}
                </div>
              </div>
            </div>

            {/* Bottom row: Date & sync status icon */}
            <div className="card-bottom">
              <div className="card-date">
                <Calendar size={12} />
                <span>{formatDateReadable(t.date)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} />
                <span>{t.agentName.trim().split(' ')[0]}</span>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* 2. DESKTOP VIEW (High-Density sticky-header Technical Data Grid) */}
      <div className="desktop-grid-wrapper">
        <table className="technical-grid">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Date</th>
              <th>Transaction ID</th>
              <th style={{ width: '90px' }}>Lot No.</th>
              <th style={{ width: '80px' }}>Mark</th>
              <th>Commission Agent</th>
              <th className="text-right" style={{ width: '90px' }}>Bags</th>
              <th className="text-right" style={{ width: '110px' }}>Rate / Bag</th>
              <th className="text-right" style={{ width: '140px' }}>Total Gross Value</th>
              <th style={{ width: '80px' }}>Sync</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td className="mono-cell">{t.date}</td>
                <td className="mono-cell" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {t.id}
                </td>
                <td className="mono-cell bold-cell">{t.lotNumber}</td>
                <td>
                  <span className={`card-mark-badge mark-${t.mark}`} style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                    {t.mark}
                  </span>
                </td>
                <td className="bold-cell">{t.agentName}</td>
                <td className="mono-cell text-right">{t.bags}</td>
                <td className="mono-cell text-right">{formatINR(t.rate)}</td>
                <td className="currency-cell">{formatINR(t.totalValue)}</td>
                <td style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                  {t.timestamp ? 'Synced' : 'Local'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
