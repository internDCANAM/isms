import {afterEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {ControlsPage} from '../src/ui/pages/Controls.js';

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
        <ControlsPage />
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

describe('ControlsPage', () => {
  it('shows an empty state when no controls exist', async () => {
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
      screen.getByText('Loading controls…')
    ).toBeInTheDocument();

    expect(
      await screen.findByText('No controls registered')
    ).toBeInTheDocument();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/controls?page=1&limit=100',
      {credentials: 'same-origin'}
    );
  });

  it('displays controls returned by the API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      successfulResponse({
        data: [
          {
            id: 'control-1',
            reference: 'A.5.15',
            title: 'Access control',
            purpose: 'Ensure that access to information is authorized.',
            theme: 'ORGANIZATIONAL',
            applicability: 'APPLICABLE',
            justification: 'Required to protect information access.',
            status: 'IMPLEMENTED',
            ownerId: null,
            ownerName: 'Emma Lindberg',
            implementation: 'Access-control policy implemented.',
            riskCount: 2,
            createdAt: '2026-07-10T00:00:00.000Z',
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
      await screen.findByText('Access control')
    ).toBeInTheDocument();

    expect(screen.getByText('A.5.15')).toBeInTheDocument();
    expect(screen.getByText('Emma Lindberg')).toBeInTheDocument();
  });

  it('shows an error when the API request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', {status: 500})
    );

    renderPage();

    expect(
      await screen.findByText('Could not load controls')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Could not load controls (500).')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {name: 'Try again'})
    ).toBeInTheDocument();
  });
});