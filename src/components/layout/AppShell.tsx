import { NavLink, Link } from 'react-router-dom';
import { Cat, LayoutGrid, Calendar, Download, Upload } from 'lucide-react';
import { useRecordsStore } from '../../store/recordsStore';
import { exportData, importData } from '../../utils/localStorage';
import { useCatsStore } from '../../store/catsStore';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { getUpcomingAppointments } = useRecordsStore();
  const { cats } = useCatsStore();
  const upcoming = getUpcomingAppointments();
  const overdueCount = upcoming.filter((r) => {
    const d = new Date(r.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }).length;

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kotonosiki-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (importData(text)) {
          window.location.reload();
        } else {
          alert('Невірний файл резервної копії');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const navItems = [
    { to: '/', label: 'Каталог', icon: <LayoutGrid size={18} />, exact: true },
    {
      to: '/appointments',
      label: 'Прийоми',
      icon: <Calendar size={18} />,
      badge: overdueCount > 0 ? overdueCount : null,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 bg-white border-r border-gray-100 px-3 py-6 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 px-3 mb-8">
          <Cat size={28} className="text-teal-500" />
          <span className="text-xl font-bold text-gray-800">Kotonosyky</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 pt-4 mt-4 space-y-1">
          <p className="text-xs text-gray-400 px-3 mb-2">{cats.length} котик{cats.length === 1 ? '' : cats.length >= 2 && cats.length <= 4 ? 'и' : 'ів'}</p>
          <button
            onClick={handleExport}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 w-full transition"
          >
            <Download size={16} /> Експорт копії
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 w-full transition"
          >
            <Upload size={16} /> Імпорт копії
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2">
          <Cat size={24} className="text-teal-500" />
          <span className="text-lg font-bold text-gray-800">Kotonosyky</span>
        </Link>
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">{children}</div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex border-t border-gray-100 bg-white">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-3 text-xs font-medium gap-1 transition ${
                  isActive ? 'text-teal-600' : 'text-gray-500'
                }`
              }
            >
              <span className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </main>
    </div>
  );
}
