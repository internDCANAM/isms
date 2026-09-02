import {useQuery} from '@tanstack/react-query';
import {Link, useParams} from 'react-router-dom';
import {NonconformityState, Theme} from '../../domain.js';
import type {NonconformityDetail} from '../../api/nonconformity.js';
import '../css/nonconformity-detail.css';

type CorrectiveAction = NonconformityDetail['actions'][number];

const stateLabels: Record<NonconformityState, string> = {
  [NonconformityState.OPEN]: 'Open',
  [NonconformityState.IN_PROGRESS]: 'In progress',
  [NonconformityState.CLOSED]: 'Closed',
};

const themeLabels: Record<Theme, string> = {
  [Theme.ORGANIZATIONAL]: 'Organizational',
  [Theme.PEOPLE]: 'People',
  [Theme.PHYSICAL]: 'Physical',
  [Theme.TECHNOLOGICAL]: 'Technological',
};

function formatDate(value: string | null) {
  if (value === null) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-SE').format(new Date(value));
}

function ActionStatus({completedAt}: { completedAt: string | null }) {
  const completed = completedAt !== null;

  return (
    <span
      className={
        completed
          ? 'action-status action-status--completed'
          : 'action-status action-status--pending'
      }
    >
      {completed ? 'Completed' : 'Pending'}
    </span>
  );
}

async function fetchNonconformity(
  id: string
): Promise<NonconformityDetail> {
  const response = await fetch(`/api/v1/nonconformities/${id}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    let message =
      `Could not load nonconformity (${response.status}).`;

    try {
      const body = await response.json() as { error?: string };
      message = body.error ?? message;
    } catch {
      // Keep the fallback message when the response is not JSON.
    }

    throw new Error(message);
  }

  return await response.json() as NonconformityDetail;
}

function CorrectiveActionCard({
  action,
}: {
  action: CorrectiveAction;
}) {
  return (
    <article className="corrective-action">
      <div className="corrective-action__heading">
        <h3>{action.description}</h3>
        <ActionStatus completedAt={action.completedAt} />
      </div>

      <div className="root-cause">
        <span>Root cause</span>
        <p>{action.rootCause ?? 'Not recorded'}</p>
      </div>

      <dl className="action-information">
        <div>
          <dt>Assigned to</dt>
          <dd>{action.assignedToName ?? 'Unassigned'}</dd>
        </div>

        <div>
          <dt>Due date</dt>
          <dd>{formatDate(action.dueDate)}</dd>
        </div>

        <div>
          <dt>Completed</dt>
          <dd>
            {action.completedAt
              ? formatDate(action.completedAt)
              : 'Not completed'}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function NonconformityDetailPage() {
  const {id} = useParams();

  const nonconformityQuery = useQuery({
    queryKey: ['nonconformity', id],
    queryFn: () => {
      if (!id) {
        throw new Error('The nonconformity ID is missing.');
      }

      return fetchNonconformity(id);
    },
    enabled: Boolean(id),
  });

  if (!id) {
    return (
      <main className="nc-detail-page">
        <Link className="nc-back-link" to="/nonconformities">
          ← Back to Nonconformities
        </Link>

        <section className="nc-detail-empty">
          <h1>Nonconformity details are unavailable</h1>
          <p>The nonconformity ID is missing from the address.</p>
        </section>
      </main>
    );
  }

  if (nonconformityQuery.isPending) {
    return (
      <main className="nc-detail-page">
        <Link className="nc-back-link" to="/nonconformities">
          ← Back to Nonconformities
        </Link>

        <section className="nc-detail-empty" role="status">
          <h1>Loading nonconformity…</h1>
          <p>Please wait while the record is loaded.</p>
        </section>
      </main>
    );
  }

  if (nonconformityQuery.isError) {
    return (
      <main className="nc-detail-page">
        <Link className="nc-back-link" to="/nonconformities">
          ← Back to Nonconformities
        </Link>

        <section className="nc-detail-empty" role="alert">
          <h1>Nonconformity details are unavailable</h1>
          <p>{nonconformityQuery.error.message}</p>

          <button
            className="nc-edit-button"
            type="button"
            onClick={() => void nonconformityQuery.refetch()}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  const nonconformity = nonconformityQuery.data;

  return (
    <main className="nc-detail-page">
      <Link className="nc-back-link" to="/nonconformities">
        ← Back to Nonconformities
      </Link>

      <header className="nc-detail-header">
        <div>
          <div className="nc-detail-title-meta">
            <span>{nonconformity.reference}</span>

            <span
              className={
                'nc-detail-state nc-detail-state--'
                + nonconformity.state.toLowerCase().replace('_', '-')
              }
            >
              {stateLabels[nonconformity.state]}
            </span>
          </div>

          <h1>{nonconformity.title}</h1>
          <p>Last updated: {formatDate(nonconformity.updatedAt)}</p>
        </div>

        <button
          className="nc-edit-button"
          type="button"
          disabled
          title="Editing will be added in a later phase"
        >
          Edit
        </button>
      </header>

      <div className="nc-detail-layout">
        <div className="nc-detail-main">
          <section className="nc-detail-card">
            <h2>Overview</h2>
            <p>{nonconformity.description}</p>

            <dl className="nc-information">
              <div>
                <dt>Theme</dt>
                <dd>{themeLabels[nonconformity.theme]}</dd>
              </div>

              <div>
                <dt>Raised by</dt>
                <dd>{nonconformity.raisedByName ?? 'Unassigned'}</dd>
              </div>

              <div>
                <dt>Raised at</dt>
                <dd>{formatDate(nonconformity.raisedAt)}</dd>
              </div>

              <div>
                <dt>Actions</dt>
                <dd>{nonconformity.actionCount}</dd>
              </div>

              {nonconformity.closedAt && (
                <div>
                  <dt>Closed at</dt>
                  <dd>{formatDate(nonconformity.closedAt)}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="nc-detail-card">
            <div className="nc-detail-section-heading">
              <div>
                <p className="nc-detail-eyebrow">Clause 10.2</p>
                <h2>Corrective actions</h2>
              </div>

              <button type="button" disabled>
                + Add action
              </button>
            </div>

            {nonconformity.actions.length === 0 ? (
              <div className="nc-detail-empty">
                <p>No corrective actions have been added.</p>
              </div>
            ) : (
              <div className="corrective-action-list">
                {nonconformity.actions.map((action) => (
                  <CorrectiveActionCard
                    key={action.id}
                    action={action}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="nc-detail-sidebar">
          <section className="nc-detail-card">
            <h2>Status</h2>

            <span
              className={
                'nc-detail-state nc-detail-state--'
                + nonconformity.state.toLowerCase().replace('_', '-')
              }
            >
              {stateLabels[nonconformity.state]}
            </span>

            <p>
              This nonconformity remains active until its corrective
              actions are completed and verified.
            </p>
          </section>

          <section className="nc-detail-card">
            <h2>Activity</h2>
            <p>Audit history will be connected in a later phase.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}