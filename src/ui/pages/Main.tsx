import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {AssetCategory,
  ControlStatus,
  DocumentStatus,
  NonconformityState,
  RiskLevel,} from '../../domain.js';
import '../css/dashboard.css';

interface PageResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RiskMetric {
  inherentLevel: RiskLevel | null;
}

interface NonconformityMetric {
  state: NonconformityState;
}

interface AssetMetric {
  category: AssetCategory;
}

interface ControlMetric {
  status: ControlStatus;
}

interface DocumentMetric {
  status: DocumentStatus;
}

async function fetchPage<T>(path: string): Promise<PageResponse<T>> {
  const response = await fetch(`${path}?page=1&limit=100`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return await response.json() as PageResponse<T>;
}

export function MainPage() {
  const riskQuery = useQuery({
    queryKey: ['risks', 'dashboard'],
    queryFn: () => fetchPage<RiskMetric>('/api/v1/risks'),
  });

  const nonconformityQuery = useQuery({
    queryKey: ['nonconformities', 'dashboard'],
    queryFn: () =>
      fetchPage<NonconformityMetric>('/api/v1/nonconformities'),
  });

  const assetQuery = useQuery({
    queryKey: ['assets', 'dashboard'],
    queryFn: () => fetchPage<AssetMetric>('/api/v1/assets'),
  });

  const controlQuery = useQuery({
    queryKey: ['controls', 'dashboard'],
    queryFn: () => fetchPage<ControlMetric>('/api/v1/controls'),
  });

  const documentQuery = useQuery({
    queryKey: ['documents', 'dashboard'],
    queryFn: () => fetchPage<DocumentMetric>('/api/v1/documents'),
  });

  const queries = [
    riskQuery,
    nonconformityQuery,
    assetQuery,
    controlQuery,
    documentQuery,
  ];

  const isLoading = queries.some((query) => query.isPending);
  const hasError = queries.some((query) => query.isError);

  const risks = riskQuery.data?.data ?? [];
  const nonconformities = nonconformityQuery.data?.data ?? [];
  const assets = assetQuery.data?.data ?? [];
  const controls = controlQuery.data?.data ?? [];
  const documents = documentQuery.data?.data ?? [];

  const criticalRiskCount = risks.filter(
    (risk) => risk.inherentLevel === RiskLevel.CRITICAL
  ).length;

  const openNonconformityCount = nonconformities.filter(
    (item) => item.state === NonconformityState.OPEN
  ).length;

  const assetCategoryCount =
    new Set(assets.map((asset) => asset.category)).size;

  const implementedControlCount = controls.filter(
    (control) => control.status === ControlStatus.IMPLEMENTED
  ).length;

  const approvedDocumentCount = documents.filter(
    (document) => document.status === DocumentStatus.APPROVED
  ).length;

  const reviewDocumentCount = documents.filter(
    (document) => document.status === DocumentStatus.IN_REVIEW
  ).length;

  function displayTotal(
    query: typeof riskQuery,
    fallback: number
  ): number | string {
    if (query.isPending) {
      return '…';
    }

    if (query.isError) {
      return '—';
    }

    return query.data?.pagination.total ?? fallback;
  }

  const modules = [
    {
      to: '/risks',
      label: 'Risk register',
      description: 'Identify, assess and treat information-security risks.',
      count: displayTotal(riskQuery, risks.length),
      detail: `${criticalRiskCount} critical risks`,
      color: 'blue',
    },
    {
      to: '/nonconformities',
      label: 'Nonconformities',
      description: 'Investigate findings and follow corrective actions.',
      count: nonconformityQuery.isPending
        ? '…'
        : nonconformityQuery.isError
          ? '—'
          : nonconformityQuery.data?.pagination.total
            ?? nonconformities.length,
      detail: `${openNonconformityCount} currently open`,
      color: 'orange',
    },
    {
      to: '/assets',
      label: 'Asset inventory',
      description: 'Review information, systems, people and facilities.',
      count: assetQuery.isPending
        ? '…'
        : assetQuery.isError
          ? '—'
          : assetQuery.data?.pagination.total ?? assets.length,
      detail: `${assetCategoryCount} asset categories`,
      color: 'cyan',
    },
    {
      to: '/controls',
      label: 'Controls',
      description: 'Monitor the Statement of Applicability.',
      count: controlQuery.isPending
        ? '…'
        : controlQuery.isError
          ? '—'
          : controlQuery.data?.pagination.total ?? controls.length,
      detail: `${implementedControlCount} implemented`,
      color: 'purple',
    },
    {
      to: '/documents',
      label: 'Documents',
      description: 'Access controlled ISMS policies and procedures.',
      count: documentQuery.isPending
        ? '…'
        : documentQuery.isError
          ? '—'
          : documentQuery.data?.pagination.total ?? documents.length,
      detail: `${approvedDocumentCount} approved`,
      color: 'pink',
    },
  ] as const;

  const statusText = hasError
    ? 'Some data is unavailable'
    : isLoading
      ? 'Loading current status'
      : 'Active and monitored';

  return (
    <main className="dashboard-page">
      <header className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">
            Information Security Management
          </p>

          <h1>ISMS dashboard</h1>

          <p>
            Get an overview of risks, controls, assets and improvement work.
          </p>
        </div>

        <div className="dashboard-health">
          <span className="dashboard-health__dot" />

          <span>
            <strong>ISMS status</strong>
            <small>{statusText}</small>
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
              className={
                `dashboard-module dashboard-module--${module.color}`
              }
            >
              <span className="dashboard-module__label">
                {module.label}
              </span>

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
              <span className="dashboard-attention__number">
                {criticalRiskCount}
              </span>

              <span>
                <strong>Critical risks</strong>
                <small>Require immediate treatment</small>
              </span>

              <span>→</span>
            </Link>

            <Link
              to="/nonconformities"
              className="dashboard-attention__item"
            >
              <span className="dashboard-attention__number">
                {openNonconformityCount}
              </span>

              <span>
                <strong>Open nonconformities</strong>
                <small>Corrective actions may be pending</small>
              </span>

              <span>→</span>
            </Link>

            <Link
              to="/documents"
              className="dashboard-attention__item"
            >
              <span className="dashboard-attention__number">
                {reviewDocumentCount}
              </span>

              <span>
                <strong>Documents in review</strong>
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
            <article>
              <span>API</span>

              <div>
                <strong>Dashboard connected to live registers</strong>
                <small>
                  Audit-event integration will be added in a later phase.
                </small>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}