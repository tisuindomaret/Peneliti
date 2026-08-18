export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw data?.error || { message: 'An unexpected error occurred' };
  }

  return data;
}

export const authApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: (data: Record<string, any>) =>
    fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  login: (data: Record<string, any>) =>
    fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verifyEmail: (data: Record<string, any>) =>
    fetchWithAuth('/auth/verify-email', { method: 'POST', body: JSON.stringify(data) }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forgotPassword: (data: Record<string, any>) =>
    fetchWithAuth('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resetPassword: (data: Record<string, any>) =>
    fetchWithAuth('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),

  changePassword: (data: Record<string, unknown>) =>
    fetchWithAuth('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  logout: async () => {
    try {
      await fetchWithAuth('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('token');
    }
  },
};

export const profileApi = {
  getProfile: () => fetchWithAuth('/profile', { method: 'GET' }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProfile: (data: Record<string, any>) =>
    fetchWithAuth('/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

export const institutionsApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createInstitution: (data: Record<string, any>) =>
    fetchWithAuth('/institutions', { method: 'POST', body: JSON.stringify(data) }),
};

export const filesApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchWithAuth('/files/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

// Application API
export async function getApplications(token: string, searchParams?: URLSearchParams) {
  const qs = searchParams ? `?${searchParams.toString()}` : '';
  return fetchWithAuth(`/applications${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getApplication(id: string, token: string) {
  return fetchWithAuth(`/applications/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createDraft(token: string, data: Record<string, unknown>) {
  return fetchWithAuth('/applications', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function submitApplication(id: string, token: string) {
  return fetchWithAuth(`/applications/${id}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function reviewApplication(id: string, data: Record<string, unknown>, token: string) {
  return fetchWithAuth(`/applications/${id}/reviews`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function requestRevision(id: string, data: Record<string, unknown>, token: string) {
  return fetchWithAuth(`/applications/${id}/request-revision`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function forwardApplication(id: string, data: Record<string, unknown>, token: string) {
  return fetchWithAuth(`/applications/${id}/forward`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function approveApplication(id: string, data: Record<string, unknown>, token: string) {
  return fetchWithAuth(`/applications/${id}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function rejectApplication(id: string, data: Record<string, unknown>, token: string) {
  return fetchWithAuth(`/applications/${id}/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function getApplicationHistory(id: string, token: string) {
  return fetchWithAuth(`/applications/${id}/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
