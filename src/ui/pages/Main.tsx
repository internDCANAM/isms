import {Link} from 'react-router-dom';

const pages = [
  {to: '/login',                   label: 'Login'},
  {to: '/risks',                   label: 'Risk register'},
  {to: '/risks/example',           label: 'Risk detail'},
  {to: '/nonconformities',         label: 'Nonconformities'},
  {to: '/nonconformities/example', label: 'Nonconformity detail'},
  {to: '/assets',                  label: 'Asset inventory'},
  {to: '/controls',                label: 'Controls'},
  {to: '/documents',               label: 'Controlled documents'},
] as const;

export function MainPage() {
  return (
    <section className="phase center stack">
      <h1>ISMS</h1>
      <nav className="stack stack--dense">
        {pages.map(({to, label}) => <Link key={to} to={to}>{label}</Link>)}
      </nav>
      <p className="note">Every page below is a stub — phase 2.</p>
    </section>
  );
}
