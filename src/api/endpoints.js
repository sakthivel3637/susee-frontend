const BASE_URL = import.meta.env.VITE_API_URL;

export const API_BASE = BASE_URL;

export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ME: '/auth/me',
    UPDATE_PROFILE: '/auth/profile',
  },

  // Vehicles
  VEHICLES: {
    LIST: '/vehicles/list',
    DETAIL: (id) => `/vehicles/detail/${id}`,
    CREATE: '/vehicles/create',
    UPDATE: (id) => `/vehicles/update/${id}`,
    DELETE: (id) => `/vehicles/delete/${id}`,
    HISTORY: (id) => `/vehicles/history/${id}`,
    SEARCH: '/vehicles/search',
  },

  // Gate Entry
  GATE_ENTRY: {
    LIST: '/gate-entries/list',
    CREATE: '/gate-entries/create',
    DETAIL: (id) => `/gate-entries/detail/${id}`,
    UPDATE: (id) => `/gate-entries/update/${id}`,
    TODAY: '/gate-entries/today',
  },

  // Job Cards
  JOB_CARDS: {
    LIST: '/job-cards/list',
    CREATE: '/job-cards/create',
    DETAIL: (id) => `/job-cards/detail/${id}`,
    STATUSES: '/job-cards/statuses/list',
    SERVICE_STATUSES: '/job-cards/service-statuses/list',
    ADDITIONAL_WORK_LIST: '/job-cards/additional-work/list',
    ADDITIONAL_WORK_CONTEXT: (id) => `/job-cards/${id}/additional-work/context`,
    ADDITIONAL_WORK_REQUEST: (id) => `/job-cards/${id}/additional-work/request`,
    UPDATE: (id) => `/job-cards/update/${id}`,
    DELETE: (id) => `/job-cards/delete/${id}`,
    PENDING: '/job-cards/list?status=PENDING',
    POSTPONE: (id, serviceId) => `/job-cards/${id}/services/${serviceId}/postpone`,
    RESUME: (id, serviceId) => `/job-cards/${id}/services/${serviceId}/resume`,
    SKIP_DEPARTMENT: (id, department) => `/job-cards/${id}/departments/${department}/skip`,
    PENDING: '/job-cards/list?status=PENDING',
  },

  // Approvals
  APPROVALS: {
    LIST: '/approvals/list',
    PENDING: '/approvals/list?status=PENDING',
    APPROVE: (id) => `/approvals/approve/${id}`,
    REJECT: (id) => `/approvals/reject/${id}`,
    DETAIL: (id) => `/approvals/detail/${id}`,
  },

  // Work Queues
  QUEUES: {
    MECHANICAL: '/queues/mechanical/list',
    BODY_SHOP: '/queues/body-shop/list',
    WATER_WASH: '/queues/water-wash/list',
    UPDATE_STATUS: (id) => `/queues/status/${id}`,
    ASSIGN: (id) => `/queues/assign/${id}`,
    REASSIGN: (id) => `/queues/reassign/${id}`
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard/stats',
    ADMIN: '/dashboard/admin',
    MANAGER: '/dashboard/manager',
    MD: '/dashboard/md',
    SUPERVISOR: '/dashboard/supervisor',
    BODY_SHOP: '/dashboard/body-shop',
    WATER_WASH: '/dashboard/water-wash',
    RECENT_JOBS: '/dashboard/recent-jobs',
    QUEUE_SUMMARY: '/dashboard/queue-summary',
  },

  // Reports
  REPORTS: {
    DAILY: '/reports/daily',
    WEEKLY: '/reports/weekly',
    MONTHLY: '/reports/monthly',
    CUSTOM: '/reports/custom',
    EXPORT: '/reports/export',
  },

  // Users
  USERS: {
    LIST: '/users/list',
    MECHANICS_DROPDOWN: '/users/mechanics/dropdown',
    CREATE: '/users/create',
    DETAIL: (id) => `/users/detail/${id}`,
    UPDATE: (id) => `/users/update/${id}`,
    DELETE: (id) => `/users/delete/${id}`,
    CHANGE_PASSWORD: '/users/change-password',
  },

  // Customers
  CUSTOMERS: {
    LIST: '/customers/list',
    DETAIL: (id) => `/customers/detail/${id}`,
    UPDATE: (id) => `/customers/update/${id}`,
    STATUS: (id) => `/customers/status/${id}`,
  },

  // Roles
  ROLES: {
    LIST: '/roles/list',
    CREATE: '/roles/create',
    DETAIL: (id) => `/roles/detail/${id}`,
    UPDATE: (id) => `/roles/update/${id}`,
    STATUS: (id) => `/roles/status/${id}`,
    MENU_PERMISSIONS: {
      SAVE: (roleId) => `/roles/${roleId}/menu-permissions/save`,
      LIST: (roleId) => `/roles/${roleId}/menu-permissions/list`,
      UPDATE: (roleId) => `/roles/${roleId}/menu-permissions/update`,
      DELETE: (roleId, menuId) => `/roles/${roleId}/menu-permissions/delete/${menuId}`,
    },
  },

  // Menus
  MENUS: {
    LIST: '/menus/list',
    MODULES: '/menus/modules/list',
    BY_MODULE: (module) => `/menus/list-by-module/${module}`,
  },

  // Masters
  ADMIN_MASTERS: {
    STATES: {
      LIST: '/admin/states/list',
      DETAIL: (id) => `/admin/states/detail/${id}`,
      CREATE: '/admin/states/create',
      UPDATE: (id) => `/admin/states/update/${id}`,
      STATUS: (id) => `/admin/states/status/${id}`,
    },
    DISTRICTS: {
      LIST: '/admin/districts/list',
      DETAIL: (id) => `/admin/districts/detail/${id}`,
      CREATE: '/admin/districts/create',
      UPDATE: (id) => `/admin/districts/update/${id}`,
      STATUS: (id) => `/admin/districts/status/${id}`,
    },
    SERVICE_CENTERS: {
      LIST: '/admin/service-centers/list',
      DETAIL: (id) => `/admin/service-centers/detail/${id}`,
      CREATE: '/admin/service-centers/create',
      UPDATE: (id) => `/admin/service-centers/update/${id}`,
      STATUS: (id) => `/admin/service-centers/status/${id}`,
    },
    LOCATIONS: {
      LIST: '/admin/locations/list',
      DETAIL: (id) => `/admin/locations/detail/${id}`,
      CREATE: '/admin/locations/create',
      UPDATE: (id) => `/admin/locations/update/${id}`,
      STATUS: (id) => `/admin/locations/status/${id}`,
    },
    SERVICE_CATEGORIES: {
      LIST: '/admin/service-categories/list',
      DETAIL: (id) => `/admin/service-categories/detail/${id}`,
      CREATE: '/admin/service-categories/create',
      UPDATE: (id) => `/admin/service-categories/update/${id}`,
      STATUS: (id) => `/admin/service-categories/status/${id}`,
    },
    SERVICE_ITEMS: {
      LIST: '/admin/service-items/list',
      DETAIL: (id) => `/admin/service-items/detail/${id}`,
      CREATE: '/admin/service-items/create',
      UPDATE: (id) => `/admin/service-items/update/${id}`,
      STATUS: (id) => `/admin/service-items/status/${id}`,
    },
    AUDIT_LOGS: {
      LIST: '/audit-logs/list',
      DETAIL: (id) => `/audit-logs/detail/${id}`
    },
    BRANDS: {
      LIST: '/admin/brands/list',
      CREATE: '/admin/brands/create',
      UPDATE: (id) => `/admin/brands/update/${id}`,
      STATUS: (id) => `/admin/brands/status/${id}`,
    }
  },

  MASTERS: {
    SERVICES: '/masters/services/list',
    SERVICE_DETAIL: (id) => `/masters/services/detail/${id}`,
    SERVICE_CREATE: '/masters/services/create',
    SERVICE_UPDATE: (id) => `/masters/services/update/${id}`,
    SERVICE_DELETE: (id) => `/masters/services/delete/${id}`,
    BRAND_DROPDOWN: '/brands/dropdown',
    BRANDS: '/masters/brands/list',
    BRAND_DETAIL: (id) => `/masters/brands/detail/${id}`,
    BRAND_CREATE: '/masters/brands/create',
    BRAND_UPDATE: (id) => `/masters/brands/update/${id}`,
    BRAND_DELETE: (id) => `/masters/brands/delete/${id}`,
    MODELS: '/masters/models/list',
    MODEL_DETAIL: (id) => `/masters/models/detail/${id}`,
    MODEL_CREATE: '/masters/models/create',
    MODEL_UPDATE: (id) => `/masters/models/update/${id}`,
    MODEL_DELETE: (id) => `/masters/models/delete/${id}`,
    PRICING: '/masters/pricing/list',
    PRICING_DETAIL: (id) => `/masters/pricing/detail/${id}`,
    PRICING_CREATE: '/masters/pricing/create',
    PRICING_UPDATE: (id) => `/masters/pricing/update/${id}`,
    PRICING_DELETE: (id) => `/masters/pricing/delete/${id}`,
    BAYS: {
      LIST: '/bays/list',
      CRM_DROPDOWN: '/crm/bays/dropdown',
      CREATE: '/bays/create',
      UPDATE: (id) => `/bays/update/${id}`,
      STATUS: (id) => `/bays/status/${id}`,
    }
  },

  // Kiosk
  KIOSK: {
    DISPLAY: '/kiosk/display',
    TV: '/kiosk/tv',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id) => `/notifications/read/${id}`,
    MARK_ALL_READ: '/notifications/read-all',
  },
  DEVICE_TOKEN: {
    REGISTER: '/device-token',
    REMOVE: '/device-token',
  },

  STAGE_TIME_LIMITS: {
    LIST: '/stage-time-limits/list',
    CREATE: '/stage-time-limits/create',
    DETAIL: (id) => `/stage-time-limits/detail/${id}`,
    UPDATE: (id) => `/stage-time-limits/update/${id}`,
    STATUS: (id) => `/stage-time-limits/status/${id}`,
    MODULES: '/modules',
    STATUSES: '/statuses',
    ROLES: '/roles',
    USERS: '/users',
    LOCATIONS: '/locations',
  }
};
