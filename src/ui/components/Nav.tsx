import {NavLink} from 'react-router-dom';
import '../css/nav.css';

const navigationItems = [
  {to: '/dashboard', label: 'Dashboard', end: true},
  {to: '/risks', label: 'Risks', end: false},
  {to: '/nonconformities', label: 'Nonconformities', end: false},
  {to: '/assets', label: 'Assets', end: false},
  {to: '/controls', label: 'Controls', end: false},
  {to: '/documents', label: 'Documents', end: false},
] as const;

export function Nav() {
  return (
    <header className="app-header">
      <div className="app-header__content">
        <NavLink to="/" className="app-brand">
          <span className="app-brand__mark">S</span>

          <span>
            <strong>Sprinta ISMS</strong>
            <small>Information security</small>
          </span>
        </NavLink>

        <nav className="app-navigation" aria-label="Main navigation">
          {navigationItems.map(({to, label, end}) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({isActive}) =>
                isActive
                  ? 'app-navigation__link app-navigation__link--active'
                  : 'app-navigation__link'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <NavLink to="/login" className="app-login-link">
          Sign in
        </NavLink>
      </div>
    </header>
  );
}