const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

// Auth Token Management
export const authToken = {
  get: () => localStorage.getItem('auth_token'),
  set: (token: string) => localStorage.setItem('auth_token', token),
  remove: () => localStorage.removeItem('auth_token'),
};

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = authToken.get();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {}
    throw new Error(`API Error: ${errorMessage}`);
  }

  if (response.status === 204 || response.status === 201) {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {} as T;
  }
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string }) =>
      fetchAPI<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      fetchAPI<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getCurrentUser: () => fetchAPI<any>('/auth/me'),
    updateProfile: (data: { name: string; email: string }) =>
      fetchAPI<any>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      fetchAPI<{ message: string }>('/auth/password', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    logout: () => {
      authToken.remove();
    },
  },

  databases: {
    getAll: () => fetchAPI<any[]>('/databases'),
    getById: (id: string) => fetchAPI<any>(`/databases/${id}`),
    create: (data: any) => fetchAPI<any>('/databases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchAPI<any>(`/databases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchAPI<void>(`/databases/${id}`, {
      method: 'DELETE',
    }),
  },

  schedules: {
    getAll: () => fetchAPI<any[]>('/schedules'),
    getById: (id: string) => fetchAPI<any>(`/schedules/${id}`),
    create: (data: any) => fetchAPI<any>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchAPI<any>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchAPI<void>(`/schedules/${id}`, {
      method: 'DELETE',
    }),
    execute: (id: string) => fetchAPI<any>(`/schedules/${id}/execute`, {
      method: 'POST',
    }),
  },

  backups: {
    getAll: (databaseId?: string) => {
      const params = databaseId ? `?databaseId=${databaseId}` : '';
      return fetchAPI<any[]>(`/backups${params}`);
    },
    getById: (id: string) => fetchAPI<any>(`/backups/${id}`),
    createManual: (databaseId: string) => fetchAPI<any>('/backups/manual', {
      method: 'POST',
      body: JSON.stringify({ databaseId }),
    }),
  },
};

