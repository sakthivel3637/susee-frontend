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

export const flattenMenuModules = (modules = []) => {
  const flat = [];

  const visit = (menus = [], moduleName) => {
    menus.forEach((menu) => {
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
  const menuIsAddWork = ADDITIONAL_WORK_PATHS.some((p) => menuPath === p || menuPath.startsWith(`${p}/`));

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

  return flattenMenuModules(modules).some((menu) => {
    const menuPath = routePatternToBasePath(menu.path);
    const matches = arePathsEquivalent(requestedPath, menuPath);
    if (!matches) return false;

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
      const sourceMenus = (moduleItem.menus || []).filter((menu) => menu.canRead !== false && menu.path !== '/master-categories')
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
          label: menu.name,
          path: menu.path,
          icon: iconMap[menu.icon] || ICON_FALLBACK,
          children: (menu.children || [])
            .map((child) => ({
              label: child.name,
              path: child.path,
              icon: iconMap[child.icon] || ICON_FALLBACK
            }))
        }))
      };
    })
    .filter((moduleItem) => moduleItem.menus.length > 0)
    .flatMap((moduleItem) => moduleItem.menus);
};
