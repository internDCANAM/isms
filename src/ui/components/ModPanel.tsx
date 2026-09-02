import {useEffect, useState} from 'react';
import {armKind} from '../../api/mod.js';
import {postJson} from '../links.js';
import type {ModArmComplete, ModUser} from '../../api/mod.js';

const MOD = '/mod';
const OPEN_KEY = 'mod:open';

const appearance = {
  scheme: ['paper', 'sea', 'stone'],
  font:   ['sans', 'serif'],
  size:   ['sm', 'lg'],
  layout: ['wide', 'narrow'],
} as const;
type AppearanceKey = keyof typeof appearance;

function readAttr(key: AppearanceKey): string {
  return document.documentElement.getAttribute(`data-${key}`) ?? appearance[key][0];
}

function writeAttr(key: AppearanceKey, value: string): void {
  document.documentElement.setAttribute(`data-${key}`, value);
  localStorage.setItem(`mod:${key}`, value);
}

export function ModPanel() {
  const [open,   setOpen] = useState(() => localStorage.getItem(OPEN_KEY) === '1');
  const [note,   setNote] = useState('');
  const [busy,   setBusy] = useState(false);
  const [attrs, setAttrs] = useState<Record<AppearanceKey, string>>({
    scheme: readAttr('scheme'),
    font:   readAttr('font'),
    size:   readAttr('size'),
    layout: readAttr('layout'),
  });

  useEffect(() => {
    (Object.keys(appearance) as AppearanceKey[]).forEach((key) => {
      const stored = localStorage.getItem(`mod:${key}`);
      if (!stored) return;
      writeAttr(key, stored);
      setAttrs((prev) => ({...prev, [key]: stored}));
    });
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem(OPEN_KEY, next ? '1' : '0');
  };

  const fakeLogin = async() => {
    setBusy(true);
    setNote('');
    try {
      const created = await postJson(`${MOD}/users`, {});
      if (!created.ok) throw new Error('could not create user');
      const user = await created.json() as ModUser;
      const armed = await postJson(`${MOD}/arm`, {
        kind: armKind.complete,
        personalNumber: user.personalNumber,
      });
      if (!armed.ok) throw new Error('could not arm complete');
      const arm = await armed.json() as ModArmComplete;
      setNote(`Armed ${arm.personalNumber}. Scan QR on login screen.`);
    } catch (caught) {
      setNote(caught instanceof Error ? caught.message : 'arm failed');
    } finally { setBusy(false); }
  };

  const failLogin = async() => {
    setBusy(true);
    setNote('');
    try {
      const armed = await postJson(`${MOD}/arm`, {kind: armKind.fail});
      if (!armed.ok) throw new Error('could not arm fail');
      setNote('Armed fail. Scan QR on login screen.');
    } catch (caught) {
      setNote(caught instanceof Error ? caught.message : 'arm failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="mod">
      <button className="mod__toggle" type="button" onClick={toggle}>
        {open ? 'Close sandbox' : 'Sandbox'}
      </button>
      {open && (
        <aside className="mod__panel">
          <p className="mod__label">BankID</p>
          <button type="button" disabled={busy} onClick={() => { void fakeLogin(); }}>
            Log in with fake user
          </button>
          <button type="button" disabled={busy} onClick={() => { void failLogin(); }}>
            Attempt login with fail
          </button>
          {note && <small className="note">{note}</small>}
          <p className="mod__label">Appearance</p>
          {(Object.keys(appearance) as AppearanceKey[]).map((key) => (
            <label key={key} className="mod__field">
              {key}
              <select
                value={attrs[key]}
                onChange={(event) => {
                  const value = event.target.value;
                  writeAttr(key, value);
                  setAttrs((prev) => ({...prev, [key]: value}));
                }}
              >
                {appearance[key].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}
        </aside>
      )}
    </div>
  );
}
