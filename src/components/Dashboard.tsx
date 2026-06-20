import React from 'react';
import type { Transaction } from '../types';
import { FileSpreadsheet, Package, IndianRupee } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  // Compute analytics in real-time
  const totalTransactions = transactions.length;
  const totalBags = transactions.reduce((sum, t) => sum + t.bags, 0);
  const totalValue = transactions.reduce((sum, t) => sum + t.totalValue, 0);

  // Format currency in Indian Rupee format (INR)
  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format bag count with thousand separators
  const formatBags = (count: number) => {
    return new Intl.NumberFormat('en-IN').format(count);
  };

  return (
    <section className="dashboard-grid" aria-label="Real-time Analytics Dashboard">
      <div className="metric-card">
        <div>
          <div className="metric-title">Total Transactions</div>
          <div className="metric-value">{totalTransactions}</div>
        </div>
        <div style={{ position: 'absolute', right: 16, bottom: 16, opacity: 0.15, color: 'var(--text-main)' }}>
          <FileSpreadsheet size={32} />
        </div>
      </div>

      <div className="metric-card">
        <div>
          <div className="metric-title">Bags Handled</div>
          <div className="metric-value">{formatBags(totalBags)} bags</div>
        </div>
        <div style={{ position: 'absolute', right: 16, bottom: 16, opacity: 0.15, color: 'var(--text-main)' }}>
          <Package size={32} />
        </div>
      </div>

      <div className="metric-card">
        <div>
          <div className="metric-title">Consolidated Value</div>
          <div className="metric-value currency">{formatINR(totalValue)}</div>
        </div>
        <div style={{ position: 'absolute', right: 16, bottom: 16, opacity: 0.15, color: 'var(--primary-accent)' }}>
          <IndianRupee size={32} />
        </div>
      </div>
    </section>
  );
};
