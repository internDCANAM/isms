import {NavLink} from 'react-router-dom';

export default function Header() {
  return(
    <header className="header">
      <nav className="header__nav">
        <ul>
          <li><NavLink to="/1">NAVNAV</NavLink></li>
          <li><NavLink to="/2">NAVNAV</NavLink></li>
          <li><NavLink to="/3">NAVNAV</NavLink></li>
        </ul>
      </nav>
    </header>
  );
}
