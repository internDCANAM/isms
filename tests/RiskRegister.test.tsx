import {afterEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {RiskRegisterPage} from '../src/ui/pages/RiskRegister.js';

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
        <RiskRegisterPage />
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

describe('RiskRegisterPage', () => {
  it('shows an empty state when no risks exist', async () => {
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
      screen.getByText('Loading risk register…')
    ).toBeInTheDocument();

    expect(
      await screen.findByText('No risks registered')
    ).toBeInTheDocument();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/risks?page=1&limit=100',
      {credentials: 'same-origin'}
    );
  });

  it('displays risks returned by the API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      successfulResponse({
        data: [
          {
            id: 'risk-1',
            reference: 'R-0001',
            title: 'Unauthorised access',
            theme: 'TECHNOLOGICAL',
            ownerName: 'Emma Lindberg',
            inherentLevel: 'HIGH',
            residualLevel: 'MEDIUM',
            treatmentCount: 2,
            createdAt: '2026-09-02T08:00:00.000Z',
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
      await screen.findByText('Unauthorised access')
    ).toBeInTheDocument();

    expect(screen.getByText('R-0001')).toBeInTheDocument();
    expect(screen.getByText('Emma Lindberg')).toBeInTheDocument();
  });

  it('shows an error when the API request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', {status: 500})
    );

    renderPage();

    expect(
      await screen.findByText('Could not load risks')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {name: 'Try again'})
    ).toBeInTheDocument();
  });
});