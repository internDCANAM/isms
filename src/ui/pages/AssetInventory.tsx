import {useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {AssetCategory, Theme} from '../../domain.js';
import '../css/asset-inventory.css';

interface AssetRow {
  id: string;
  reference: string;
  name: string;
  description: string | null;
  category: AssetCategory;
  theme: Theme;
  ownerName: string | null;
  classification: string | null;
  riskCount: number;
  createdAt: string;
}
interface AssetResponse {
  data: AssetRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const emptyAssets: AssetRow[] = [];

async function fetchAssets(): Promise<AssetResponse> {
  const response = await fetch('/api/v1/assets?page=1&limit=100', {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`Could not load assets (${response.status}).`);
  }

  return await response.json() as AssetResponse;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-SE').format(new Date(value));
}



const categoryLabels: Record<AssetCategory, string> = {
  [AssetCategory.INFORMATION]: 'Information',
  [AssetCategory.SOFTWARE]: 'Software',
  [AssetCategory.HARDWARE]: 'Hardware',
  [AssetCategory.SERVICE]: 'Service',
  [AssetCategory.PEOPLE]: 'People',
  [AssetCategory.FACILITY]: 'Facility',
};

const themeLabels: Record<Theme, string> = {
  [Theme.ORGANIZATIONAL]: 'Organizational',
  [Theme.PEOPLE]: 'People',
  [Theme.PHYSICAL]: 'Physical',
  [Theme.TECHNOLOGICAL]: 'Technological',
};

function CategoryBadge({
  category,
}: {
  category: AssetCategory;
}) {
  return (
    <span
      className={
        'asset-badge asset-badge--'
        + category.toLowerCase()
      }
    >
      {categoryLabels[category]}
    </span>
  );
}

export function AssetInventoryPage() {

  const assetQuery = useQuery({
    queryKey: ['assets'],
    queryFn: fetchAssets,
  });

  const assets = assetQuery.data?.data ?? emptyAssets;
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<AssetCategory | 'ALL'>('ALL');
  const [selectedTheme, setSelectedTheme] =
    useState<Theme | 'ALL'>('ALL');

  const filteredAssets = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const searchableText = [
        asset.reference,
        asset.name,
        asset.description ?? '',
        asset.ownerName ?? '',
        asset.classification ?? '',
        categoryLabels[asset.category],
        themeLabels[asset.theme],
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        searchableText.includes(searchText);

      const matchesCategory =
        selectedCategory === 'ALL'
        || asset.category === selectedCategory;

      const matchesTheme =
        selectedTheme === 'ALL'
        || asset.theme === selectedTheme;

      return matchesSearch && matchesCategory && matchesTheme;
    });
  }, [assets, search, selectedCategory, selectedTheme]);

  function clearFilters() {
    setSearch('');
    setSelectedCategory('ALL');
    setSelectedTheme('ALL');
  }
  if (assetQuery.isPending) {
    return (
      <main className="asset-page">
        <div className="asset-empty" role="status">
          <h1>Loading asset inventory…</h1>
          <p>Please wait while the assets are loaded.</p>
        </div>
      </main>
    );
  }

  if (assetQuery.isError) {
    return (
      <main className="asset-page">
        <div className="asset-empty" role="alert">
          <h1>Could not load assets</h1>
          <p>{assetQuery.error.message}</p>

          <button
            type="button"
            onClick={() => void assetQuery.refetch()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }


  return (
    <main className="asset-page">
      <header className="asset-page__header">
        <div>
          <p className="asset-eyebrow">
            Information-security assets
          </p>

          <h1>Asset inventory</h1>

          <p>
            Identify and manage assets that support the ISMS.
          </p>
        </div>

        <button
          className="asset-new-button"
          type="button"
          disabled
          title="Creating assets will be added in a later phase"
        >
          + New asset
        </button>

      </header>

      <section
        className="asset-summary"
        aria-label="Asset summary"
      >
        <article className="asset-summary-card asset-summary-card--total">
          <span>Total assets</span>
          <strong>{assets.length}</strong>
        </article>

        <article className="asset-summary-card asset-summary-card--information">
          <span>Information</span>
          <strong>
            {
              assets.filter(
                (asset) =>
                  asset.category === AssetCategory.INFORMATION
              ).length
            }
          </strong>
        </article>

        <article className="asset-summary-card asset-summary-card--software">
          <span>Software</span>
          <strong>
            {
              assets.filter(
                (asset) =>
                  asset.category === AssetCategory.SOFTWARE
              ).length
            }
          </strong>
        </article>

        <article className="asset-summary-card asset-summary-card--hardware">
          <span>Hardware</span>
          <strong>
            {
              assets.filter(
                (asset) =>
                  asset.category === AssetCategory.HARDWARE
              ).length
            }
          </strong>
        </article>
      </section>

      <section className="asset-register">
        <div className="asset-filters">
          <label>
            <span className="sr-only">
              Search assets
            </span>

            <input
              type="search"
              placeholder="Search reference, asset, owner or classification"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </label>

          <label>
            <span className="sr-only">
              Filter by category
            </span>

            <select
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(
                  event.target.value as AssetCategory | 'ALL'
                )
              }
            >
              <option value="ALL">All categories</option>

              {Object.values(AssetCategory).map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {categoryLabels[category]}
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

        <div className="asset-results">
          <p>
            <strong>{filteredAssets.length}</strong>
            {' '}of {assets.length} assets
          </p>

          {(search
            || selectedCategory !== 'ALL'
            || selectedTheme !== 'ALL') && (
            <button
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredAssets.length === 0 ? (
          <div className="asset-empty">
            <h2>
              {assets.length === 0
                ? 'No assets registered'
                : 'No matching assets'}
            </h2>

            <p>
              {assets.length === 0
                ? 'The database does not contain any assets yet.'
                : 'Try another search or clear the filters.'}
            </p>
          </div>
        ) : (
          <div className="asset-table-scroll">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Asset</th>
                  <th>Category</th>
                  <th>Theme</th>
                  <th>Owner</th>
                  <th>Classification</th>
                  <th>Risks</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.id}>
                    <td>{asset.reference}</td>

                    <td>
                      <strong>{asset.name}</strong>
                      {asset.description && (
                        <span className="asset-description">
                          {asset.description}
                        </span>
                      )}
                    </td>

                    <td>
                      <CategoryBadge
                        category={asset.category}
                      />
                    </td>

                    <td>{themeLabels[asset.theme]}</td>

                    <td>
                      {asset.ownerName ?? 'Unassigned'}
                    </td>

                    <td>
                      {asset.classification ?? 'Not classified'}
                    </td>

                    <td>{asset.riskCount}</td>

                    <td>{formatDate(asset.createdAt)}</td>
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