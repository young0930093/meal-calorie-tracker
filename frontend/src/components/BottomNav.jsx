import { useNavigate, useLocation } from 'react-router-dom';

const NAV = [
  { path: '/', icon: '🏠', label: '홈' },
  { path: '/upload', icon: '📷', label: '추가' },
  { path: '/history', icon: '📊', label: '히스토리' },
  { path: '/settings', icon: '⚙️', label: '설정' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full flex justify-around items-center z-50 py-2"
      style={{
        maxWidth: 480,
        backgroundColor: '#fff',
        borderTop: '1px solid #FCE4EC',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}
    >
      {NAV.map(({ path, icon, label }) => {
        const active = pathname === path || (path === '/' && pathname === '/');
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-0.5 px-5 py-1 transition-colors"
            style={{ color: active ? '#FF85A1' : '#9CA3AF' }}
          >
            <span className="text-2xl leading-none">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
