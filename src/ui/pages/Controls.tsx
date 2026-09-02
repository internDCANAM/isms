import {useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Applicability, ControlStatus, Theme} from '../../domain.js';
import '../css/controls.css';

type ControlRow = {
  id: string;
  reference: string;
  title: string;
  purpose: string;
  theme: Theme;
  applicability: Applicability;
  justification: string;
  status: ControlStatus;
  ownerName: string | null;
  implementation: string | null;
  riskCount: number;
  createdAt: string;
};
interface ControlResponse {
  data: ControlRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const emptyControls: ControlRow[] = [];

async function fetchControls(): Promise<ControlResponse> {
  const response = await fetch('/api/v1/controls?page=1&limit=100', {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`Could not load controls (${response.status}).`);
  }

  return await response.json() as ControlResponse;
}



const themeLabels: Record<Theme, string> = {
  [Theme.ORGANIZATIONAL]: 'Organizational',
  [Theme.PEOPLE]: 'People',
  [Theme.PHYSICAL]: 'Physical',
  [Theme.TECHNOLOGICAL]: 'Technological',
};

const statusLabels: Record<ControlStatus, string> = {
  [ControlStatus.NOT_STARTED]: 'Not started',
  [ControlStatus.IN_PROGRESS]: 'In progress',
  [ControlStatus.IMPLEMENTED]: 'Implemented',
  [ControlStatus.VERIFIED]: 'Verified',
};

const applicabilityLabels: Record<Applicability, string> = {
  [Applicability.APPLICABLE]: 'Applicable',
  [Applicability.EXCLUDED]: 'Excluded',
};

export function ControlsPage() {

  const controlQuery = useQuery({
    queryKey: ['controls'],
    queryFn: fetchControls,
  });

  const controls = controlQuery.data?.data ?? emptyControls;
  const [search, setSearch] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<Theme | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] =
    useState<ControlStatus | 'ALL'>('ALL');
  const [selectedApplicability, setSelectedApplicability] =
    useState<Applicability | 'ALL'>('ALL');

  const filteredControls = useMemo(() => {
    const query = search.trim().toLowerCase();

    return controls.filter((control) => {
      const matchesSearch =
        query.length === 0 ||
        control.reference.toLowerCase().includes(query) ||
        control.title.toLowerCase().includes(query) ||
        control.purpose.toLowerCase().includes(query) ||
        (control.ownerName?.toLowerCase().includes(query) ?? false);

      const matchesTheme =
        selectedTheme === 'ALL' || control.theme === selectedTheme;

      const matchesStatus =
        selectedStatus === 'ALL' || control.status === selectedStatus;

      const matchesApplicability =
        selectedApplicability === 'ALL' ||
        control.applicability === selectedApplicability;

      return (
        matchesSearch &&
        matchesTheme &&
        matchesStatus &&
        matchesApplicability
      );
    });
  }, [controls, search, selectedApplicability, selectedStatus, selectedTheme]);

  const applicableCount = controls.filter(
    (control) => control.applicability === Applicability.APPLICABLE
  ).length;

  const implementedCount = controls.filter(
    (control) => control.status === ControlStatus.IMPLEMENTED
  ).length;

  const verifiedCount = controls.filter(
    (control) => control.status === ControlStatus.VERIFIED
  ).length;

  const clearFilters = () => {
    setSearch('');
    setSelectedTheme('ALL');
    setSelectedStatus('ALL');
    setSelectedApplicability('ALL');
  };

  if (controlQuery.isPending) {
    return (
      <main className="controls-page">
        <div className="controls-empty" role="status">
          <h1>Loading controls…</h1>
          <p>Please wait while the controls are loaded.</p>
        </div>
      </main>
    );
  }

  if (controlQuery.isError) {
    return (
      <main className="controls-page">
        <div className="controls-empty" role="alert">
          <h1>Could not load controls</h1>
          <p>{controlQuery.error.message}</p>

          <button
            type="button"
            onClick={() => void controlQuery.refetch()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }
  return (
    <main className="controls-page">
      <header className="controls-header">
        <div>
          <p className="controls-eyebrow">ISO 27001 Annex A</p>
          <h1>Statement of Applicability</h1>
          <p>
            Review applicable controls and monitor their implementation status.
          </p>
        </div>
      </header>

      <section className="controls-summary" aria-label="Controls summary">
        <article className="control-summary-card control-summary-card--total">
          <span>Total controls</span>
          <strong>{controls.length}</strong>
        </article>

        <article className="control-summary-card control-summary-card--applicable">
          <span>Applicable</span>
          <strong>{applicableCount}</strong>
        </article>

        <article className="control-summary-card control-summary-card--implemented">
          <span>Implemented</span>
          <strong>{implementedCount}</strong>
        </article>

        <article className="control-summary-card control-summary-card--verified">
          <span>Verified</span>
          <strong>{verifiedCount}</strong>
        </article>
      </section>

      <section className="controls-register">
        <div className="controls-filters">
          <label>
            <span className="sr-only">Search controls</span>
            <input
              type="search"
              value={search}
              placeholder="Search reference, control, purpose or owner"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label>
            <span className="sr-only">Filter by theme</span>
            <select
              value={selectedTheme}
              onChange={(event) =>
                setSelectedTheme(event.target.value as Theme | 'ALL')
              }
            >
              <option value="ALL">All themes</option>
              {Object.values(Theme).map((theme) => (
                <option key={theme} value={theme}>
                  {themeLabels[theme]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by status</span>
            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as ControlStatus | 'ALL')
              }
            >
              <option value="ALL">All statuses</option>
              {Object.values(ControlStatus).map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by applicability</span>
            <select
              value={selectedApplicability}
              onChange={(event) =>
                setSelectedApplicability(
                  event.target.value as Applicability | 'ALL'
                )
              }
            >
              <option value="ALL">All applicability</option>
              {Object.values(Applicability).map((applicability) => (
                <option key={applicability} value={applicability}>
                  {applicabilityLabels[applicability]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="controls-results">
          <span>
            {filteredControls.length} of {controls.length} controls
          </span>

          <button type="button" className="controls-clear" onClick={clearFilters}>
            Clear filters
          </button>
        </div>

        <div className="controls-table-scroll">
          <table className="controls-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Control</th>
                <th>Theme</th>
                <th>Applicability</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Risks</th>
              </tr>
            </thead>

            <tbody>
              {filteredControls.map((control) => (
                <tr key={control.id}>
                  <td>{control.reference}</td>
                  <td>
                    <strong>{control.title}</strong>
                    <small>{control.purpose}</small>
                  </td>
                  <td>{themeLabels[control.theme]}</td>
                  <td>
                    <span
                      className={`applicability-badge applicability-badge--${control.applicability.toLowerCase()}`}
                    >
                      {applicabilityLabels[control.applicability]}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`control-status control-status--${control.status
                        .toLowerCase()
                        .replace('_', '-')}`}
                    >
                      {statusLabels[control.status]}
                    </span>
                  </td>
                  <td>{control.ownerName ?? 'Unassigned'}</td>
                  <td>{control.riskCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredControls.length === 0 && (
          <div className="controls-empty">
            <h2>
              {controls.length === 0
                ? 'No controls registered'
                : 'No controls found'}
            </h2>

            <p>
              {controls.length === 0
                ? 'The database does not contain any controls yet.'
                : 'Try changing your search or filters.'}
            </p>
            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
}