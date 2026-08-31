import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {RiskLevel, Theme} from '../../domain.js';
import '../css/risk-register.css';

interface RiskRow {
  id: string;
  reference: string;
  title: string;
  theme: Theme;
  ownerName: string | null;
  inherentLevel: RiskLevel;
  residualLevel: RiskLevel | null;
  treatmentCount: number;
}

const risks: RiskRow[] = [
  {
    id: '1',
    reference: 'R-0001',
    title: 'Unauthorised access to customer information',
    theme: Theme.TECHNOLOGICAL,
    ownerName: 'Emma Lindberg',
    inherentLevel: RiskLevel.CRITICAL,
    residualLevel: RiskLevel.MEDIUM,
    treatmentCount: 3,
  },
  {
    id: '2',
    reference: 'R-0002',
    title: 'Phishing attack compromises employee accounts',
    theme: Theme.PEOPLE,
    ownerName: 'Johan Berg',
    inherentLevel: RiskLevel.HIGH,
    residualLevel: RiskLevel.MEDIUM,
    treatmentCount: 2,
  },
  {
    id: '3',
    reference: 'R-0003',
    title: 'Critical service unavailable after system failure',
    theme: Theme.TECHNOLOGICAL,
    ownerName: 'Sara Nilsson',
    inherentLevel: RiskLevel.HIGH,
    residualLevel: RiskLevel.LOW,
    treatmentCount: 4,
  },
  {
    id: '4',
    reference: 'R-0004',
    title: 'Supplier does not meet security requirements',
    theme: Theme.ORGANIZATIONAL,
    ownerName: 'Klas Andersson',
    inherentLevel: RiskLevel.MEDIUM,
    residualLevel: RiskLevel.LOW,
    treatmentCount: 1,
  },
  {
    id: '5',
    reference: 'R-0005',
    title: 'Sensitive documents accessed without permission',
    theme: Theme.PHYSICAL,
    ownerName: null,
    inherentLevel: RiskLevel.MEDIUM,
    residualLevel: null,
    treatmentCount: 0,
  },
];

const themeLabels: Record<Theme, string> = {
  [Theme.ORGANIZATIONAL]: 'Organizational',
  [Theme.PEOPLE]: 'People',
  [Theme.PHYSICAL]: 'Physical',
  [Theme.TECHNOLOGICAL]: 'Technological',
};

const levelLabels: Record<RiskLevel, string> = {
  [RiskLevel.CRITICAL]: 'Critical',
  [RiskLevel.HIGH]: 'High',
  [RiskLevel.MEDIUM]: 'Medium',
  [RiskLevel.LOW]: 'Low',
};

function RiskBadge({level}: { level: RiskLevel | null }) {
  if (!level) {
    return <span className="note">Not assessed</span>;
  }

  return (
    <span className={`risk-badge risk-badge--${level.toLowerCase()}`}>
      {levelLabels[level]}
    </span>
  );
}

export function RiskRegisterPage() {
  const [search, setSearch] = useState('');
  const [selectedTheme, setSelectedTheme] =
    useState<Theme | 'ALL'>('ALL');
  const [selectedLevel, setSelectedLevel] =
    useState<RiskLevel | 'ALL'>('ALL');

  const filteredRisks = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return risks.filter((risk) => {
      const searchableText = [
        risk.reference,
        risk.title,
        risk.ownerName ?? '',
        themeLabels[risk.theme],
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchableText.includes(searchText);
      const matchesTheme =
        selectedTheme === 'ALL' || risk.theme === selectedTheme;
      const matchesLevel =
        selectedLevel === 'ALL' ||
        risk.inherentLevel === selectedLevel;

      return matchesSearch && matchesTheme && matchesLevel;
    });
  }, [search, selectedLevel, selectedTheme]);

  function clearFilters() {
    setSearch('');
    setSelectedTheme('ALL');
    setSelectedLevel('ALL');
  }

  return (
    <main className="risk-page">
      <header className="risk-page__header">
        <div>
          <p className="eyebrow">Risk management</p>
          <h1>Risk register</h1>
          <p className="note">
            Identify, assess and follow up information-security risks.
          </p>
        </div>

        <button className="button" type="button">
          + New risk
        </button>
      </header>

      <section className="risk-summary" aria-label="Risk summary">
        <article className="summary-card">
          <span>Total risks</span>
          <strong>{risks.length}</strong>
        </article>

        {Object.values(RiskLevel).map((level) => (
          <article
            className={`summary-card summary-card--${level.toLowerCase()}`}
            key={level}
          >
            <span>{levelLabels[level]}</span>
            <strong>
              {risks.filter((risk) => risk.inherentLevel === level).length}
            </strong>
          </article>
        ))}
      </section>

      <section className="risk-register">
        <div className="risk-filters">
          <label>
            <span className="sr-only">Search risks</span>
            <input
              type="search"
              placeholder="Search risk, reference, owner or theme"
              value={search}
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
            <span className="sr-only">Filter by risk level</span>
            <select
              value={selectedLevel}
              onChange={(event) =>
                setSelectedLevel(
                  event.target.value as RiskLevel | 'ALL'
                )
              }
            >
              <option value="ALL">All levels</option>

              {Object.values(RiskLevel).map((level) => (
                <option key={level} value={level}>
                  {levelLabels[level]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="risk-results">
          <p>
            <strong>{filteredRisks.length}</strong> of {risks.length} risks
          </p>

          {(search ||
            selectedTheme !== 'ALL' ||
            selectedLevel !== 'ALL') && (
            <button
              className="text-button"
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredRisks.length === 0 ? (
          <div className="empty-state">
            <h2>No matching risks</h2>
            <p className="note">
              Try another search or clear the selected filters.
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="risk-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Risk</th>
                  <th>Theme</th>
                  <th>Owner</th>
                  <th>Inherent</th>
                  <th>Residual</th>
                  <th>Treatments</th>
                  <th>
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRisks.map((risk) => (
                  <tr key={risk.id}>
                    <td>{risk.reference}</td>

                    <td>
                      <Link to={`/risks/${risk.id}`}>
                        {risk.title}
                      </Link>
                    </td>

                    <td>{themeLabels[risk.theme]}</td>

                    <td>
                      {risk.ownerName ?? (
                        <span className="note">Unassigned</span>
                      )}
                    </td>

                    <td>
                      <RiskBadge level={risk.inherentLevel} />
                    </td>

                    <td>
                      <RiskBadge level={risk.residualLevel} />
                    </td>

                    <td>{risk.treatmentCount}</td>

                    <td>
                      <Link
                        to={`/risks/${risk.id}`}
                        aria-label={`Open ${risk.reference}`}
                      >
                        →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}