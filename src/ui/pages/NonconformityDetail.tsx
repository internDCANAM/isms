import {Link, useParams} from 'react-router-dom';
import {NonconformityState, Theme} from '../../domain.js';
import '../css/nonconformity-detail.css';
import {ArrowBack} from '@nine-thirty-five/material-symbols-react/outlined/400';

interface CorrectiveAction {
  id: string;
  description: string;
  rootCause: string | null;
  assignedToName: string | null;
  dueDate: string | null;
  completedAt: string | null;
}

interface NonconformityDetail {
  id: string;
  reference: string;
  title: string;
  description: string;
  theme: Theme;
  state: NonconformityState;
  raisedByName: string | null;
  raisedAt: string;
  updatedAt: string;
  closedAt: string | null;
  actions: CorrectiveAction[];
}

const nonconformity: NonconformityDetail = {
  id: '1',
  reference: 'NC-0001',
  title: 'Access review was not completed on time',
  description:
    'The quarterly access review was not completed before '
    + 'the planned deadline. Several user accounts were not '
    + 'reviewed according to the access-control procedure.',
  theme: Theme.ORGANIZATIONAL,
  state: NonconformityState.OPEN,
  raisedByName: 'Emma Lindberg',
  raisedAt: '2026-08-10',
  updatedAt: '2026-08-25',
  closedAt: null,

  actions: [
    {
      id: 'action-1',
      description:
        'Complete the delayed access review for all active users.',
      rootCause:
        'The review responsibility was not clearly assigned.',
      assignedToName: 'Johan Berg',
      dueDate: '2026-09-10',
      completedAt: null,
    },
    {
      id: 'action-2',
      description:
        'Create automatic reminders before each review deadline.',
      rootCause:
        'The existing process did not include reminders.',
      assignedToName: 'Sara Nilsson',
      dueDate: '2026-09-20',
      completedAt: null,
    },
  ],
};

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

function ActionStatus({
  completedAt,
}: {
  completedAt: string | null;
}) {
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

export function NonconformityDetailPage() {
  const {id} = useParams();

  if (id !== nonconformity.id) {
    return (
      <main className="nc-detail-page">
        <Link className="nc-back-link" to="/nonconformities">
          <ArrowBack /> Back to Nonconformities
        </Link>

        <section className="nc-detail-empty">
          <h1>Nonconformity details are unavailable</h1>

          <p>
            Detailed mock data currently exists only for NC-0001.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="nc-detail-page">
      <Link className="nc-back-link" to="/nonconformities">
        <ArrowBack /> Back to Nonconformities
      </Link>

      <header className="nc-detail-header">
        <div>
          <div className="nc-detail-title-meta">
            <span>{nonconformity.reference}</span>

            <span
              className={
                'nc-detail-state nc-detail-state--'
                + nonconformity.state
                  .toLowerCase()
                  .replace('_', '-')
              }
            >
              {stateLabels[nonconformity.state]}
            </span>
          </div>

          <h1>{nonconformity.title}</h1>

          <p>
            Last updated: {nonconformity.updatedAt}
          </p>
        </div>

        <button className="nc-edit-button" type="button">
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
                <dd>
                  {nonconformity.raisedByName ?? 'Unassigned'}
                </dd>
              </div>

              <div>
                <dt>Raised at</dt>
                <dd>{nonconformity.raisedAt}</dd>
              </div>

              <div>
                <dt>Actions</dt>
                <dd>{nonconformity.actions.length}</dd>
              </div>
            </dl>
          </section>

          <section className="nc-detail-card">
            <div className="nc-detail-section-heading">
              <div>
                <p className="nc-detail-eyebrow">
                  Clause 10.2
                </p>

                <h2>Corrective actions</h2>
              </div>

              <button type="button">
                + Add action
              </button>
            </div>

            <div className="corrective-action-list">
              {nonconformity.actions.map((action) => (
                <article
                  className="corrective-action"
                  key={action.id}
                >
                  <div className="corrective-action__heading">
                    <h3>{action.description}</h3>

                    <ActionStatus
                      completedAt={action.completedAt}
                    />
                  </div>

                  <div className="root-cause">
                    <span>Root cause</span>

                    <p>
                      {action.rootCause ?? 'Not recorded'}
                    </p>
                  </div>

                  <dl className="action-information">
                    <div>
                      <dt>Assigned to</dt>
                      <dd>
                        {
                          action.assignedToName
                          ?? 'Unassigned'
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>Due date</dt>
                      <dd>{action.dueDate ?? 'Not set'}</dd>
                    </div>

                    <div>
                      <dt>Completed</dt>
                      <dd>
                        {
                          action.completedAt
                          ?? 'Not completed'
                        }
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="nc-detail-sidebar">
          <section className="nc-detail-card">
            <h2>Status</h2>

            <span
              className={
                'nc-detail-state nc-detail-state--'
                + nonconformity.state
                  .toLowerCase()
                  .replace('_', '-')
              }
            >
              {stateLabels[nonconformity.state]}
            </span>

            <p>
              This nonconformity remains open until all
              corrective actions are completed and verified.
            </p>
          </section>

          <section className="nc-detail-card">
            <h2>Activity</h2>

            <p>
              Audit history will be connected when API
              integration is ready.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
