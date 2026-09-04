import { useState } from 'react';
import { api } from '../api/client';
import type { Binder } from '../types';

interface Props {
  binders: Binder[];
  onClose: () => void;
  onChanged: () => void;
}

export default function BinderManagerModal({ binders, onClose, onChanged }: Props) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      await api.binders.create(name);
      setNewName('');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const startRename = (binder: Binder) => {
    setEditingId(binder.id);
    setEditingName(binder.name);
  };

  const handleRename = async (id: number) => {
    const name = editingName.trim();
    if (!name) return;
    setError(null);
    try {
      await api.binders.rename(id, name);
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRemove = async (id: number) => {
    setError(null);
    try {
      await api.binders.remove(id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <h2>Fichários</h2>
        <div className="subtitle">Cadastro dos fichários físicos onde as cartas ficam guardadas.</div>

        <div className="modal-section">
          {binders.length === 0 && <div className="search-hint">Nenhum fichário cadastrado ainda.</div>}
          <ul className="binder-list">
            {binders.map(binder => (
              <li key={binder.id} className="binder-list-item">
                {editingId === binder.id ? (
                  <>
                    <input
                      className="binder-rename-input"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRename(binder.id)}
                      autoFocus
                    />
                    <button className="btn-small" onClick={() => handleRename(binder.id)}>
                      Salvar
                    </button>
                    <button className="btn-small" onClick={() => setEditingId(null)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <span className="binder-list-name">{binder.name}</span>
                    <button className="btn-small" onClick={() => startRename(binder)}>
                      Renomear
                    </button>
                    <button className="btn-small danger" onClick={() => handleRemove(binder.id)}>
                      Remover
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="modal-section">
          <h3>Novo fichário</h3>
          <div className="search-box">
            <input
              className="search-name-input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nome do fichário…"
            />
            <button className="search-button" onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? 'Criando…' : 'Criar'}
            </button>
          </div>
          {error && <div className="sync-summary error">{error}</div>}
        </div>
      </div>
    </div>
  );
}
