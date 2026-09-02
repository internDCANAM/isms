import {useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {DocumentStatus} from '../../domain.js';
import '../css/documents.css';

type DocumentRow = {
  id: string;
  reference: string;
  title: string;
  version: string;
  status: DocumentStatus;
  ownerId: string | null;
  ownerName: string | null;
  approvedAt: string | null;
  nextReviewAt: string | null;
  mimeType: string;
  sizeBytes: number;
  riskId: string | null;
  controlId: string | null;
  createdAt: string;
};
interface DocumentResponse {
  data: DocumentRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const emptyDocuments: DocumentRow[] = [];

async function fetchDocuments(): Promise<DocumentResponse> {
  const response = await fetch('/api/v1/documents?page=1&limit=100', {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`Could not load documents (${response.status}).`);
  }

  return await response.json() as DocumentResponse;
}

type FileTypeFilter = 'ALL' | 'PDF' | 'WORD' | 'EXCEL';



const statusLabels: Record<DocumentStatus, string> = {
  [DocumentStatus.DRAFT]: 'Draft',
  [DocumentStatus.IN_REVIEW]: 'In review',
  [DocumentStatus.APPROVED]: 'Approved',
  [DocumentStatus.RETIRED]: 'Retired',
};

function getFileType(mimeType: string): Exclude<FileTypeFilter, 'ALL'> {
  if (mimeType.includes('spreadsheet')) {
    return 'EXCEL';
  }

  if (mimeType.includes('wordprocessingml')) {
    return 'WORD';
  }

  return 'PDF';
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes >= 1000000) {
    return `${(sizeBytes / 1000000).toFixed(1)} MB`;
  }

  return `${Math.round(sizeBytes / 1000)} KB`;
}

function formatDate(date: string | null) {
  if (date === null) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-SE').format(new Date(date));
}

export function DocumentsPage() {
  const documentQuery = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
  });

  const documents =
    documentQuery.data?.data ?? emptyDocuments;
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] =
    useState<DocumentStatus | 'ALL'>('ALL');
  const [selectedFileType, setSelectedFileType] =
    useState<FileTypeFilter>('ALL');

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        query.length === 0 ||
        document.reference.toLowerCase().includes(query) ||
        document.title.toLowerCase().includes(query) ||
        document.version.toLowerCase().includes(query) ||
        (document.ownerName?.toLowerCase().includes(query) ?? false);

      const matchesStatus =
        selectedStatus === 'ALL' || document.status === selectedStatus;

      const matchesFileType =
        selectedFileType === 'ALL' ||
        getFileType(document.mimeType) === selectedFileType;

      return matchesSearch && matchesStatus && matchesFileType;
    });
  }, [documents, search, selectedFileType, selectedStatus]);

  const draftCount = documents.filter(
    (document) => document.status === DocumentStatus.DRAFT
  ).length;

  const reviewCount = documents.filter(
    (document) => document.status === DocumentStatus.IN_REVIEW
  ).length;

  const approvedCount = documents.filter(
    (document) => document.status === DocumentStatus.APPROVED
  ).length;

  const clearFilters = () => {
    setSearch('');
    setSelectedStatus('ALL');
    setSelectedFileType('ALL');
  };
  if (documentQuery.isPending) {
    return (
      <main className="documents-page">
        <div className="documents-empty" role="status">
          <h1>Loading documents…</h1>
          <p>Please wait while the documents are loaded.</p>
        </div>
      </main>
    );
  }

  if (documentQuery.isError) {
    return (
      <main className="documents-page">
        <div className="documents-empty" role="alert">
          <h1>Could not load documents</h1>
          <p>{documentQuery.error.message}</p>

          <button
            type="button"
            onClick={() => void documentQuery.refetch()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }
  return (
    <main className="documents-page">
      <header className="documents-header">
        <div>
          <p className="documents-eyebrow">Document control</p>
          <h1>Controlled documents</h1>
          <p>
            Review approved policies, procedures and supporting ISMS records.
          </p>
        </div>
      </header>

      <section className="documents-summary" aria-label="Documents summary">
        <article className="document-summary-card document-summary-card--total">
          <span>Total documents</span>
          <strong>{documents.length}</strong>
        </article>

        <article className="document-summary-card document-summary-card--draft">
          <span>Draft</span>
          <strong>{draftCount}</strong>
        </article>

        <article className="document-summary-card document-summary-card--review">
          <span>In review</span>
          <strong>{reviewCount}</strong>
        </article>

        <article className="document-summary-card document-summary-card--approved">
          <span>Approved</span>
          <strong>{approvedCount}</strong>
        </article>
      </section>

      <section className="documents-register">
        <div className="documents-filters">
          <label>
            <span className="sr-only">Search documents</span>
            <input
              type="search"
              value={search}
              placeholder="Search reference, title, version or owner"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label>
            <span className="sr-only">Filter by status</span>
            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as DocumentStatus | 'ALL')
              }
            >
              <option value="ALL">All statuses</option>
              {Object.values(DocumentStatus).map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by file type</span>
            <select
              value={selectedFileType}
              onChange={(event) =>
                setSelectedFileType(event.target.value as FileTypeFilter)
              }
            >
              <option value="ALL">All file types</option>
              <option value="PDF">PDF</option>
              <option value="WORD">Word</option>
              <option value="EXCEL">Excel</option>
            </select>
          </label>
        </div>

        <div className="documents-results">
          <span>
            {filteredDocuments.length} of {documents.length} documents
          </span>

          <button type="button" className="documents-clear" onClick={clearFilters}>
            Clear filters
          </button>
        </div>

        <div className="documents-table-scroll">
          <table className="documents-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Document</th>
                <th>Version</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Approved</th>
                <th>Next review</th>
                <th>File</th>
                <th>Linked to</th>
              </tr>
            </thead>

            <tbody>
              {filteredDocuments.map((document) => {
                const fileType = getFileType(document.mimeType);
                const linkedTo =
                  document.riskId ?? document.controlId ?? '—';

                return (
                  <tr key={document.id}>
                    <td>{document.reference}</td>
                    <td>
                      <strong>{document.title}</strong>
                      <small>Created {formatDate(document.createdAt)}</small>
                    </td>
                    <td>{document.version}</td>
                    <td>
                      <span
                        className={`document-status document-status--${document.status
                          .toLowerCase()
                          .replace('_', '-')}`}
                      >
                        {statusLabels[document.status]}
                      </span>
                    </td>
                    <td>{document.ownerName ?? 'Unassigned'}</td>
                    <td>{formatDate(document.approvedAt)}</td>
                    <td>{formatDate(document.nextReviewAt)}</td>
                    <td>
                      <span
                        className={`document-file document-file--${fileType.toLowerCase()}`}
                      >
                        {fileType}
                      </span>
                      <small>{formatFileSize(document.sizeBytes)}</small>
                    </td>
                    <td>{linkedTo}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDocuments.length === 0 && (
          <div className="documents-empty">
            <h2>
              {documents.length === 0
                ? 'No documents registered'
                : 'No documents found'}
            </h2>

            <p>
              {documents.length === 0
                ? 'The database does not contain any documents yet.'
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