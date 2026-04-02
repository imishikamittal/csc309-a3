// Generated using Claude
export default function JobStatusBadge({ status }) {
  const map = {
    open: 'badge-green',
    filled: 'badge-blue',
    canceled: 'badge-red',
    expired: 'badge-gray',
    completed: 'badge-teal',
  };
  const labels = {
    open: 'Open',
    filled: 'Filled',
    canceled: 'Canceled',
    expired: 'Expired',
    completed: 'Completed',
  };
  return <span className={map[status] || 'badge-gray'}>{labels[status] || status}</span>;
}
