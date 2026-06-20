import React, { useState, useEffect } from 'react';
import type { MarkType, Transaction } from '../types';
import { X, Calculator } from 'lucide-react';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitStaged: (stagedData: Omit<Transaction, 'id' | 'totalValue' | 'timestamp'>) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSubmitStaged,
}) => {
  // Helper to get local date string YYYY-MM-DD
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Form State
  const [date, setDate] = useState('');
  const [bags, setBags] = useState<number | ''>('');
  const [rate, setRate] = useState<number | ''>('');
  const [agentName, setAgentName] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [mark, setMark] = useState<MarkType>('BRT');
  const [error, setError] = useState('');

  // Default date to today on open
  useEffect(() => {
    if (isOpen) {
      setDate(getLocalDateString());
      setBags('');
      setRate('');
      setAgentName('');
      setLotNumber('');
      setMark('BRT');
      setError('');
    }
  }, [isOpen]);

  // Compute total value instantly
  const computedTotal = (Number(bags) || 0) * (Number(rate) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!date) return setError('Date is required.');
    if (!bags || Number(bags) <= 0 || !Number.isInteger(Number(bags))) {
      return setError('Number of bags must be a positive integer.');
    }
    if (!rate || Number(rate) <= 0) {
      return setError('Rate per bag must be a positive number.');
    }
    if (!agentName.trim()) {
      return setError('Commission Agent Name is required.');
    }
    if (!lotNumber.trim()) {
      return setError('Lot Number is required (e.g., L-45).');
    }
    if (!mark) {
      return setError('Please select a Mark.');
    }

    // Trigger review step with data
    onSubmitStaged({
      date,
      bags: Number(bags),
      rate: Number(rate),
      agentName: agentName.trim(),
      lotNumber: lotNumber.trim().toUpperCase(),
      mark,
    });
  };

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`bottom-sheet-backdrop ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Panel */}
      <div className={`bottom-sheet ${isOpen ? 'active' : ''}`} role="dialog" aria-modal="true">
        <div className="bottom-sheet-drag-handle" />
        
        <div className="bottom-sheet-header">
          <h2>New Ledger Entry</h2>
          <button className="btn-icon-only" onClick={onClose} aria-label="Close Form">
            <X size={18} />
          </button>
        </div>

        <div className="bottom-sheet-content">
          {error && (
            <div 
              style={{
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: '600',
                marginBottom: '14px',
                border: '1px solid #fca5a5'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="entry-date">Entry Date</label>
              <input
                id="entry-date"
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="lot-number">Lot Number</label>
                <input
                  id="lot-number"
                  type="text"
                  placeholder="e.g. L-45"
                  className="form-control"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mark-select">Mark</label>
                <select
                  id="mark-select"
                  className="form-control"
                  value={mark}
                  onChange={(e) => setMark(e.target.value as MarkType)}
                >
                  <option value="BRT">BRT</option>
                  <option value="RS">RS</option>
                  <option value="TS">TS</option>
                  <option value="DV">DV</option>
                  <option value="BVB">BVB</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="bags-count">Number of Bags</label>
                <input
                  id="bags-count"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 150"
                  className="form-control"
                  value={bags === '' ? '' : bags}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBags(val === '' ? '' : parseInt(val, 10));
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="rate-per-bag">Rate per Bag (₹)</label>
                <input
                  id="rate-per-bag"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="e.g. 850.50"
                  className="form-control"
                  value={rate === '' ? '' : rate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRate(val === '' ? '' : parseFloat(val));
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="agent-name">Commission Agent Name</label>
              <input
                id="agent-name"
                type="text"
                placeholder="Enter agent name"
                className="form-control"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                required
              />
            </div>

            {/* Real-time Computed Total Value Box */}
            <div className="computed-display-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calculator size={16} style={{ color: 'var(--primary)' }} />
                <span className="computed-label">Estimated Value</span>
              </div>
              <span className="computed-value">{formatINR(computedTotal)}</span>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Review & Ledger
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
