import {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {useNavigate} from 'react-router-dom';
import {loginPhase} from '../../bankid/protocol.js';
import {apiUrl} from '../links.js';
import type {LoginView} from '../../api/auth.js';
import {BIDLogo} from '../components/BIDLogo.js';
import {Title} from '../components/Title.js';

const narrowQuery = '(max-width: 40rem)';
const viewport = {narrow: 'narrow', wide: 'wide'} as const;
type Viewport = (typeof viewport)[keyof typeof viewport];
type StartResponse = LoginView & { orderRef: string };
type OrderSession = { orderRef: string; abort: AbortController };

function bankid(path: string): string { return apiUrl(`/auth/bankid${path}`); }
function phone(): boolean { return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent); }

function useViewport(): Viewport {
  const narrow = useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(narrowQuery);
      query.addEventListener('change', onChange);
      return () => { query.removeEventListener('change', onChange); };
    },
    () => window.matchMedia(narrowQuery).matches
  );
  return narrow ? viewport.narrow : viewport.wide;
}

function remaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function launchApp(startLogin: () => Promise<LoginView | undefined>): void {
  void startLogin().then((next) => {
    if (next?.launch) window.location.assign(next.launch);
  });
}

function failMessage(status: number): string {
  return status === 429
    ? 'Too many attempts. Please try again later.'
    : 'Something went wrong. Please try again.';
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function asError(caught: unknown, status = 0): Error {
  return caught instanceof Error ? caught : new Error(failMessage(status));
}

function abandon(current: OrderSession | undefined): void {
  if (!current) return;
  current.abort.abort();
  if (!current.orderRef) return;
  void fetch(bankid(`/${current.orderRef}/cancel`), {method: 'POST', keepalive: true});
}

export function useLoginStream() {
  const [view,           setView] = useState<LoginView | undefined>(undefined);
  const [error,         setError] = useState<Error|null>(null);
  const [isPending, setIsPending] = useState(false);
  const session                   = useRef<OrderSession | undefined>(undefined);
  const lock                      = useRef<OrderSession | undefined>(undefined);

  useEffect(() => {
    const stop = () => {
      abandon(session.current);
      session.current = undefined;
    };
    window.addEventListener('pagehide', stop);
    return () => {
      window.removeEventListener('pagehide', stop);
      stop();
    };
  }, []);

  const cancelLogin = () => {
    abandon(session.current);
    session.current = undefined;
    lock.current = undefined;
    setIsPending(false);
    setError(null);
    setView(undefined);
  };

  const startLogin = async() => {
    if (lock.current) return undefined;
    const abort = new AbortController();
    const active: OrderSession = {orderRef: '', abort};
    lock.current = active;
    abandon(session.current);
    session.current = active;
    setIsPending(true);
    setError(null);
    setView(undefined);

    try {
      const res = await fetch(bankid('/start'), {method: 'POST', signal: abort.signal});
      if (!res.ok) throw new Error(failMessage(res.status));
      const started = await res.json() as StartResponse;
      if (session.current !== active) return undefined;
      active.orderRef = started.orderRef;
      setView(started);

      let current: LoginView = started;
      while (current.phase === loginPhase.start) {
        const poll = await fetch(bankid(`/${started.orderRef}`), {signal: abort.signal});
        if (!poll.ok) throw new Error(failMessage(poll.status));
        current = await poll.json() as LoginView;
      }
      if (session.current !== active) return undefined;
      setView(current);

      if (current.phase === loginPhase.qr) {
        void (async() => {
          let latest = current;
          try {
            while (latest.phase === loginPhase.qr) {
              const poll = await fetch(bankid(`/${started.orderRef}`), {signal: abort.signal});
              if (!poll.ok) throw new Error(failMessage(poll.status));
              latest = await poll.json() as LoginView;
              if (session.current !== active) return;
              setView(latest);
            }
          } catch (caught) {
            if (isAbort(caught) || session.current !== active) return;
            abandon(active);
            if (session.current === active) session.current = undefined;
            setError(asError(caught));
            setView(undefined);
          }
        })();
      }
      return current;
    } catch (caught) {
      if (isAbort(caught) || session.current !== active) return undefined;
      abandon(active);
      session.current = undefined;
      setError(asError(caught));
      setView(undefined);
      return undefined;
    } finally {
      if (lock.current === active) lock.current = undefined;
      if (session.current === active) setIsPending(false);
    }
  };

  return {view, error, isPending, startLogin, cancelLogin};
}

function Intro() {
  return (
    <div className="login__intro">
      <p className="login__welcome">Welcome to ISMS</p>
      <p className="login__continue">Authenticate with BankID to continue</p>
    </div>
  );
}

function Access() {
  return (
    <div className="login__access">
      <p>Client organisation</p>
      <p><button className="linklike">Request</button> access</p>
    </div>
  );
}

export function Mobile({startLogin, isPending, view, cancelLogin}: {
  startLogin: () => Promise<LoginView | undefined>;
  isPending: boolean;
  view: LoginView | undefined;
  cancelLogin: () => void;
}) {
  return (
    <div className="stack stack--dense">
      {view?.launch ? (
        <>
          <a className="login_button" href={view.launch}>
            <BIDLogo />
            <span>Open BankID</span>
          </a>
          <button className="linklike" type="button" onClick={cancelLogin}>Cancel</button>
        </>
      ) : (
        <button
          onClick={() => { launchApp(startLogin); }}
          className="login_button" type="button" disabled={isPending}
        >
          <BIDLogo />
          <span>Log in</span>
        </button>
      )}
    </div>
  );
}

export function QrPanel({code, expiresInMs, extendable, cancelLogin, extendLogin}: {
  code: string;
  expiresInMs: number;
  extendable: boolean;
  cancelLogin: () => void;
  extendLogin: () => void;
}) {
  return(
    <div className="qr">
      <div className="button frame qr__code" dangerouslySetInnerHTML={{__html: code}}/>
      <p className="qr__remain">Code expires in <time>{remaining(expiresInMs)}</time></p>
      {extendable && (
        <button className="login_button qr__extend" type="button" onClick={extendLogin}>
          <span>Extend</span>
        </button>
      )}
      <button className="linklike" type="button" onClick={cancelLogin}>Cancel</button>
    </div>
  );
}

export function Desktop({startLogin, isPending, view, cancelLogin}: {
  startLogin: () => Promise<LoginView | undefined>;
  isPending: boolean;
  view: LoginView | undefined;
  cancelLogin: () => void;
}) {
  return (
    <div className="stack stack--dense">
      {view?.code && view.expiresInMs !== undefined ? (
        <QrPanel code={view.code} expiresInMs={view.expiresInMs} extendable={view.extendable}
          cancelLogin={cancelLogin} extendLogin={() => { void startLogin(); }}/>
      ) : (
        <>
          <button className="login_button" type="button" onClick={() => {
            void startLogin();
          }}
          disabled={isPending}
          >
            <BIDLogo />
            <span>Scan QR</span>
          </button>
          <button className="login_button" type="button" disabled={isPending}
            onClick={() => { launchApp(startLogin); }}
          >
            <BIDLogo />
            <span>This device</span>
          </button>
        </>
      )}
    </div>
  );
}

export function LoginPage() {
  const {view, error, isPending, startLogin, cancelLogin} = useLoginStream();
  const port = useViewport();
  const isNarrow = port === viewport.narrow;
  const System = phone() ? Mobile : Desktop;
  const navigate = useNavigate();
  useEffect(() => {
    if (view?.phase !== loginPhase.complete) return;
    const id = window.setTimeout(() => { void navigate('/', {replace: true}); }, 800);
    return () => window.clearTimeout(id);
  }, [view?.phase, navigate]);
  return (
    <div className="login" data-viewport={port}>
      <Title />
      <div className="login__body">
        {view?.phase === loginPhase.complete ? (
          <div className="login__intro">
            <p className="login__welcome">Welcome, {view.name}.</p>
          </div>
        ) : (
          <>
            {isNarrow ? (
              <div className="login__dock">
                <Intro />
                <span className="login__dock-rule" aria-hidden="true" />
                <Access />
              </div>
            ) : (
              <Intro />
            )}
            <main className="login__main">
              <div className="bankid">
                <System startLogin={startLogin} isPending={isPending} view={view}
                  cancelLogin={cancelLogin} />
                {(view?.message ?? error?.message) && (
                  <small className="note">{view?.message ?? error?.message}</small>
                )}
              </div>
            </main>
            {!isNarrow && <Access />}
          </>
        )}
      </div>
    </div>
  );
}
