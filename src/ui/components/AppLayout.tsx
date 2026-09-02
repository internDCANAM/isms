import {Outlet} from 'react-router-dom';
import {Nav} from './Nav.js';

export function AppLayout() {
  return (
    <>
      <Nav />

      <div className="app-content">
        <Outlet />
      </div>
    </>
  );
}