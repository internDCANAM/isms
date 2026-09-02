import {afterEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {RiskDetailPage} from '../src/ui/pages/RiskDetail.js';

function renderPage(path = '/risks/risk-1') {
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
            path="/risks/:id"
            element={<RiskDetailPage />}
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

describe('RiskDetailPage', () => {
  it('loads and displays risk details', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        id: 'risk-1',
        reference: 'R-0001',
        title: 'Unauthorised access',
        description:
          'Customer information could be accessed improperly.',
        theme: 'TECHNOLOGICAL',
        ownerId: null,
        ownerName: 'Emma Lindberg',
        inherentLevel: 'HIGH',
        residualLevel: 'MEDIUM',
        treatmentCount: 0,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
        assessments: [],
        treatments: [],
        assetIds: [],
        controlIds: [],
      })
    );

    renderPage();

    expect(
      screen.getByText('Loading risk details…')
    ).toBeInTheDocument();

    expect(
      await screen.findByText('Unauthorised access')
    ).toBeInTheDocument();

    expect(screen.getByText('R-0001')).toBeInTheDocument();
    expect(screen.getByText('Emma Lindberg')).toBeInTheDocument();

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/risks/risk-1',
      {credentials: 'same-origin'}
    );
  });

  it('shows the API error and retry button', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        {error: 'Risk not found.'},
        404
      )
    );

    renderPage();

    expect(
      await screen.findByText('Risk details are unavailable')
    ).toBeInTheDocument();

    expect(screen.getByText('Risk not found.')).toBeInTheDocument();

    expect(
      screen.getByRole('button', {name: 'Try again'})
    ).toBeInTheDocument();
  });
});