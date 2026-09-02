import {afterEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {AssetInventoryPage,} from '../src/ui/pages/AssetInventory.js';

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
        <AssetInventoryPage />
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

describe('AssetInventoryPage', () => {
  it('shows an empty state when no assets exist', async () => {
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
      screen.getByText('Loading asset inventory…')
    ).toBeInTheDocument();

    expect(
      await screen.findByText('No assets registered')
    ).toBeInTheDocument();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/assets?page=1&limit=100',
      {credentials: 'same-origin'}
    );
  });

  it('displays assets returned by the API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      successfulResponse({
        data: [
          {
            id: 'asset-1',
            reference: 'A-0001',
            name: 'Customer information database',
            description: 'Database containing customer information.',
            category: 'INFORMATION',
            theme: 'TECHNOLOGICAL',
            ownerId: null,
            ownerName: 'Emma Lindberg',
            classification: 'Confidential',
            riskCount: 3,
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
      await screen.findByText('Customer information database')
    ).toBeInTheDocument();

    expect(screen.getByText('A-0001')).toBeInTheDocument();
    expect(screen.getByText('Emma Lindberg')).toBeInTheDocument();
    expect(screen.getByText('Confidential')).toBeInTheDocument();
  });

  it('shows an error when the API request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', {status: 500})
    );

    renderPage();

    expect(
      await screen.findByText('Could not load assets')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Could not load assets (500).')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {name: 'Try again'})
    ).toBeInTheDocument();
  });
});