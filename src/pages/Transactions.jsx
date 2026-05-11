import { useState, useEffect } from 'react';
import { ExternalLink, ArrowDownLeft, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import KycBanner from '../components/KycBanner';
import { getTransactions } from '../api';
import { useAuth } from '../context/AuthContext';

const EXPLORER_URLS = {
  CELO:    (hash) => `https://celoscan.io/tx/${hash}`,
  BASE:    (hash) => `https://basescan.org/tx/${hash}`,
  BNB:     (hash) => `https://bscscan.com/tx/${hash}`,
  SOLANA:  (hash) => `https://solscan.io/tx/${hash}`,
};

const STATUS_CONFIG = {
  completed:  { label: 'Completed',  color: '#008751', bg: '#e6f3ed', icon: CheckCircle },
  pending:    { label: 'Pending',    color: '#d97706', bg: '#fffbeb', icon: Clock },
  processing: { label: 'Processing', color: '#2563eb', bg: '#eff6ff', icon: Clock },
  failed:     { label: 'Failed',     color: '#dc2626', bg: '#fef2f2', icon: XCircle },
  cancelled:  { label: 'Cancelled',  color: '#6b7280', bg: '#f3f4f6', icon: AlertCircle },
};

// Mock transactions for preview while backend is not ready
const MOCK_TRANSACTIONS = [
  { id: 'TXN-001', token: 'USDT', chain: 'CELO',   amount: 10000, tokenAmount: '6.25',   status: 'completed',  walletAddress: '0xabc...def', txHash: '0x123abc', createdAt: '2026-01-10T10:30:00Z' },
  { id: 'TXN-002', token: 'USDC', chain: 'BASE',   amount: 25000, tokenAmount: '15.60',  status: 'completed',  walletAddress: '0xabc...def', txHash: '0x456def', createdAt: '2026-01-09T14:20:00Z' },
  { id: 'TXN-003', token: 'USDT', chain: 'SOLANA', amount: 5000,  tokenAmount: '3.12',   status: 'pending',    walletAddress: 'So1abc...xyz', txHash: null,       createdAt: '2026-01-08T09:15:00Z' },
  { id: 'TXN-004', token: 'USDC', chain: 'BNB',    amount: 50000, tokenAmount: '31.25',  status: 'failed',     walletAddress: '0xabc...def', txHash: null,       createdAt: '2026-01-07T16:45:00Z' },
  { id: 'TXN-005', token: 'USDT', chain: 'CELO',   amount: 15000, tokenAmount: '9.37',   status: 'completed',  walletAddress: '0xabc...def', txHash: '0x789ghi', createdAt: '2026-01-06T11:00:00Z' },
];

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span className="tx-status-badge" style={{ color: config.color, background: config.bg }}>
      <Icon size={12} /> {config.label}
    </span>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const kycStatus = user?.kycStatus || 'none';

  useEffect(() => {
    getTransactions()
      .then((data) => setTransactions(data.transactions))
      .catch(() => setTransactions(MOCK_TRANSACTIONS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.status === filter);

  const totalSpent = transactions.filter((t) => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const totalTxns = transactions.length;
  const successRate = totalTxns ? Math.round((transactions.filter((t) => t.status === 'completed').length / totalTxns) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="dl-page">
        <KycBanner kycStatus={kycStatus} dailyUsed={0} />

        <div className="dl-page-header">
          <h2>Transactions</h2>
          <p>Your full transaction history</p>
        </div>

        {/* Summary cards */}
        <div className="tx-summary-cards">
          <div className="tx-summary-card">
            <div className="tx-summary-label">Total Spent</div>
            <div className="tx-summary-value">₦{totalSpent.toLocaleString()}</div>
          </div>
          <div className="tx-summary-card">
            <div className="tx-summary-label">Transactions</div>
            <div className="tx-summary-value">{totalTxns}</div>
          </div>
          <div className="tx-summary-card">
            <div className="tx-summary-label">Success Rate</div>
            <div className="tx-summary-value">{successRate}%</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="tx-filters">
          {['all', 'completed', 'pending', 'processing', 'failed'].map((f) => (
            <button
              key={f}
              className={`tx-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        {loading ? (
          <div className="tx-empty">Loading transactions...</div>
        ) : filtered.length === 0 ? (
          <div className="tx-empty">No transactions found.</div>
        ) : (
          <div className="tx-list">
            {filtered.map((tx) => {
              const explorerUrl = tx.txHash && EXPLORER_URLS[tx.chain] ? EXPLORER_URLS[tx.chain](tx.txHash) : null;
              return (
                <div key={tx.id} className="tx-item">
                  <div className="tx-item-icon">
                    <ArrowDownLeft size={18} color="var(--primary)" />
                  </div>
                  <div className="tx-item-main">
                    <div className="tx-item-top">
                      <span className="tx-item-title">{tx.tokenAmount} {tx.token}</span>
                      <span className="tx-item-amount">₦{tx.amount.toLocaleString()}</span>
                    </div>
                    <div className="tx-item-bottom">
                      <span className="tx-item-meta">{tx.chain} · {formatDate(tx.createdAt)}</span>
                      <StatusBadge status={tx.status} />
                    </div>
                    <div className="tx-item-wallet">{tx.walletAddress}</div>
                    {explorerUrl && (
                      <a href={explorerUrl} target="_blank" rel="noreferrer" className="tx-explorer-link">
                        View on Explorer <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
