export function getErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null
  ) {
    const response = error.response as { status?: number };
    if (response.status === 401) {
      return 'Email or password is incorrect.';
    }
  }

  return 'Unable to sign in right now. Please try again.';
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null
  ) {
    const response = error.response as {
      data?: { message?: string | string[] };
      headers?: Record<string, string | string[] | undefined>;
      status?: number;
    };

    if (response.status === 429) {
      const retryAfter = response.headers?.['retry-after'];
      const retryAfterValue = Array.isArray(retryAfter)
        ? retryAfter[0]
        : retryAfter;

      if (retryAfterValue) {
        return `You are making requests too quickly. Please try again in ${retryAfterValue} seconds.`;
      }

      return 'You are making requests too quickly. Please try again shortly.';
    }

    const message = response.data?.message;

    if (Array.isArray(message)) {
      return message.join(' ');
    }

    if (message) {
      return message;
    }
  }

  return fallback;
}
