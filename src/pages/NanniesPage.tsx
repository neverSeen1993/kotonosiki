import { useState, useEffect } from 'react';
import { useNannyStore } from '../store/nannyStore';
import { Catnanny, PagePermissions, ALL_PAGES, DEFAULT_PERMISSIONS, PageAccess } from '../types';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Plus, Edit2, Trash2, UserCog, Phone, StickyNote, Eye, Pencil, EyeOff, Shield } from 'lucide-react';

/* ── Permission matrix component ─────────────────────────────────────────── */

function PermissionMatrix({
  permissions,
  onChange,
}: {
  permissions: PagePermissions;
  onChange: (p: PagePermissions) => void;
}) {
  const toggle = (key: keyof PagePermissions, value: PageAccess) => {
    onChange({ ...permissions, [key]: value });
  };

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase">Сторінка</th>
            <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-400 uppercase">
              <span className="inline-flex items-center gap-1"><EyeOff size={12} /> Прихована</span>
            </th>
            <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-400 uppercase">
              <span className="inline-flex items-center gap-1"><Eye size={12} /> Перегляд</span>
            </th>
            <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-400 uppercase">
              <span className="inline-flex items-center gap-1"><Pencil size={12} /> Редагування</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ALL_PAGES.map((page) => (
            <tr key={page.key} className="border-t border-gray-50 hover:bg-gray-50/50">
              <td className="px-2 py-2 font-medium text-gray-700">{page.label}</td>
              {(['hidden', 'view', 'edit'] as PageAccess[]).map((level) => (
                <td key={level} className="px-2 py-2 text-center">
                  <label className="inline-flex cursor-pointer">
                    <input
                      type="radio"
                      name={`perm-${page.key}`}
                      checked={permissions[page.key] === level}
                      onChange={() => toggle(page.key, level)}
                      className="accent-teal-500 w-4 h-4"
                    />
                  </label>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Form ────────────────────────────────────────────────────────────────── */

interface NannyFormProps {
  initial?: Catnanny;
  onSubmit: (data: Omit<Catnanny, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

function NannyForm({ initial, onSubmit, onCancel }: NannyFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [login, setLogin] = useState(initial?.login ?? '');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState<PagePermissions>(
    initial?.permissions ?? { ...DEFAULT_PERMISSIONS },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      login: login.trim() || undefined,
      passwordHash: password ? btoa(password) : initial?.passwordHash,
      permissions,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Ім'я *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="Ім'я котоняні"
          required
        />
      </div>

      <div>
        <label className="label">Телефон</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input"
          placeholder="+380..."
        />
      </div>

      <div>
        <label className="label">Нотатки</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input resize-none"
          rows={2}
          placeholder="Додаткова інформація..."
        />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Логін (необов'язково)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Логін</label>
            <input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="input"
              placeholder="nanny1"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="label">{initial ? 'Новий пароль' : 'Пароль'}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder={initial ? '(залишити порожнім)' : 'Пароль'}
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          <span className="inline-flex items-center gap-1"><Shield size={13} /> Права доступу</span>
        </p>
        <PermissionMatrix permissions={permissions} onChange={setPermissions} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Скасувати</button>
        <button type="submit" className="btn-primary">{initial ? 'Зберегти' : 'Додати'}</button>
      </div>
    </form>
  );
}

/* ── Access label helper ─────────────────────────────────────────────────── */

const accessBadge: Record<PageAccess, { label: string; cls: string }> = {
  hidden: { label: 'Прихована', cls: 'bg-gray-100 text-gray-500' },
  view: { label: 'Перегляд', cls: 'bg-blue-50 text-blue-600' },
  edit: { label: 'Редагування', cls: 'bg-green-50 text-green-600' },
};

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function NanniesPage() {
  const { nannies, loaded, loadNannies, addNanny, updateNanny, deleteNanny } = useNannyStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Catnanny | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) loadNannies();
  }, [loaded, loadNannies]);

  const handleAdd = async (data: Omit<Catnanny, 'id' | 'createdAt'>) => {
    await addNanny(data);
    setShowForm(false);
  };

  const handleUpdate = async (data: Omit<Catnanny, 'id' | 'createdAt'>) => {
    if (!editing) return;
    await updateNanny(editing.id, data);
    setEditing(null);
  };

  const handleDelete = async (nanny: Catnanny) => {
    if (confirm(`Видалити котоняню "${nanny.name}"? Цю дію не можна скасувати.`)) {
      await deleteNanny(nanny.id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserCog size={24} className="text-teal-500" /> Котоняні
          </h1>
          <p className="text-sm text-gray-500 mt-1">Управління котонянями та їхніми правами доступу</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Додати
        </button>
      </div>

      {nannies.length === 0 && loaded ? (
        <EmptyState
          title="Немає котонянь"
          description="Додайте котоняню, щоб налаштувати їхній доступ до системи."
        />
      ) : (
        <div className="space-y-3">
          {nannies.map((nanny) => (
            <div key={nanny.id} className="card">
              {/* Header */}
              <div className="p-4 flex items-start justify-between gap-3">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setExpanded(expanded === nanny.id ? null : nanny.id)}
                >
                  <h3 className="font-semibold text-gray-800">{nanny.name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                    {nanny.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={13} /> {nanny.phone}
                      </span>
                    )}
                    {nanny.login && (
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        Логін: {nanny.login}
                      </span>
                    )}
                    {nanny.notes && (
                      <span className="inline-flex items-center gap-1">
                        <StickyNote size={13} /> {nanny.notes}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setEditing(nanny)}
                    className="btn-secondary text-xs py-1 px-2"
                    title="Редагувати"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(nanny)}
                    className="btn-danger text-xs py-1 px-2"
                    title="Видалити"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Expanded permissions */}
              {expanded === nanny.id && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Права доступу</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_PAGES.map((page) => {
                      const access = nanny.permissions[page.key];
                      const badge = accessBadge[access];
                      return (
                        <div
                          key={page.key}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${badge.cls}`}
                        >
                          {access === 'hidden' && <EyeOff size={11} />}
                          {access === 'view' && <Eye size={11} />}
                          {access === 'edit' && <Pencil size={11} />}
                          {page.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showForm && (
        <Modal title="Додати котоняню" onClose={() => setShowForm(false)}>
          <NannyForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal title={`Редагувати — ${editing.name}`} onClose={() => setEditing(null)}>
          <NannyForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}


