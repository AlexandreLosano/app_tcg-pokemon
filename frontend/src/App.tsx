import { useState } from 'react';
import BinderPage from './components/BinderPage';
import ChartsPage from './components/ChartsPage';

type PageMode = 'binder' | 'charts';

const PAGES: { value: PageMode; label: string }[] = [
  { value: 'binder', label: 'Fichário' },
  { value: 'charts', label: 'Gráficos' },
];

export default function App() {
  const [page, setPage] = useState<PageMode>('binder');

  return (
    <div className="app-root">
      <nav className="app-nav">
        <h1 className="app-nav-title">Living Dex — TCG Pokémon</h1>
        <div className="view-switch">
          {PAGES.map(p => (
            <button
              key={p.value}
              className={`view-switch-btn ${page === p.value ? 'active' : ''}`}
              onClick={() => setPage(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </nav>
      {page === 'binder' ? <BinderPage /> : <ChartsPage />}
    </div>
  );
}
