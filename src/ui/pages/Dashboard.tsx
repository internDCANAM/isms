import {Link} from 'react-router-dom';
import '../css/dashboard.css';

const modules = [
  {
    to: '/risks',
    label: 'Risk register',
    description: 'Identify, assess and treat information-security risks.',
    count: 5,
    detail: '1 critical risk',
    color: 'blue',
  },
  {
    to: '/nonconformities',
    label: 'Nonconformities',
    description: 'Investigate findings and follow corrective actions.',
    count: 5,
    detail: '2 currently open',
    color: 'orange',
  },
  {
    to: '/assets',
    label: 'Asset inventory',
    description: 'Review information, systems, people and facilities.',
    count: 6,
    detail: '4 asset categories',
    color: 'cyan',
  },
  {
    to: '/controls',
    label: 'Controls',
    description: 'Monitor the Statement of Applicability.',
    count: 6,
    detail: '3 implemented',
    color: 'purple',
  },
  {
    to: '/documents',
    label: 'Documents',
    description: 'Access controlled ISMS policies and procedures.',
    count: 6,
    detail: '3 approved',
    color: 'pink',
  },
] as const;

const activities = [
  {
    reference: 'R-0001',
    title: 'Customer-information risk updated',
    time: 'Today',
  },
  {
    reference: 'NC-0001',
    title: 'Corrective action assigned',
    time: 'Yesterday',
  },
  {
    reference: 'DOC-0003',
    title: 'Incident Response Plan sent for review',
    time: '2 days ago',
  },
] as const;

export function DashboardPage() {
  return (
    <main className="dashboard-page">
      <header className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Information Security Management</p>
          <h1>ISMS dashboard</h1>
          <p>
            Get an overview of risks, controls, assets and improvement work.
          </p>
        </div>

        <div className="dashboard-health">
          <span className="dashboard-health__dot" />
          <span>
            <strong>ISMS status</strong>
            <small>Active and monitored</small>
          </span>
        </div>
      </header>

      <section>
        <div className="dashboard-section-heading">
          <div>
            <h2>Management overview</h2>
            <p>Select an area to review more information.</p>
          </div>
        </div>

        <div className="dashboard-modules">
          {modules.map((module) => (
            <Link
              key={module.to}
              to={module.to}
              className={`dashboard-module dashboard-module--${module.color}`}
            >
              <span className="dashboard-module__label">{module.label}</span>
              <strong>{module.count}</strong>
              <p>{module.description}</p>
              <small>{module.detail}</small>
              <span className="dashboard-module__open">Open →</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-panel">
          <div className="dashboard-section-heading">
            <div>
              <h2>Attention required</h2>
              <p>Items requiring follow-up.</p>
            </div>
          </div>

          <div className="dashboard-attention">
            <Link to="/risks" className="dashboard-attention__item">
              <span className="dashboard-attention__number">1</span>
              <span>
                <strong>Critical risk</strong>
                <small>Requires immediate treatment</small>
              </span>
              <span>→</span>
            </Link>

            <Link to="/nonconformities" className="dashboard-attention__item">
              <span className="dashboard-attention__number">2</span>
              <span>
                <strong>Open nonconformities</strong>
                <small>Corrective actions are pending</small>
              </span>
              <span>→</span>
            </Link>

            <Link to="/documents" className="dashboard-attention__item">
              <span className="dashboard-attention__number">1</span>
              <span>
                <strong>Document in review</strong>
                <small>Waiting for approval</small>
              </span>
              <span>→</span>
            </Link>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-section-heading">
            <div>
              <h2>Recent activity</h2>
              <p>Latest changes across the ISMS.</p>
            </div>
          </div>

          <div className="dashboard-activity">
            {activities.map((activity) => (
              <article key={activity.reference}>
                <span>{activity.reference}</span>
                <div>
                  <strong>{activity.title}</strong>
                  <small>{activity.time}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}