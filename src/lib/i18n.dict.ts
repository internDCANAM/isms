export const en = {
  auth:
  {
    refreshTokenMissing: 'Refresh token missing.',
    refreshTokenInvalid: 'Invalid refresh token.',
    refreshTokenRevoked: 'Refresh token revoked.',
  },
  http:
  {
    badRequest:          'Invalid request.',
    unauthorized:        'Authentication required.',
    forbidden:           'Access denied.',
    notFound:            'Resource not found.',
    rateLimited:         'Too many attempts, please try again later.',
    internalError:       'Something went wrong. Please try again.',
  },
  input:
  {
    validationFailed: 'Validation failed.',
  }
} as const;

export const sv = {
  auth:
  {
    refreshTokenMissing: 'Refresh-token saknas.',
    refreshTokenInvalid: 'Ogiltig refresh-token.',
    refreshTokenRevoked: 'Refresh-token återkallad.',
  },
  http:
  {
    badRequest:          'Ogiltig förfrågan.',
    unauthorized:        'Autentisering krävs.',
    forbidden:           'Åtkomst nekad.',
    notFound:            'Resursen hittades inte.',
    rateLimited:         'För många försök, försök igen senare.',
    internalError:       'Något gick fel. Försök igen.',
  },
  input:
  {
    validationFailed: 'Valideringsfel.',
  }
} as const;

export const languages = {en, sv};
export type Locale = keyof typeof languages;
export const DEFAULT_LOCALE: Locale = 'sv';
