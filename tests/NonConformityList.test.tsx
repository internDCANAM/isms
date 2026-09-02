import {afterEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {NonconformityListPage,} from '../src/ui/pages/NonconformityList.js';

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
        <NonconformityListPage />
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

describe('NonconformityListPage', () => {
  it('shows an empty state when no records exist', async () => {
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
      screen.getByText('Loading nonconformities…')
    ).toBeInTheDocument();

    expect(
      await screen.findByText('No nonconformities registered')
    ).toBeInTheDocument();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/nonconformities?page=1&limit=100',
      {credentials: 'same-origin'}
    );
  });

  it('displays records returned by the API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      successfulResponse({
        data: [
          {
            id: 'nc-1',
            reference: 'NC-0001',
            title: 'Access review was not completed',
            theme: 'ORGANIZATIONAL',
            state: 'OPEN',
            raisedById: null,
            raisedByName: 'Emma Lindberg',
            raisedAt: '2026-08-10T00:00:00.000Z',
            closedAt: null,
            actionCount: 2,
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
      await screen.findByText('Access review was not completed')
    ).toBeInTheDocument();

    expect(screen.getByText('NC-0001')).toBeInTheDocument();
    expect(screen.getByText('Emma Lindberg')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows an error when the API request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', {status: 500})
    );

    renderPage();

    expect(
      await screen.findByText('Could not load nonconformities')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Could not load nonconformities (500).')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {name: 'Try again'})
    ).toBeInTheDocument();
  });
});