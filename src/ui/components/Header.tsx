import {NavLink} from 'react-router-dom';

export default function Header() {
  return(
    <header className="header">
      <nav className="header__nav">
        <ul>
          <li><NavLink to="/1">Nav</NavLink></li>
          <li><NavLink to="/2">Nav</NavLink></li>
          <li><NavLink to="/3">Nav</NavLink></li>
        </ul>
      </nav>
    </header>
  );
}
