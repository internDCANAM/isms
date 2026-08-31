import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {NonconformityState, Theme} from '../../domain.js';
import '../css/nonconformity-list.css';

interface NonconformityRow {
  id: string;
  reference: string;
  title: string;
  theme: Theme;
  state: NonconformityState;
  raisedByName: string | null;
  raisedAt: string;
  closedAt: string | null;
  actionCount: number;
}

const nonconformities: NonconformityRow[] = [
  {
    id: '1',
    reference: 'NC-0001',
    title: 'Access review was not completed on time',
    theme: Theme.ORGANIZATIONAL,
    state: NonconformityState.OPEN,
    raisedByName: 'Emma Lindberg',
    raisedAt: '2026-08-10',
    closedAt: null,
    actionCount: 2,
  },
  {
    id: '2',
    reference: 'NC-0002',
    title: 'Backup restoration test was unsuccessful',
    theme: Theme.TECHNOLOGICAL,
    state: NonconformityState.IN_PROGRESS,
    raisedByName: 'Johan Berg',
    raisedAt: '2026-08-14',
    closedAt: null,
    actionCount: 3,
  },
  {
    id: '3',
    reference: 'NC-0003',
    title: 'Security training records were incomplete',
    theme: Theme.PEOPLE,
    state: NonconformityState.IN_PROGRESS,
    raisedByName: 'Sara Nilsson',
    raisedAt: '2026-08-18',
    closedAt: null,
    actionCount: 2,
  },
  {
    id: '4',
    reference: 'NC-0004',
    title: 'Visitor log was not maintained correctly',
    theme: Theme.PHYSICAL,
    state: NonconformityState.CLOSED,
    raisedByName: 'Dennis Karlsson',
    raisedAt: '2026-07-20',
    closedAt: '2026-08-12',
    actionCount: 1,
  },
  {
    id: '5',
    reference: 'NC-0005',
    title: 'Supplier security review was missing',
    theme: Theme.ORGANIZATIONAL,
    state: NonconformityState.OPEN,
    raisedByName: null,
    raisedAt: '2026-08-22',
    closedAt: null,
    actionCount: 0,
  },
];

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

function StateBadge({
  state,
}: {
  state: NonconformityState;
}) {
  return (
    <span
      className={
        'nc-badge nc-badge--'
        + state.toLowerCase().replace('_', '-')
      }
    >
      {stateLabels[state]}
    </span>
  );
}

export function NonconformityListPage() {
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] =
    useState<NonconformityState | 'ALL'>('ALL');
  const [selectedTheme, setSelectedTheme] =
    useState<Theme | 'ALL'>('ALL');

  const filteredRows = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return nonconformities.filter((item) => {
      const searchableText = [
        item.reference,
        item.title,
        item.raisedByName ?? '',
        themeLabels[item.theme],
        stateLabels[item.state],
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        searchableText.includes(searchText);

      const matchesState =
        selectedState === 'ALL'
        || item.state === selectedState;

      const matchesTheme =
        selectedTheme === 'ALL'
        || item.theme === selectedTheme;

      return matchesSearch && matchesState && matchesTheme;
    });
  }, [search, selectedState, selectedTheme]);

  function clearFilters() {
    setSearch('');
    setSelectedState('ALL');
    setSelectedTheme('ALL');
  }

  return (
    <main className="nc-page">
      <header className="nc-page__header">
        <div>
          <p className="nc-eyebrow">
            Continual improvement
          </p>

          <h1>Nonconformities</h1>

          <p>
            Record, investigate and follow up ISMS
            nonconformities.
          </p>
        </div>

        <button className="nc-new-button" type="button">
          + New nonconformity
        </button>
      </header>

      <section
        className="nc-summary"
        aria-label="Nonconformity summary"
      >
        <article className="nc-summary-card nc-summary-card--total">
          <span>Total</span>
          <strong>{nonconformities.length}</strong>
        </article>

        {Object.values(NonconformityState).map((state) => (
          <article
            className={
              'nc-summary-card nc-summary-card--'
              + state.toLowerCase().replace('_', '-')
            }
            key={state}
          >
            <span>{stateLabels[state]}</span>

            <strong>
              {
                nonconformities.filter(
                  (item) => item.state === state
                ).length
              }
            </strong>
          </article>
        ))}
      </section>

      <section className="nc-register">
        <div className="nc-filters">
          <label>
            <span className="sr-only">
              Search nonconformities
            </span>

            <input
              type="search"
              placeholder="Search reference, title, owner or theme"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </label>

          <label>
            <span className="sr-only">
              Filter by state
            </span>

            <select
              value={selectedState}
              onChange={(event) =>
                setSelectedState(
                  event.target.value as NonconformityState | 'ALL'
                )
              }
            >
              <option value="ALL">All states</option>

              {Object.values(NonconformityState).map(
                (state) => (
                  <option key={state} value={state}>
                    {stateLabels[state]}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span className="sr-only">
              Filter by theme
            </span>

            <select
              value={selectedTheme}
              onChange={(event) =>
                setSelectedTheme(
                  event.target.value as Theme | 'ALL'
                )
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
        </div>

        <div className="nc-results">
          <p>
            <strong>{filteredRows.length}</strong>
            {' '}of {nonconformities.length} nonconformities
          </p>

          {(search
            || selectedState !== 'ALL'
            || selectedTheme !== 'ALL') && (
            <button
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredRows.length === 0 ? (
          <div className="nc-empty">
            <h2>No matching nonconformities</h2>
            <p>
              Try another search or clear the filters.
            </p>
          </div>
        ) : (
          <div className="nc-table-scroll">
            <table className="nc-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Nonconformity</th>
                  <th>Theme</th>
                  <th>State</th>
                  <th>Raised by</th>
                  <th>Raised at</th>
                  <th>Actions</th>
                  <th>
                    <span className="sr-only">
                      Open
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.reference}</td>

                    <td>
                      <Link
                        to={`/nonconformities/${item.id}`}
                      >
                        {item.title}
                      </Link>
                    </td>

                    <td>{themeLabels[item.theme]}</td>

                    <td>
                      <StateBadge state={item.state} />
                    </td>

                    <td>
                      {item.raisedByName ?? 'Unassigned'}
                    </td>

                    <td>{item.raisedAt}</td>

                    <td>{item.actionCount}</td>

                    <td>
                      <Link
                        to={`/nonconformities/${item.id}`}
                        aria-label={`Open ${item.reference}`}
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