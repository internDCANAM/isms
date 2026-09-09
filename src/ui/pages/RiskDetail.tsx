import {Link, useParams} from 'react-router-dom';
import {AssessmentPhase, RiskLevel, Theme, TreatmentOption} from '../../domain.js';
import '../css/risk-detail.css';
import {ArrowBack} from '@nine-thirty-five/material-symbols-react/outlined/400';

interface Assessment {
  phase: AssessmentPhase;
  likelihood: number;
  impact: number;
  score: number;
  level: RiskLevel;
  economicImpact: number;
}

interface Treatment {
  id: string;
  option: TreatmentOption;
  action: string;
  plannedDate: string;
  status: 'Planned' | 'In progress' | 'Completed';
}

interface LinkedRecord {
  reference: string;
  name: string;
}

interface RiskDetail {
  id: string;
  reference: string;
  title: string;
  description: string;
  theme: Theme;
  ownerName: string;
  updatedAt: string;
  assessments: Assessment[];
  treatments: Treatment[];
  assets: LinkedRecord[];
  controls: LinkedRecord[];
}

const risk: RiskDetail = {
  id: '1',
  reference: 'R-0001',
  title: 'Unauthorised access to customer information',
  description:
    'An unauthorised person may gain access to customer information '
    + 'because of weak access controls, compromised accounts or '
    + 'unnecessary user permissions.',
  theme: Theme.TECHNOLOGICAL,
  ownerName: 'Emma Lindberg',
  updatedAt: '2026-08-27',

  assessments: [
    {
      phase: AssessmentPhase.INHERENT,
      likelihood: 4,
      impact: 5,
      score: 20,
      level: RiskLevel.CRITICAL,
      economicImpact: 750000,
    },
    {
      phase: AssessmentPhase.RESIDUAL,
      likelihood: 2,
      impact: 4,
      score: 8,
      level: RiskLevel.MEDIUM,
      economicImpact: 250000,
    },
  ],

  treatments: [
    {
      id: 't-1',
      option: TreatmentOption.MODIFY,
      action:
        'Require multi-factor authentication for privileged accounts.',
      plannedDate: '2026-09-15',
      status: 'Completed',
    },
    {
      id: 't-2',
      option: TreatmentOption.MODIFY,
      action:
        'Review user permissions and remove unnecessary access.',
      plannedDate: '2026-09-30',
      status: 'In progress',
    },
    {
      id: 't-3',
      option: TreatmentOption.RETAIN,
      action:
        'Accept the remaining risk after controls are verified.',
      plannedDate: '2026-10-10',
      status: 'Planned',
    },
  ],

  assets: [
    {
      reference: 'A-0012',
      name: 'Customer information database',
    },
    {
      reference: 'A-0021',
      name: 'Customer portal',
    },
  ],

  controls: [
    {
      reference: 'A.5.15',
      name: 'Access control',
    },
    {
      reference: 'A.5.18',
      name: 'Access rights',
    },
    {
      reference: 'A.8.5',
      name: 'Secure authentication',
    },
  ],
};

const levelLabels: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: 'Low',
  [RiskLevel.MEDIUM]: 'Medium',
  [RiskLevel.HIGH]: 'High',
  [RiskLevel.CRITICAL]: 'Critical',
};

const themeLabels: Record<Theme, string> = {
  [Theme.ORGANIZATIONAL]: 'Organizational',
  [Theme.PEOPLE]: 'People',
  [Theme.PHYSICAL]: 'Physical',
  [Theme.TECHNOLOGICAL]: 'Technological',
};

const treatmentLabels: Record<TreatmentOption, string> = {
  [TreatmentOption.MODIFY]: 'Modify',
  [TreatmentOption.RETAIN]: 'Retain',
  [TreatmentOption.AVOID]: 'Avoid',
  [TreatmentOption.SHARE]: 'Share',
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value);
}

function AssessmentCard({
  assessment,
}: {
  assessment: Assessment;
}) {
  const title =
    assessment.phase === AssessmentPhase.INHERENT
      ? 'Inherent assessment'
      : 'Residual assessment';

  return (
    <article className="assessment-card">
      <div className="assessment-card__heading">
        <h3>{title}</h3>

        <span
          className={
            'detail-badge detail-badge--'
            + assessment.level.toLowerCase()
          }
        >
          {levelLabels[assessment.level]}
        </span>
      </div>

      <div className="score-grid">
        <div>
          <span>Likelihood</span>
          <strong>{assessment.likelihood} / 5</strong>
        </div>

        <div>
          <span>Impact</span>
          <strong>{assessment.impact} / 5</strong>
        </div>

        <div>
          <span>Score</span>
          <strong>{assessment.score}</strong>
        </div>
      </div>

      <p className="economic-impact">
        Economic impact:
        <strong>{formatMoney(assessment.economicImpact)}</strong>
      </p>
    </article>
  );
}

export function RiskDetailPage() {
  const {id} = useParams();

  if (id !== risk.id) {
    return (
      <main className="risk-detail-page">
        <Link className="back-link" to="/risks">
          <ArrowBack /> Back to Risk Register
        </Link>

        <section className="detail-empty">
          <h1>Risk details are unavailable</h1>
          <p>
            Detailed mock data currently exists only for R-0001.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="risk-detail-page">
      <Link className="back-link" to="/risks">
        <ArrowBack /> Back to Risk Register
      </Link>

      <header className="detail-header">
        <div>
          <div className="detail-title-meta">
            <span>{risk.reference}</span>

            <span className="detail-badge detail-badge--critical">
              Critical
            </span>
          </div>

          <h1>{risk.title}</h1>
          <p>Last updated: {risk.updatedAt}</p>
        </div>

        <button className="detail-edit-button" type="button">
          Edit risk
        </button>
      </header>

      <div className="detail-layout">
        <div className="detail-main">
          <section className="detail-card">
            <h2>Risk overview</h2>
            <p>{risk.description}</p>

            <dl className="risk-information">
              <div>
                <dt>Theme</dt>
                <dd>{themeLabels[risk.theme]}</dd>
              </div>

              <div>
                <dt>Owner</dt>
                <dd>{risk.ownerName}</dd>
              </div>

              <div>
                <dt>Treatments</dt>
                <dd>{risk.treatments.length}</dd>
              </div>
            </dl>
          </section>

          <section className="detail-section">
            <div className="detail-section__heading">
              <h2>Risk assessments</h2>

              <button type="button">
                Update assessment
              </button>
            </div>

            <div className="assessment-grid">
              {risk.assessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.phase}
                  assessment={assessment}
                />
              ))}
            </div>
          </section>

          <section className="detail-card">
            <div className="detail-section__heading">
              <h2>Risk treatments</h2>

              <button type="button">
                + Add treatment
              </button>
            </div>

            <div className="treatment-list">
              {risk.treatments.map((treatment) => (
                <article
                  className="treatment-item"
                  key={treatment.id}
                >
                  <div className="treatment-item__heading">
                    <span className="treatment-option">
                      {treatmentLabels[treatment.option]}
                    </span>

                    <span className="treatment-status">
                      {treatment.status}
                    </span>
                  </div>

                  <h3>{treatment.action}</h3>

                  <p>
                    Planned date:
                    <strong>{treatment.plannedDate}</strong>
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="detail-sidebar">
          <section className="detail-card">
            <h2>Linked assets</h2>

            {risk.assets.map((asset) => (
              <div
                className="linked-record"
                key={asset.reference}
              >
                <span>{asset.reference}</span>
                <strong>{asset.name}</strong>
              </div>
            ))}
          </section>

          <section className="detail-card">
            <h2>Linked controls</h2>

            {risk.controls.map((control) => (
              <div
                className="linked-record"
                key={control.reference}
              >
                <span>{control.reference}</span>
                <strong>{control.name}</strong>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </main>
  );
}
