import {useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
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

interface NonconformityResponse {
  data: NonconformityRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const emptyNonconformities: NonconformityRow[] = [];

async function fetchNonconformities(): Promise<NonconformityResponse> {
  const response = await fetch(
    '/api/v1/nonconformities?page=1&limit=100',
    {credentials: 'same-origin'}
  );

  if (!response.ok) {
    throw new Error(
      `Could not load nonconformities (${response.status}).`
    );
  }

  return await response.json() as NonconformityResponse;
}



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

  const nonconformityQuery = useQuery({
    queryKey: ['nonconformities'],
    queryFn: fetchNonconformities,
  });

  const nonconformities =
    nonconformityQuery.data?.data ?? emptyNonconformities;
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
  }, [nonconformities, search, selectedState, selectedTheme]);

  function clearFilters() {
    setSearch('');
    setSelectedState('ALL');
    setSelectedTheme('ALL');
  }
  if (nonconformityQuery.isPending) {
    return (
      <main className="nc-page">
        <div className="empty-state" role="status">
          <h1>Loading nonconformities…</h1>
          <p>Please wait while the records are loaded.</p>
        </div>
      </main>
    );
  }

  if (nonconformityQuery.isError) {
    return (
      <main className="nc-page">
        <div className="empty-state" role="alert">
          <h1>Could not load nonconformities</h1>
          <p>{nonconformityQuery.error.message}</p>

          <button
            type="button"
            onClick={() => void nonconformityQuery.refetch()}
          >
            Try again
          </button>
        </div>
      </main>
    );
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
            <h2>
              {nonconformities.length === 0
                ? 'No nonconformities registered'
                : 'No matching nonconformities'}
            </h2>

            <p>
              {nonconformities.length === 0
                ? 'The database does not contain any nonconformities yet.'
                : 'Try changing your search or filters.'}
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