import { NavLink } from 'react-router-dom';
import { Home, Calculator, BookOpen, Target, Users } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/calculator', label: 'Calculator', icon: Calculator },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/community', label: 'Level Up', icon: Users },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-40 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 pt-2 max-w-lg mx-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                isActive
                  ? 'text-accent-primary bg-bg-secondary'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-accent-primary' : 'text-text-tertiary'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
