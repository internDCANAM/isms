import {afterEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {DocumentsPage} from '../src/ui/pages/Documents.js';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function successfulResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {'Content-Type': 'application/json'},
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DocumentsPage', () => {
  it('shows an empty state when no documents exist', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      successfulResponse({
        data: [],
        pagination: {
          page: 1,
          limit: 100,
          total: 0,
          totalPages: 0,
        },
      })
    );

    renderPage();

    expect(
      screen.getByText('Loading documents…')
    ).toBeInTheDocument();

    expect(
      await screen.findByText('No documents registered')
    ).toBeInTheDocument();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/documents?page=1&limit=100',
      {credentials: 'same-origin'}
    );
  });

  it('displays documents returned by the API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      successfulResponse({
        data: [
          {
            id: 'document-1',
            reference: 'DOC-0001',
            title: 'Information Security Policy',
            version: '1.0',
            status: 'APPROVED',
            ownerId: null,
            ownerName: 'Emma Lindberg',
            approvedAt: '2026-08-01T00:00:00.000Z',
            nextReviewAt: '2027-08-01T00:00:00.000Z',
            mimeType: 'application/pdf',
            sizeBytes: 245760,
            riskId: null,
            controlId: null,
            createdAt: '2026-07-20T00:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 100,
          total: 1,
          totalPages: 1,
        },
      })
    );

    renderPage();

    expect(
      await screen.findByText('Information Security Policy')
    ).toBeInTheDocument();

    expect(screen.getByText('DOC-0001')).toBeInTheDocument();
    expect(screen.getByText('Emma Lindberg')).toBeInTheDocument();
    expect(screen.getByText('1.0')).toBeInTheDocument();
  });

  it('shows an error when the API request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', {status: 500})
    );

    renderPage();

    expect(
      await screen.findByText('Could not load documents')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Could not load documents (500).')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {name: 'Try again'})
    ).toBeInTheDocument();
  });
});