import {useMemo, useState} from 'react';
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

const controls: ControlRow[] = [
  {
    id: 'control-1',
    reference: 'A.5.1',
    title: 'Policies for information security',
    purpose: 'Provide management direction for information security.',
    theme: Theme.ORGANIZATIONAL,
    applicability: Applicability.APPLICABLE,
    justification: 'Required to establish the ISMS policy framework.',
    status: ControlStatus.IMPLEMENTED,
    ownerName: 'Emma Lindberg',
    implementation: 'Information-security policies are approved and reviewed annually.',
    riskCount: 2,
    createdAt: '2026-07-10',
  },
  {
    id: 'control-2',
    reference: 'A.5.15',
    title: 'Access control',
    purpose: 'Protect information through controlled access.',
    theme: Theme.ORGANIZATIONAL,
    applicability: Applicability.APPLICABLE,
    justification: 'Required for systems containing confidential information.',
    status: ControlStatus.VERIFIED,
    ownerName: 'Johan Berg',
    implementation: 'Role-based access and quarterly access reviews are active.',
    riskCount: 4,
    createdAt: '2026-07-12',
  },
  {
    id: 'control-3',
    reference: 'A.5.18',
    title: 'Access rights',
    purpose: 'Manage the provisioning and removal of access rights.',
    theme: Theme.ORGANIZATIONAL,
    applicability: Applicability.APPLICABLE,
    justification: 'Reduces unauthorised access risks.',
    status: ControlStatus.IN_PROGRESS,
    ownerName: 'Emma Lindberg',
    implementation: 'The joiner, mover and leaver process is being documented.',
    riskCount: 3,
    createdAt: '2026-07-15',
  },
  {
    id: 'control-4',
    reference: 'A.6.3',
    title: 'Information-security awareness',
    purpose: 'Ensure personnel understand their security responsibilities.',
    theme: Theme.PEOPLE,
    applicability: Applicability.APPLICABLE,
    justification: 'All employees handle company information.',
    status: ControlStatus.IMPLEMENTED,
    ownerName: 'Sara Nilsson',
    implementation: 'Annual training and phishing exercises are provided.',
    riskCount: 2,
    createdAt: '2026-07-18',
  },
  {
    id: 'control-5',
    reference: 'A.7.4',
    title: 'Physical security monitoring',
    purpose: 'Monitor premises for unauthorised physical access.',
    theme: Theme.PHYSICAL,
    applicability: Applicability.EXCLUDED,
    justification: 'The office building provides centrally managed monitoring.',
    status: ControlStatus.NOT_STARTED,
    ownerName: null,
    implementation: null,
    riskCount: 0,
    createdAt: '2026-07-20',
  },
  {
    id: 'control-6',
    reference: 'A.8.13',
    title: 'Information backup',
    purpose: 'Protect information against loss or destruction.',
    theme: Theme.TECHNOLOGICAL,
    applicability: Applicability.APPLICABLE,
    justification: 'Backups are required for critical systems and information.',
    status: ControlStatus.IMPLEMENTED,
    ownerName: 'Dennis Karlsson',
    implementation: 'Encrypted daily backups are retained and regularly tested.',
    riskCount: 3,
    createdAt: '2026-07-22',
  },
];

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
  }, [search, selectedApplicability, selectedStatus, selectedTheme]);

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
            <h2>No controls found</h2>
            <p>Try changing your search or filters.</p>
            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
}