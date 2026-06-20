import React from 'react';
import type { Transaction } from '../types';
import { GoogleSheetsService } from '../services/googleSheets';
import { Check, ArrowLeft, Info } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  stagedData: Omit<Transaction, 'id' | 'totalValue' | 'timestamp'> | null;
  onCancel: () => void;
  onConfirm: (transaction: Transaction) => void;
  isSubmitting: boolean;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  stagedData,
  onCancel,
  onConfirm,
  isSubmitting,
}) => {
  if (!isOpen || !stagedData) return null;

  // Calculate instant variables
  const totalValue = stagedData.bags * stagedData.rate;
  const transactionId = GoogleSheetsService.generateTransactionId(stagedData);

  // Format currency
  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleConfirm = () => {
    const finalTransaction: Transaction = {
      ...stagedData,
      id: transactionId,
      totalValue,
      timestamp: new Date().toISOString()
    };
    onConfirm(finalTransaction);
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} role="dialog" aria-modal="true">
      <div className="modal-window" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <h3>Confirm Ledger Entry</h3>
          <span 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px', 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              backgroundColor: '#d1fae5', 
              color: '#065f46', 
              padding: '2px 8px', 
              borderRadius: 'var(--radius-full)' 
            }}
          >
            Review Step
          </span>
        </div>

        <div className="modal-body">
          <div className="review-modal-content">
            
            {/* Gross Value Monospace Section */}
            <div className="gross-value-section">
              <span className="gross-label">Total Gross Value</span>
              <span className="gross-value-big">{formatINR(totalValue)}</span>
            </div>

            {/* Generated ID Badge */}
            <div className="generated-id-card">
              <div className="id-label">Generated Transaction ID</div>
              <div className="id-text-mono">{transactionId}</div>
            </div>

            {/* Technical Detail Rows */}
            <div className="review-card">
              <div className="review-row">
                <span className="review-label">Lot Number</span>
                <span className="review-val mono">{stagedData.lotNumber}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Mark</span>
                <span className="review-val">
                  <span className={`card-mark-badge mark-${stagedData.mark}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                    {stagedData.mark}
                  </span>
                </span>
              </div>
              <div className="review-row">
                <span className="review-label">Bags Quantity</span>
                <span className="review-val">{stagedData.bags} Bags</span>
              </div>
              <div className="review-row">
                <span className="review-label">Rate per Bag</span>
                <span className="review-val">{formatINR(stagedData.rate)}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Agent Name</span>
                <span className="review-val">{stagedData.agentName}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Ledger Date</span>
                <span className="review-val mono">{stagedData.date}</span>
              </div>
            </div>

            {/* Security Info Hint */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary-accent)' }} />
              <span>
                Confirming this action will write this transaction row immediately into the Google Sheet ledger. This action is irreversible.
              </span>
            </div>

          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
            disabled={isSubmitting}
            style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}
          >
            <ArrowLeft size={16} /> Edit Data
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleConfirm}
            disabled={isSubmitting}
            style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', minWidth: '150px' }}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', margin: 0 }} />
                Saving...
              </>
            ) : (
              <>
                <Check size={16} /> Confirm & Ledger
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
