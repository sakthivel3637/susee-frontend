import useAuthStore from '../store/useAuthStore';
import { hasMenuAction, hasReadableModule, hasReadablePath } from '../utils/authAccess';

export const usePermissions = () => {
  const { role, menus } = useAuthStore();

  const hasRole = () => false;
  const hasModule = (moduleNames) => hasReadableModule(menus, moduleNames);
  const hasPath = (path) => hasReadablePath(menus, path);
  const canRead = (path) => hasMenuAction(menus, path, 'canRead');
  const canCreate = (path) => hasMenuAction(menus, path, 'canCreate');
  const canUpdate = (path) => hasMenuAction(menus, path, 'canUpdate');
  const canDelete = (path) => hasMenuAction(menus, path, 'canDelete');

  const isManagement = () => hasModule(['manager', 'managing-director', 'admin']);
  const canApprove = () => hasModule(['manager', 'managing-director', 'admin', 'crm-team']);
  const canManageUsers = () => hasPath('/users');
  const canViewReports = () => hasPath('/reports');
  const canAccessMasters = () => hasModule('admin');
  const canAssignWork = () => hasPath('/assign-mechanic') || hasPath('/body-shop-assign-mechanic') || hasPath('/water-wash-assign-member');

  return {
    role,
    hasRole,
    hasModule,
    hasPath,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    isManagement,
    canApprove,
    canManageUsers,
    canViewReports,
    canAccessMasters,
    canAssignWork,
  };
};
