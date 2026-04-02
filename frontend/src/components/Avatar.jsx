// Generated using Claude
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Avatar({ src, name, size = 'md' }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-3xl',
  };

  if (src) {
    const url = src.startsWith('http') ? src : `${BASE_URL}${src}`;
    return (
      <img
        src={url}
        alt={name || 'avatar'}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className={`${sizes[size]} rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}
