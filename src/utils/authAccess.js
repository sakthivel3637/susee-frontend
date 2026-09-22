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

export const hasReadablePath = (modules = [], path) => {
  const requestedPath = normalizePath(path);

  return getReadableMenus(modules).some((menu) => {
    const menuPath = routePatternToBasePath(menu.path);
    return requestedPath === menuPath || requestedPath.startsWith(`${menuPath}/`);
  });
};

export const hasMenuAction = (modules = [], path, action) => {
  const requestedPath = normalizePath(path);

  return flattenMenuModules(modules).some((menu) => {
    const menuPath = routePatternToBasePath(menu.path);
    return (requestedPath === menuPath || requestedPath.startsWith(`${menuPath}/`)) && menu[action] === true;
  });
};

export const hasAnyReadableMenu = (modules = []) => getReadableMenus(modules).length > 0;

export const getDepartmentFromModules = (modules = []) => {
  if (hasReadableModule(modules, 'body-shop-supervisor')) return 'body-shop';
  if (hasReadableModule(modules, 'water-wash-team')) return 'water-wash';
  if (hasReadableModule(modules, 'floor-supervisor')) return 'mechanical';
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
