import {useMemo, useState} from 'react';
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

type FileTypeFilter = 'ALL' | 'PDF' | 'WORD' | 'EXCEL';

const documents: DocumentRow[] = [
  {
    id: 'document-1',
    reference: 'DOC-0001',
    title: 'Information Security Policy',
    version: '2.1',
    status: DocumentStatus.APPROVED,
    ownerId: 'user-1',
    ownerName: 'Emma Lindberg',
    approvedAt: '2026-06-15',
    nextReviewAt: '2027-06-15',
    mimeType: 'application/pdf',
    sizeBytes: 845000,
    riskId: null,
    controlId: 'A.5.1',
    createdAt: '2026-05-20',
  },
  {
    id: 'document-2',
    reference: 'DOC-0002',
    title: 'Access Control Procedure',
    version: '1.4',
    status: DocumentStatus.APPROVED,
    ownerId: 'user-2',
    ownerName: 'Johan Berg',
    approvedAt: '2026-07-01',
    nextReviewAt: '2027-01-01',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 426000,
    riskId: 'R-0001',
    controlId: 'A.5.15',
    createdAt: '2026-06-10',
  },
  {
    id: 'document-3',
    reference: 'DOC-0003',
    title: 'Incident Response Plan',
    version: '1.2',
    status: DocumentStatus.IN_REVIEW,
    ownerId: 'user-3',
    ownerName: 'Sara Nilsson',
    approvedAt: null,
    nextReviewAt: '2026-09-30',
    mimeType: 'application/pdf',
    sizeBytes: 1250000,
    riskId: 'R-0003',
    controlId: null,
    createdAt: '2026-07-08',
  },
  {
    id: 'document-4',
    reference: 'DOC-0004',
    title: 'Backup and Recovery Instructions',
    version: '0.8',
    status: DocumentStatus.DRAFT,
    ownerId: 'user-4',
    ownerName: 'Dennis Karlsson',
    approvedAt: null,
    nextReviewAt: null,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 318000,
    riskId: 'R-0004',
    controlId: 'A.8.13',
    createdAt: '2026-08-03',
  },
  {
    id: 'document-5',
    reference: 'DOC-0005',
    title: 'Risk Assessment Register',
    version: '3.0',
    status: DocumentStatus.APPROVED,
    ownerId: 'user-1',
    ownerName: 'Emma Lindberg',
    approvedAt: '2026-08-10',
    nextReviewAt: '2027-02-10',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sizeBytes: 786000,
    riskId: null,
    controlId: null,
    createdAt: '2026-07-25',
  },
  {
    id: 'document-6',
    reference: 'DOC-0006',
    title: 'Previous Security Awareness Guide',
    version: '1.0',
    status: DocumentStatus.RETIRED,
    ownerId: null,
    ownerName: null,
    approvedAt: '2025-05-12',
    nextReviewAt: null,
    mimeType: 'application/pdf',
    sizeBytes: 630000,
    riskId: null,
    controlId: 'A.6.3',
    createdAt: '2025-04-20',
  },
];

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
  }, [search, selectedFileType, selectedStatus]);

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
            <h2>No documents found</h2>
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