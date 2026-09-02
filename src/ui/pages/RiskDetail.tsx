import {useQuery} from '@tanstack/react-query';
import {Link, useParams} from 'react-router-dom';
import {AssessmentPhase, RiskLevel, Theme, TreatmentOption} from '../../domain.js';
import type {RiskDetail} from '../../api/risk.js';
import '../css/risk-detail.css';

type Assessment = RiskDetail['assessments'][number];
type Treatment = RiskDetail['treatments'][number];

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

function formatMoney(value: number | null) {
  if (value === null) {
    return 'Not recorded';
  }

  return new Intl.NumberFormat('en-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function formatDate(value: string | null) {
  if (value === null) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en-SE').format(new Date(value));
}

function treatmentStatus(treatment: Treatment) {
  return treatment.actualDate === null ? 'Planned' : 'Completed';
}

async function fetchRisk(id: string): Promise<RiskDetail> {
  const response = await fetch(`/api/v1/risks/${id}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    let message = `Could not load risk (${response.status}).`;

    try {
      const body = await response.json() as { error?: string };
      message = body.error ?? message;
    } catch {
      // Keep the fallback message when the response is not JSON.
    }

    throw new Error(message);
  }

  return await response.json() as RiskDetail;
}

function AssessmentCard({assessment}: { assessment: Assessment }) {
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
        <strong>{formatMoney(assessment.economicImpactMinor)}</strong>
      </p>
    </article>
  );
}

export function RiskDetailPage() {
  const {id} = useParams();

  const riskQuery = useQuery({
    queryKey: ['risk', id],
    queryFn: () => {
      if (!id) {
        throw new Error('The risk ID is missing.');
      }

      return fetchRisk(id);
    },
    enabled: Boolean(id),
  });

  if (!id) {
    return (
      <main className="risk-detail-page">
        <Link className="back-link" to="/risks">
          ← Back to Risk Register
        </Link>

        <section className="detail-empty">
          <h1>Risk details are unavailable</h1>
          <p>The risk ID is missing from the address.</p>
        </section>
      </main>
    );
  }

  if (riskQuery.isPending) {
    return (
      <main className="risk-detail-page">
        <Link className="back-link" to="/risks">
          ← Back to Risk Register
        </Link>

        <section className="detail-empty" role="status">
          <h1>Loading risk details…</h1>
          <p>Please wait while the risk is loaded.</p>
        </section>
      </main>
    );
  }

  if (riskQuery.isError) {
    return (
      <main className="risk-detail-page">
        <Link className="back-link" to="/risks">
          ← Back to Risk Register
        </Link>

        <section className="detail-empty" role="alert">
          <h1>Risk details are unavailable</h1>
          <p>{riskQuery.error.message}</p>

          <button
            className="detail-edit-button"
            type="button"
            onClick={() => void riskQuery.refetch()}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  const risk = riskQuery.data;

  return (
    <main className="risk-detail-page">
      <Link className="back-link" to="/risks">
        ← Back to Risk Register
      </Link>

      <header className="detail-header">
        <div>
          <div className="detail-title-meta">
            <span>{risk.reference}</span>

            {risk.inherentLevel ? (
              <span
                className={
                  'detail-badge detail-badge--'
                  + risk.inherentLevel.toLowerCase()
                }
              >
                {levelLabels[risk.inherentLevel]}
              </span>
            ) : (
              <span className="detail-badge">Not assessed</span>
            )}
          </div>

          <h1>{risk.title}</h1>
          <p>Last updated: {formatDate(risk.updatedAt)}</p>
        </div>

        <button
          className="detail-edit-button"
          type="button"
          disabled
          title="Editing will be added in a later phase"
        >
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
                <dd>{risk.ownerName ?? 'Unassigned'}</dd>
              </div>

              <div>
                <dt>Treatments</dt>
                <dd>{risk.treatmentCount}</dd>
              </div>
            </dl>
          </section>

          <section className="detail-section">
            <div className="detail-section__heading">
              <h2>Risk assessments</h2>

              <button type="button" disabled>
                Update assessment
              </button>
            </div>

            {risk.assessments.length === 0 ? (
              <div className="detail-empty">
                <p>No assessments have been recorded.</p>
              </div>
            ) : (
              <div className="assessment-grid">
                {risk.assessments.map((assessment) => (
                  <AssessmentCard
                    key={assessment.id}
                    assessment={assessment}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="detail-card">
            <div className="detail-section__heading">
              <h2>Risk treatments</h2>

              <button type="button" disabled>
                + Add treatment
              </button>
            </div>

            {risk.treatments.length === 0 ? (
              <div className="detail-empty">
                <p>No treatments have been added.</p>
              </div>
            ) : (
              <div className="treatment-list">
                {risk.treatments.map((treatment) => (
                  <article className="treatment-item" key={treatment.id}>
                    <div className="treatment-item__heading">
                      <span className="treatment-option">
                        {treatmentLabels[treatment.option]}
                      </span>

                      <span className="treatment-status">
                        {treatmentStatus(treatment)}
                      </span>
                    </div>

                    <h3>{treatment.action}</h3>

                    <p>
                      Planned date:
                      <strong>{formatDate(treatment.plannedDate)}</strong>
                    </p>

                    {treatment.actualDate && (
                      <p>
                        Completed:
                        <strong>{formatDate(treatment.actualDate)}</strong>
                      </p>
                    )}

                    {treatment.note && <p>{treatment.note}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="detail-sidebar">
          <section className="detail-card">
            <h2>Linked assets</h2>

            {risk.assetIds.length === 0 ? (
              <p className="note">No linked assets.</p>
            ) : (
              risk.assetIds.map((assetId) => (
                <div className="linked-record" key={assetId}>
                  <span>Asset</span>
                  <strong>{assetId}</strong>
                </div>
              ))
            )}
          </section>

          <section className="detail-card">
            <h2>Linked controls</h2>

            {risk.controlIds.length === 0 ? (
              <p className="note">No linked controls.</p>
            ) : (
              risk.controlIds.map((controlId) => (
                <div className="linked-record" key={controlId}>
                  <span>Control</span>
                  <strong>{controlId}</strong>
                </div>
              ))
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}