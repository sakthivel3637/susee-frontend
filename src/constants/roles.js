export const ROLES = {
  GATE_SECURITY: 'GATE_SECURITY',
  CRM_TEAM: 'CRM_TEAM',
  FLOOR_SUPERVISOR: 'FLOOR_SUPERVISOR',
  BODY_SHOP_SUPERVISOR: 'BODY_SHOP_SUPERVISOR',
  WATER_WASH_TEAM: 'WATER_WASH_TEAM',
  MANAGER: 'MANAGER',
  MD: 'MD',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

export const ROLE_LABELS = {
  GATE_SECURITY: 'Gate Security',
  CRM_TEAM: 'CRM Team',
  FLOOR_SUPERVISOR: 'Floor Supervisor',
  BODY_SHOP_SUPERVISOR: 'Body Shop Supervisor',
  WATER_WASH_TEAM: 'Water Wash Team',
  MANAGER: 'Manager',
  MD: 'Managing Director',
  SUPER_ADMIN: 'Super Admin',
};

export const ALL_ROLES = Object.values(ROLES);

export const MANAGEMENT_ROLES = [ROLES.MANAGER, ROLES.MD, ROLES.SUPER_ADMIN];

export const mapSlugToRole = (slug) => {
  if (!slug) return null;

  const normalized = slug.toLowerCase().replace(/[-_]/g, '');

  if (normalized === 'managingdirector' || normalized === 'md') {
    return ROLES.MD;
  }

  if (normalized === 'admin' || normalized === 'superadmin') {
    return ROLES.SUPER_ADMIN;
  }

  if (normalized === 'mechanical' || normalized === 'mechanic' || normalized === 'floor') {
    return ROLES.FLOOR_SUPERVISOR;
  }

  if (normalized === 'waterwashsupervisor' || normalized === 'waterwash' || normalized === 'wash') {
    return ROLES.WATER_WASH_TEAM;
  }

  const matchedRole = Object.values(ROLES).find(r => {
    const rNorm = r.toLowerCase().replace(/[-_]/g, '');
    return rNorm === normalized || rNorm.includes(normalized) || normalized.includes(rNorm);
  });

  return matchedRole || null;
};
