const ICON_FALLBACK = null;

export const normalizeAccessKey = (value) => String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-');

export const normalizePath = (path) => {
  const cleanPath = String(path || '').split('?')[0].replace(/\/+$/, '');
  return cleanPath || '/';
};

const routePatternToBasePath = (path) => {
  const normalized = normalizePath(path);
  const dynamicIndex = normalized.indexOf('/:');
  return dynamicIndex >= 0 ? normalized.slice(0, dynamicIndex) : normalized;
};

export const isManagingDirectorRole = (role, user) => {
  const normalizedRole = String(role || '').toLowerCase().replace(/[-_\s]+/g, '');
  const userSlug = String(user?.role?.slug || '').toLowerCase().replace(/[-_\s]+/g, '');
  const userName = String(user?.role?.name || '').toLowerCase().replace(/[-_\s]+/g, '');

  return (
    normalizedRole === 'md' ||
    normalizedRole === 'managingdirector' ||
    userSlug === 'md' ||
    userSlug === 'managingdirector' ||
    userName === 'managingdirector'
  );
};

export const flattenMenuModules = (modules = []) => {
  const flat = [];

  const visit = (menus = [], moduleName) => {
    menus.forEach((menu) => {
      // Exclude Role Management, Stage Schedule, and Vehicle Entry for Managing Director module
      const isMdModule = normalizeAccessKey(moduleName) === 'managing-director';
      const cleanPath = normalizePath(menu.path);
      const isMdHiddenPath =
        isMdModule &&
        (cleanPath === '/roles' ||
          cleanPath.startsWith('/roles/') ||
          cleanPath === '/md-stage-schedules' ||
          cleanPath.startsWith('/md-stage-schedules/') ||
          cleanPath === '/gate-entry' ||
          cleanPath.startsWith('/gate-entry/'));

      if (isMdHiddenPath) {
        return;
      }

      /* Original code without MD screen/menu exclusion:
      flat.push({
        ...menu,
        module: moduleName,
        path: normalizePath(menu.path),
        canRead: menu.canRead !== false
      });
      */

      flat.push({
        ...menu,
        module: moduleName,
        path: normalizePath(menu.path),
        canRead: menu.canRead !== false
      });

      if (menu.children?.length) {
        visit(menu.children, moduleName);
      }
    });
  };

  modules.forEach((moduleItem) => {
    visit(moduleItem.menus || [], moduleItem.module);
  });

  return flat;
};

export const getReadableMenus = (modules = []) => {
  return flattenMenuModules(modules).filter((menu) => menu.canRead && menu.path && menu.path !== '#');
};

export const getFirstReadablePath = (modules = [], fallback = '/profile') => {
  const readable = getReadableMenus(modules);
  const menu = readable.find((item) => item.path !== '/admin/master-menu') || readable[0];
  return menu?.path || fallback;
};

export const hasReadableModule = (modules = [], moduleNames = []) => {
  const allowedModules = (Array.isArray(moduleNames) ? moduleNames : [moduleNames])
    .map(normalizeAccessKey);

  return getReadableMenus(modules).some((menu) => allowedModules.includes(normalizeAccessKey(menu.module)));
};

const ADDITIONAL_WORK_PATHS = ['/additional-work', '/body-shop-additional-work'];

const arePathsEquivalent = (requestedPath, menuPath) => {
  if (requestedPath === menuPath || requestedPath.startsWith(`${menuPath}/`)) {
    return true;
  }

  const reqIsAddWork = ADDITIONAL_WORK_PATHS.some((p) => requestedPath === p || requestedPath.startsWith(`${p}/`));
  const menuIsAddWork =
    ADDITIONAL_WORK_PATHS.some((p) => menuPath === p || menuPath.startsWith(`${p}/`)) ||
    menuPath === '/job-cards' ||
    menuPath.startsWith('/job-cards/');

  if (reqIsAddWork && menuIsAddWork) {
    return true;
  }

  return false;
};

export const hasReadablePath = (modules = [], path) => {
  const requestedPath = normalizePath(path);

  return getReadableMenus(modules).some((menu) => {
    const menuPath = routePatternToBasePath(menu.path);
    return arePathsEquivalent(requestedPath, menuPath);
  });
};

export const hasMenuAction = (modules = [], path, action) => {
  const requestedPath = normalizePath(path);
  const reqIsAddWork = ADDITIONAL_WORK_PATHS.some((p) => requestedPath === p || requestedPath.startsWith(`${p}/`));

  return flattenMenuModules(modules).some((menu) => {
    const menuPath = routePatternToBasePath(menu.path);
    const matches = arePathsEquivalent(requestedPath, menuPath);
    if (!matches) return false;

    if (reqIsAddWork && (menu.canCreate || menu.canUpdate || menu.canRead)) {
      return true;
    }

    if (menu[action] === true) return true;
    if (menu.canRead === true && (menu[action] === undefined || menu[action] === null || menu[action] === false)) {
      return true;
    }

    return false;
  });
};

export const hasAnyReadableMenu = (modules = []) => getReadableMenus(modules).length > 0;

export const isFloorSupervisor = (modules = []) => {
  return hasReadableModule(modules, 'floor-supervisor');
};

export const getDepartmentFromModules = (modules = []) => {
  if (hasReadableModule(modules, 'body-shop-supervisor')) return 'body-shop';
  if (hasReadableModule(modules, 'floor-supervisor')) return null;
  return null;
};

export const buildSidebarMenus = (modules = [], iconMap = {}) => {
  return modules
    .map((moduleItem) => {
      /* Original sourceMenus filter:
      const sourceMenus = (moduleItem.menus || []).filter(
        (menu) =>
          menu.canRead !== false &&
          menu.path !== '/master-categories' &&
          menu.path !== '/service-centers' &&
          // Hidden from sidebar menu as additional work is managed directly inside job cards
          menu.path !== '/additional-work' &&
          menu.path !== '/body-shop-additional-work'
      );
      */
      const isMdModule = normalizeAccessKey(moduleItem.module) === 'managing-director';
      const sourceMenus = (moduleItem.menus || []).filter(
        (menu) => {
          if (menu.canRead === false) return false;
          if (menu.path === '/master-categories') return false;
          if (menu.path === '/service-centers') return false;
          // Hidden from sidebar menu as additional work is managed directly inside job cards
          if (menu.path === '/additional-work' || menu.path === '/body-shop-additional-work') return false;
          // Hide Role Management, Stage Schedule, and Vehicle Entry for Managing Director module
          if (
            isMdModule &&
            (menu.path === '/roles' ||
              menu.path === '/md-stage-schedules' ||
              menu.path === '/gate-entry')
          ) {
            return false;
          }
          return true;
        }
      );
      const menuMap = new Map();

      sourceMenus.forEach((menu) => {
        const id = menu.menuId || menu.id;
        menuMap.set(id, { ...menu, children: [] });
      });

      const roots = [];

      sourceMenus.forEach((menu) => {
        const id = menu.menuId || menu.id;
        const current = menuMap.get(id);

        if (menu.parentId && menuMap.has(menu.parentId)) {
          menuMap.get(menu.parentId).children.push(current);
        } else {
          roots.push(current);
        }
      });

      return {
        ...moduleItem,
        menus: roots.map((menu) => ({
          label: menu.path === '/locations' ? 'Service Center & Location' : menu.name,
          path: menu.path,
          icon: iconMap[menu.icon] || ICON_FALLBACK,
          children: (menu.children || [])
            .map((child) => ({
              label: child.path === '/locations' ? 'Service Center & Location' : child.name,
              path: child.path,
              icon: iconMap[child.icon] || ICON_FALLBACK
            }))
        }))
      };
    })
    .filter((moduleItem) => moduleItem.menus.length > 0)
    .flatMap((moduleItem) => moduleItem.menus);
};
