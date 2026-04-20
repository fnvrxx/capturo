import { NavLink, useNavigate } from 'react-router-dom';
import { House, LayoutTemplate, Camera, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/', icon: House, label: 'Home' },
  { to: '/templates', icon: LayoutTemplate, label: 'Templates' },
  { to: '/ocr', icon: Camera, label: 'Scan OCR' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  return (
    <aside className="w-[220px] shrink-0 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-30">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#534AB7] rounded-lg flex items-center justify-center">
            <Camera size={15} className="text-white" />
          </div>
          <span className="font-medium text-[#534AB7] text-base">Captuto</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
              ${isActive ? 'bg-[#EEEDFE] text-[#534AB7] font-medium' : 'text-gray-600 hover:bg-gray-50'}`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#534AB7] flex items-center justify-center text-white text-xs font-medium shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.company_name}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
