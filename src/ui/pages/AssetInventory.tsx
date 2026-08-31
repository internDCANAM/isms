import {useMemo, useState} from 'react';
import {AssetCategory, Theme} from '../../domain.js';
import '../css/asset-inventory.css';

interface AssetRow {
  id: string;
  reference: string;
  name: string;
  description: string;
  category: AssetCategory;
  theme: Theme;
  ownerName: string | null;
  classification: string | null;
  riskCount: number;
  createdAt: string;
}

const assets: AssetRow[] = [
  {
    id: '1',
    reference: 'A-0001',
    name: 'Customer information database',
    description: 'Database containing customer information.',
    category: AssetCategory.INFORMATION,
    theme: Theme.TECHNOLOGICAL,
    ownerName: 'Emma Lindberg',
    classification: 'Confidential',
    riskCount: 3,
    createdAt: '2026-07-10',
  },
  {
    id: '2',
    reference: 'A-0002',
    name: 'Customer portal',
    description: 'Web portal used by external customers.',
    category: AssetCategory.SOFTWARE,
    theme: Theme.TECHNOLOGICAL,
    ownerName: 'Johan Berg',
    classification: 'Internal',
    riskCount: 2,
    createdAt: '2026-07-12',
  },
  {
    id: '3',
    reference: 'A-0003',
    name: 'Employee laptops',
    description: 'Portable computers used by employees.',
    category: AssetCategory.HARDWARE,
    theme: Theme.PHYSICAL,
    ownerName: 'Sara Nilsson',
    classification: 'Internal',
    riskCount: 4,
    createdAt: '2026-07-15',
  },
  {
    id: '4',
    reference: 'A-0004',
    name: 'Cloud backup service',
    description: 'External service for encrypted backups.',
    category: AssetCategory.SERVICE,
    theme: Theme.TECHNOLOGICAL,
    ownerName: 'Dennis Karlsson',
    classification: 'Confidential',
    riskCount: 2,
    createdAt: '2026-07-18',
  },
  {
    id: '5',
    reference: 'A-0005',
    name: 'System administrators',
    description: 'Employees with privileged system access.',
    category: AssetCategory.PEOPLE,
    theme: Theme.PEOPLE,
    ownerName: 'Emma Lindberg',
    classification: 'Restricted',
    riskCount: 3,
    createdAt: '2026-07-20',
  },
  {
    id: '6',
    reference: 'A-0006',
    name: 'Main office',
    description: 'Primary workplace and equipment location.',
    category: AssetCategory.FACILITY,
    theme: Theme.PHYSICAL,
    ownerName: null,
    classification: 'Internal',
    riskCount: 1,
    createdAt: '2026-07-22',
  },
];

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
        asset.description,
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
  }, [search, selectedCategory, selectedTheme]);

  function clearFilters() {
    setSearch('');
    setSelectedCategory('ALL');
    setSelectedTheme('ALL');
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

        <button className="asset-new-button" type="button">
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
            <h2>No matching assets</h2>

            <p>
              Try another search or clear the filters.
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
                      <span className="asset-description">
                        {asset.description}
                      </span>
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

                    <td>{asset.createdAt}</td>
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