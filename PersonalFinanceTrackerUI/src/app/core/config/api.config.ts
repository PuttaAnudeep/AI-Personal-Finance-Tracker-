export const API_CONFIG = {
  baseUrl: 'https://localhost:7100/api',
  auth: {
    login: '/Auth/login',
    register: '/Auth/register',
    me: '/Auth/me',
    updateProfile: '/Auth/me',
    changePassword: '/Auth/me/change-password',
    dashboard: '/Auth/me/dashboard',
    spendingByCategory: '/Auth/me/spending-by-category',
    monthlySummary: '/Auth/me/monthly-summary',
  },
  transactions: {
    base: '/transaction',
    byId: (id: number) => `/transaction/${id}`,
    byUserId: (userId: string) => `/transaction/user/${userId}`,
    byType: (type: string) => `/transaction/type/${type}`,
    byCategory: (category: string) => `/transaction/category/${category}`,
    byDateRange: `/transaction/date-range`,
    filtered: `/transaction/filtered`,
  },
  ai: {
    createTransaction: '/ai/create-transaction',
    processDocument: '/ai/process-document',
  }
} as const;

export const TOKEN_KEY = 'finance_tracker_token';
export const REFRESH_TOKEN_KEY = 'finance_tracker_refresh_token';