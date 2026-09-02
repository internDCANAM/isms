import {afterEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {NonconformityDetailPage,} from '../src/ui/pages/NonconformityDetail.js';

function renderPage(path = '/nonconformities/nc-1') {
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
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/nonconformities/:id"
            element={<NonconformityDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {'Content-Type': 'application/json'},
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NonconformityDetailPage', () => {
  it('loads and displays nonconformity details', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'nc-1',
        reference: 'NC-0001',
        title: 'Access review was not completed',
        description:
          'The quarterly access review missed its deadline.',
        theme: 'ORGANIZATIONAL',
        state: 'OPEN',
        raisedById: null,
        raisedByName: 'Emma Lindberg',
        raisedAt: '2026-08-10T00:00:00.000Z',
        closedAt: null,
        actionCount: 0,
        updatedAt: '2026-09-01T00:00:00.000Z',
        actions: [],
      })
    );

    renderPage();

    expect(
      screen.getByText('Loading nonconformity…')
    ).toBeInTheDocument();

    expect(
      await screen.findByText('Access review was not completed')
    ).toBeInTheDocument();

    expect(screen.getByText('NC-0001')).toBeInTheDocument();
    expect(screen.getByText('Emma Lindberg')).toBeInTheDocument();

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/nonconformities/nc-1',
      {credentials: 'same-origin'}
    );
  });

  it('shows the API error and retry button', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        {error: 'Nonconformity not found.'},
        404
      )
    );

    renderPage();

    expect(
      await screen.findByText(
        'Nonconformity details are unavailable'
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText('Nonconformity not found.')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {name: 'Try again'})
    ).toBeInTheDocument();
  });
});