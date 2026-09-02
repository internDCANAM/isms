export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_URL as string;
  return `${base}${path}`;
}

export function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(apiUrl(path), {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify(body),
  });
}
