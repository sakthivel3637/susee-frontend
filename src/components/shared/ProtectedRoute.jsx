import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { ROUTES } from '../../config/routes';
import { getFirstReadablePath, hasMenuAction, hasReadableModule, hasReadablePath, normalizePath } from '../../utils/authAccess';

const AUTHENTICATED_ONLY_PATHS = new Set([ ROUTES.PROFILE, ROUTES.SETTINGS ]);

const getRequiredAction = (path) => {
  const normalized = normalizePath(path);
  const segments = normalized.split('/').filter(Boolean);

  if (segments.some((segment) => ['new', 'create'].includes(segment))) {
    return 'canCreate';
  }

  if (segments.some((segment) => ['edit', 'update'].includes(segment))) {
    return 'canUpdate';
  }

  return 'canRead';
};

export default function ProtectedRoute({ allowedModules = [], requiredPath, enforcePath = false }) {
  // Original:
  // const { isAuthenticated, menus } = useAuthStore();
  const { isAuthenticated, menus, role, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Restrict screen access to Role Management, Stage Schedule, and Vehicle Entry for Managing Director login
  const isMD =
    String(role || '').toLowerCase().replace(/[-_\s]+/g, '') === 'md' ||
    String(role || '').toLowerCase().replace(/[-_\s]+/g, '') === 'managingdirector' ||
    String(user?.role?.slug || '').toLowerCase().replace(/[-_\s]+/g, '') === 'md' ||
    String(user?.role?.slug || '').toLowerCase().replace(/[-_\s]+/g, '') === 'managingdirector' ||
    String(user?.role?.name || '').toLowerCase().replace(/[-_\s]+/g, '') === 'managingdirector';

  const currentNormalizedPath = normalizePath(location.pathname);
  const isRestrictedMdScreen =
    isMD &&
    (currentNormalizedPath === '/roles' ||
      currentNormalizedPath.startsWith('/roles/') ||
      currentNormalizedPath === '/md-stage-schedules' ||
      currentNormalizedPath.startsWith('/md-stage-schedules/') ||
      currentNormalizedPath === '/gate-entry' ||
      currentNormalizedPath.startsWith('/gate-entry/'));

  if (isRestrictedMdScreen) {
    return <Navigate to={ROUTES.MD_DASHBOARD} replace />;
  }

  if (allowedModules.length > 0 && !hasReadableModule(menus, allowedModules)) {
    return <Navigate to={getFirstReadablePath(menus, ROUTES.PROFILE)} replace />;
  }

  const pathToCheck = requiredPath || (enforcePath ? location.pathname : null);

  if (pathToCheck && AUTHENTICATED_ONLY_PATHS.has(pathToCheck)) {
    return <Outlet />;
  }

  if (pathToCheck && getRequiredAction(pathToCheck) === 'canRead' && !hasReadablePath(menus, pathToCheck)) {
    return <Navigate to={getFirstReadablePath(menus, ROUTES.PROFILE)} replace />;
  }

  if (pathToCheck && getRequiredAction(pathToCheck) !== 'canRead' && !hasMenuAction(menus, pathToCheck, getRequiredAction(pathToCheck))) {
    return <Navigate to={getFirstReadablePath(menus, ROUTES.PROFILE)} replace />;
  }

  return <Outlet />;
}
