export default function MissingDataBanner({ columns }: { columns: string[] }) {
  if (!columns.length) return null
  return (
    <div style={{
      background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8,
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 13, color: '#92400E',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>
        <strong>Missing columns in your Google Sheet:</strong>{' '}
        {columns.join(', ')} — some features are disabled. Check your column headers.
      </span>
    </div>
  )
}
