import {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {loginPhase} from '../../bankid/protocol.js';
import {apiUrl} from '../links.js';
import type {LoginView} from '../../api/auth.js';

function bankid(path: string): string { return apiUrl(`/auth/bankid${path}`); }
function phone(): boolean { return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent); }

function launchApp(startLogin: () => Promise<LoginView | undefined>): void {
  void startLogin().then((next) => {
    if (next?.launch) window.location.assign(next.launch);
  });
}

type StartResponse = LoginView & { orderRef: string };
type OrderSession = { orderRef: string; abort: AbortController };

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
  const [view,           setView] = useState<LoginView|undefined>(undefined);
  const [error,         setError] = useState<Error|null>(null);
  const [isPending, setIsPending] = useState(false);
  const session = useRef<OrderSession | undefined>(undefined);
  const lock = useRef(false);

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

  const startLogin = async() => {
    if (lock.current) return undefined;
    lock.current = true;
    abandon(session.current);
    const abort = new AbortController();
    const active: OrderSession = {orderRef: '', abort};
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
      lock.current = false;
      if (session.current === active) setIsPending(false);
    }
  };

  return {view, error, isPending, startLogin};
}

export function Mobile({startLogin, isPending, view}: {
  startLogin: () => Promise<LoginView | undefined>;
  isPending: boolean;
  view: LoginView | undefined;
}) {
  return(
    <>
      <div className="stack stack--dense">
        {view?.launch ? (
          <a className="login_button" href={view.launch}>Open BankID</a>
        ) : (
          <button
            onClick={() => { launchApp(startLogin); }}
            className="login_button" type="button" disabled={isPending}
          >Login
          </button>
        )}
        <small>
          <em>Login</em> should open automatically, if it does not
          troubleshoot or login options
        </small>
      </div>
    </>
  );
}

export function Desktop({startLogin, isPending, view}: {
  startLogin: () => Promise<LoginView | undefined>;
  isPending: boolean;
  view: LoginView | undefined;
}) {
  return(
    <>
      <div className="stack stack--dense">
        {view?.code ? (
          <div className="button frame qr__code" dangerouslySetInnerHTML={{__html: view.code}}/>
        ) : (
          <>
            <button className="login_button" type="button" onClick={() => {
              void startLogin();
            }}
            disabled={isPending}
            >Scan QR
            </button>
            <button className="login_button" type="button" disabled={isPending}
              onClick={() => { launchApp(startLogin); }}
            >This device
            </button>
          </>
        )}
        <small>
          Issues? troubleshoot or login options
        </small>
      </div>
    </>
  );
}

export function LoginPage() {
  const {view, error, isPending, startLogin} = useLoginStream();
  const System = phone() ? Mobile : Desktop;
  const navigate = useNavigate();
  useEffect(() => {
    if (view?.phase !== loginPhase.complete) return;
    const id = window.setTimeout(() => { void navigate('/', {replace: true}); }, 800);
    return () => window.clearTimeout(id);
  }, [view?.phase, navigate]);
  return (
    <div className="login gradient">
      <main className="login__main">
        <div className="bankid">
          <section className="stack">
            <div className="identify"><h1>Login with <b><em>BankID</em></b></h1></div>
          </section>
          {view?.phase === loginPhase.complete ? (
            <p className="note">{view.name}</p>
          ) : (
            <System startLogin={startLogin} isPending={isPending} view={view} />
          )}
          {view?.phase !== loginPhase.complete && (view?.message ?? error?.message) && (
            <small className="note">{view?.message ?? error?.message}</small>
          )}
        </div>
      </main>
      <b><strong><h1 className="titlepage">ISMS.</h1></strong></b>
    </div>
  );
}
