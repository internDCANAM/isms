import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import '../css/login.css';

interface LoginView {
  message: string | undefined;
  code: string | undefined;
  launch: string | undefined;
  name: string | undefined;
}

interface StartResponse extends LoginView {
  orderRef: string;
}

type LoginStage =
  | 'idle'
  | 'starting'
  | 'polling'
  | 'success'
  | 'error';

async function responseError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string };
    return body.error ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<LoginStage>('idle');
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [view, setView] = useState<LoginView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stage !== 'polling' || orderRef === null) {
      return;
    }

    let stopped = false;
    let timer: number | undefined;

    async function poll() {
      try {
        const response = await fetch(
          `/api/v1/auth/bankid/${orderRef}`,
          {credentials: 'same-origin'}
        );

        if (!response.ok) {
          if (!stopped) {
            setError(await responseError(response));
            setStage('error');
          }
          return;
        }

        const nextView = await response.json() as LoginView;

        if (stopped) {
          return;
        }

        setView(nextView);

        if (nextView.name) {
          setStage('success');
          timer = window.setTimeout(() => {
            void navigate('/');
          }, 1500);

          return;
        }

        timer = window.setTimeout(() => {
          void poll();
        }, 1000);

      } catch {
        if (!stopped) {
          setError('Could not contact the BankID service. Please try again.');
          setStage('error');
        }
      }
    }

    timer = window.setTimeout(() => {
      void poll();
    }, 600);

    return () => {
      stopped = true;

      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [navigate, orderRef, stage]);

  async function startLogin() {
    setStage('starting');
    setError(null);
    setView(null);
    setOrderRef(null);

    try {
      const response = await fetch('/api/v1/auth/bankid/start', {
        method: 'POST',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(await responseError(response));
      }

      const start = await response.json() as StartResponse;
      setOrderRef(start.orderRef);
      setView(start);
      setStage('polling');
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : 'Could not start BankID.'
      );
      setStage('error');
    }
  }

  async function cancelLogin() {
    if (orderRef !== null) {
      try {
        await fetch(`/api/v1/auth/bankid/${orderRef}/cancel`, {
          method: 'POST',
          credentials: 'same-origin',
        });
      } catch {
        // The local page can still reset when cancellation cannot be sent.
      }
    }

    setOrderRef(null);
    setView(null);
    setError(null);
    setStage('idle');
  }

  const qrSource = view?.code
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(view.code)}`
    : null;

  return (
    <main className="login-page">
      <section className="login-introduction">
        <div className="login-brand">
          <span className="login-brand__mark">S</span>
          <span>
            <strong>Sprinta ISMS</strong>
            <small>Information Security Management</small>
          </span>
        </div>

        <div className="login-introduction__content">
          <p className="login-eyebrow">Secure access</p>
          <h1>Protecting information starts here.</h1>
          <p>
            Sign in securely to manage risks, controls, assets and improvement
            activities.
          </p>

          <ul className="login-benefits">
            <li>Central risk overview</li>
            <li>ISO 27001 control monitoring</li>
            <li>Secure document management</li>
          </ul>
        </div>

        <p className="login-introduction__footer">
          Internal system · Authorised users only
        </p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card__heading">
            <span className="bankid-logo">BankID</span>
            <h2>Sign in</h2>
            <p>Use Mobile BankID to continue to Sprinta ISMS.</p>
          </div>

          {stage === 'idle' && (
            <div className="login-action">
              <div className="login-security-icon" aria-hidden="true">
                ✓
              </div>

              <p>
                Your identity is verified securely through BankID.
              </p>

              <button
                type="button"
                className="login-primary-button"
                onClick={() => void startLogin()}
              >
                Sign in with BankID
              </button>
            </div>
          )}

          {stage === 'starting' && (
            <div className="login-progress" role="status">
              <span className="login-spinner" />
              <h3>Starting BankID</h3>
              <p>Please wait while a secure login order is created.</p>
            </div>
          )}

          {stage === 'polling' && (
            <div className="login-progress" aria-live="polite">
              {qrSource ? (
                <>
                  <img
                    className="login-qr"
                    src={qrSource}
                    alt="QR code for BankID login"
                  />

                  <p className="login-qr-help">
                    Open BankID on another device and scan the QR code.
                  </p>
                </>
              ) : (
                <span className="login-spinner" />
              )}

              <p className="login-message">
                {view?.message ?? 'Waiting for BankID…'}
              </p>

              {view?.launch && (
                <a className="login-launch-link" href={view.launch}>
                  Open BankID on this device
                </a>
              )}

              <button
                type="button"
                className="login-secondary-button"
                onClick={() => void cancelLogin()}
              >
                Cancel
              </button>
            </div>
          )}

          {stage === 'success' && (
            <div className="login-result login-result--success" role="status">
              <span>✓</span>
              <h3>Welcome, {view?.name}</h3>
              <p>BankID verification completed. Opening the dashboard…</p>
            </div>
          )}

          {stage === 'error' && (
            <div className="login-result login-result--error" role="alert">
              <span>!</span>
              <h3>Login could not be completed</h3>
              <p>{error ?? view?.message ?? 'Please try again.'}</p>

              <button
                type="button"
                className="login-primary-button"
                onClick={() => void startLogin()}
              >
                Try again
              </button>
            </div>
          )}

          <footer className="login-card__footer">
            <span>🔒</span>
            <span>Your login is encrypted and protected by BankID.</span>
          </footer>
        </div>
      </section>
    </main>
  );
}