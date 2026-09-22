import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Card,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  MenuItem,
  Select,
} from "@mui/material";
import Button from "../../components/common/Button";
import BackButton from "../../components/common/BackButton";
import Input from "../../components/common/Input";
import { toastSuccess, toastError } from "../../notifications/toast";
import { ROUTES } from "../../config/routes";
import { getMenusApi } from "../../api/menuApi";
import {
  getRoleMenuPermissionsApi,
  createRoleApi,
  updateRoleApi,
  saveRoleMenuPermissionsApi,
  updateRoleMenuPermissionsApi,
} from "../../api/roleApi";
import { usePermissions } from "../../hooks/usePermissions";

const flattenMenus = (menus) => {
  let flat = [];
  menus.forEach((m) => {
    flat.push({
      menuId: m.id || m.menuId,
      name: m.name,
      path: m.path,
      canRead: m.canRead || false,
      canCreate: m.canCreate || false,
      canUpdate: m.canUpdate || false,
      canDelete: m.canDelete || false,
    });
    if (m.children && m.children.length > 0) {
      flat = [...flat, ...flattenMenus(m.children)];
    }
  });
  return flat;
};

const formatModuleName = (slug) => {
  if (!slug) return "";
  return slug
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const validateDesignation = (value) => {
  if (!value.trim()) {
    return "Role Name is required";
  }
  if (value.length > 50) {
    return "Role Name must not exceed 50 characters";
  }
  const lettersOnlyRegex = /^[a-zA-Z\s]+$/;
  if (!lettersOnlyRegex.test(value)) {
    return "Role Name must contain letters and spaces only";
  }
  return "";
};

const isReadOnlyMenu = (menu) => {
  const path = String(menu?.path || "").toLowerCase();
  const name = String(menu?.name || "").toLowerCase();

  return (
    path.includes("dashboard") ||
    name.includes("dashboard") ||
    path.includes("kiosk/tv") ||
    name.includes("tv display") ||
    path.includes("notifications") ||
    name.includes("notification") ||
    path.includes("audit-logs") ||
    name.includes("audit log")
  );
};

const supportsPermissionAction = (menu, type) => {
  if (type === "canDelete") return false;
  return type === "canRead" || !isReadOnlyMenu(menu);
};

export default function RolePrivilegesForm() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const roleIdentifier = slug;
  const isEdit = !!roleIdentifier;
  const { canCreate, canUpdate } = usePermissions();
  const canSaveRolePermissions = isEdit
    ? canUpdate("/roles")
    : canCreate("/roles");

  const [designation, setDesignation] = useState("");
  const [designationError, setDesignationError] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [modulesList, setModulesList] = useState([]);

  const mobileModules = ["crm-team", "gate-security"];
  const isMobileModule = mobileModules.includes(selectedModule);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (isEdit) {
          const res = await getRoleMenuPermissionsApi(roleIdentifier);
          if (res?.success) {
            const role = res.data.role;
            const roleName = role.name;
            setDesignation(roleName);
            const modules = res.data.modules || [];
            setModulesList(modules);

            if (role.slug && role.slug !== roleIdentifier) {
              navigate(
                ROUTES.ADMIN_ROLE_PRIVILEGES_EDIT.replace(":slug", role.slug),
                { replace: true },
              );
            }

            if (modules.length > 0) {
              const moduleWithPermissions = modules.find((m) =>
                (m.menus || []).some(
                  (menu) =>
                    menu.canRead ||
                    menu.canCreate ||
                    menu.canUpdate ||
                    menu.canDelete,
                ),
              );
              const roleWords = roleName.toLowerCase().split(/[\s_-]+/);
              const matchingModule = modules.find((m) => {
                const moduleWords = m.module.toLowerCase().split(/[\s_-]+/);
                return roleWords.some((rWord) =>
                  moduleWords.some(
                    (mWord) => mWord.includes(rWord) || rWord.includes(mWord),
                  ),
                );
              });
              setSelectedModule(
                (moduleWithPermissions || matchingModule || modules[0]).module,
              );
            }
          }
        } else {
          const res = await getMenusApi();
          if (res?.success) {
            const mapped = (res.data.modules || []).map((mod) => ({
              module: mod.module,
              menus: flattenMenus(mod.menus),
            }));

            setModulesList(mapped);
          }
        }
      } catch (error) {
        toastError(error?.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isEdit, roleIdentifier, navigate]);

  const handleCheckboxChange = (moduleIndex, menuIndex, type) => {
    const updated = [...modulesList];
    const menu = updated[moduleIndex].menus[menuIndex];
    if (!supportsPermissionAction(menu, type)) return;

    updated[moduleIndex].menus[menuIndex][type] =
      !updated[moduleIndex].menus[menuIndex][type];
    setModulesList(updated);
  };

  const handleSelectAllChange = (moduleIndex, menuIndex) => {
    const updated = [...modulesList];
    const menu = updated[moduleIndex].menus[menuIndex];
    const actions = ["canRead", "canCreate", "canUpdate", "canDelete"].filter(
      (type) => supportsPermissionAction(menu, type),
    );
    const allChecked = actions.every((type) => menu[type]);

    actions.forEach((type) => {
      menu[type] = !allChecked;
    });

    if (isReadOnlyMenu(menu)) {
      menu.canCreate = false;
      menu.canUpdate = false;
      menu.canDelete = false;
    }

    updated[moduleIndex].menus[menuIndex] = menu;
    setModulesList(updated);
  };

  const renderPermissionCell = (menu, moduleIndex, menuIndex, type) => {
    if (!supportsPermissionAction(menu, type)) {
      return (
        <Typography variant="body2" color="text.secondary">
          -
        </Typography>
      );
    }

    return (
      <Checkbox
        checked={menu[type]}
        onChange={() => handleCheckboxChange(moduleIndex, menuIndex, type)}
        sx={{ color: "#CBD5E1", "&.Mui-checked": { color: "primary.main" } }}
      />
    );
  };

  const handleSave = async () => {
    const errorMsg = validateDesignation(designation);
    if (errorMsg) {
      setDesignationError(errorMsg);
      toastError(errorMsg);
      return;
    }

    if (!selectedModule) {
      toastError("Module is required");
      return;
    }

    const isMobile = mobileModules.includes(selectedModule);
    if (!isMobile) {
      const selectedMod = modulesList.find((m) => m.module === selectedModule);
      const hasPrivilege = selectedMod?.menus?.some(
        (menu) => menu.canRead || menu.canCreate || menu.canUpdate || menu.canDelete
      );
      if (!hasPrivilege) {
        toastError("At least one privilege must be assigned.");
        return;
      }
    }

    // Flatten payload
    let permissionsPayload = [];

    const modulesToSave = selectedModule
      ? modulesList.filter((m) => m.module === selectedModule)
      : modulesList;

    modulesToSave.forEach((mod) => {
      const isMobile = mobileModules.includes(mod.module);
      mod.menus.forEach((menu) => {
        permissionsPayload.push({
          menuId: menu.menuId,
          canRead: isMobile ? true : menu.canRead,
          canCreate: isMobile
            ? true
            : supportsPermissionAction(menu, "canCreate")
              ? menu.canCreate
              : false,
          canUpdate: isMobile
            ? true
            : supportsPermissionAction(menu, "canUpdate")
              ? menu.canUpdate
              : false,
          canDelete: false,
        });
      });
    });

    if (permissionsPayload.length === 0) {
      toastError("No permissions available to save.");
      return;
    }

    try {
      setSaving(true);
      let roleId = roleIdentifier;

      if (isEdit) {
        const roleRes = await updateRoleApi(roleId, {
          name: designation.trim(),
        });
        roleId = roleRes?.data?.role?.id || roleId;
        await updateRoleMenuPermissionsApi(roleId, permissionsPayload);
        toastSuccess(
          `Role privileges for "${designation}" updated successfully!`,
        );
      } else {
        const roleRes = await createRoleApi({ name: designation.trim() });
        roleId = roleRes.data.role.id;
        await saveRoleMenuPermissionsApi(roleId, permissionsPayload);
        toastSuccess(
          `Role privileges for "${designation}" saved successfully!`,
        );
      }
      navigate(ROUTES.ADMIN_ROLES);
    } catch (error) {
      toastError(
        error?.response?.data?.message || "Failed to save role privileges",
      );
    } finally {
      setSaving(false);
    }
  };

  const availableModuleNames = modulesList.map((m) => m.module);
  const displayedModules = selectedModule
    ? modulesList.filter((m) => m.module === selectedModule)
    : [];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? "Edit" : "Add"} Role Privileges
        </Typography>
        <BackButton to={ROUTES.ADMIN_ROLES} label="Back to Role Privileges" />
      </Box>

      <Card
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          border: "1px solid #E2E8F0",
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Input
              label="Role Name"
              required
              placeholder="Enter Role Name"
              value={designation}
              onChange={(e) => {
                const val = e.target.value;
                const cleanVal = val.replace(/[^a-zA-Z\s]/g, "");
                setDesignation(cleanVal);
                setDesignationError(validateDesignation(cleanVal));
              }}
              error={designationError}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2, width: "100%" }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#334155", mb: 0.75 }}
              >
                Module
              </Typography>
              <Select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                fullWidth
                size="small"
                disabled={loading}
                displayEmpty
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    bgcolor: "#FFFFFF",
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Select Module
                </MenuItem>
                {availableModuleNames.map((m) => (
                  <MenuItem key={m} value={m}>
                    {formatModuleName(m)}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {isMobileModule ? (
        <Card
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            border: "1px solid #E2E8F0",
            bgcolor: "#F8FAFC",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontWeight: 600 }}
          >
            This module uses default Mobile application permissions. Permissions
            are assigned automatically.
          </Typography>
        </Card>
      ) : (
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            border: "1px solid #E2E8F0",
            overflow: "hidden",
          }}
        >
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#475569",
                      borderBottom: "2px solid #E2E8F0",
                    }}
                  >
                    Module Name
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 600,
                      color: "#475569",
                      borderBottom: "2px solid #E2E8F0",
                    }}
                  >
                    Read
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 600,
                      color: "#475569",
                      borderBottom: "2px solid #E2E8F0",
                    }}
                  >
                    Create
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 600,
                      color: "#475569",
                      borderBottom: "2px solid #E2E8F0",
                    }}
                  >
                    Update
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 600,
                      color: "#475569",
                      borderBottom: "2px solid #E2E8F0",
                    }}
                  >
                    Delete
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 600,
                      color: "#475569",
                      borderBottom: "2px solid #E2E8F0",
                    }}
                  >
                    Select All
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : displayedModules.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{ py: 3, color: "#64748B" }}
                    >
                      Please select a module to view its permissions
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedModules.map((mod) => {
                    // Find original index to update state correctly
                    const moduleIndex = modulesList.findIndex(
                      (m) => m.module === mod.module,
                    );

                    return mod.menus.map((menu, menuIndex) => {
                      const selectableActions = [
                        "canRead",
                        "canCreate",
                        "canUpdate",
                        "canDelete",
                      ].filter((type) => supportsPermissionAction(menu, type));
                      const allChecked = selectableActions.every(
                        (type) => menu[type],
                      );
                      return (
                        <TableRow
                          key={menu.menuId}
                          hover
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, color: "#334155" }}>
                            <Typography
                              variant="body2"
                              component="span"
                              sx={{
                                color: "#94A3B8",
                                mr: 1,
                                fontSize: "0.75rem",
                              }}
                            >
                              {formatModuleName(mod.module)} /
                            </Typography>
                            {menu.name}
                          </TableCell>
                          <TableCell align="center">
                            {renderPermissionCell(
                              menu,
                              moduleIndex,
                              menuIndex,
                              "canRead",
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {renderPermissionCell(
                              menu,
                              moduleIndex,
                              menuIndex,
                              "canCreate",
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {renderPermissionCell(
                              menu,
                              moduleIndex,
                              menuIndex,
                              "canUpdate",
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {renderPermissionCell(
                              menu,
                              moduleIndex,
                              menuIndex,
                              "canDelete",
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={allChecked}
                              onChange={() =>
                                handleSelectAllChange(moduleIndex, menuIndex)
                              }
                              sx={{
                                color: "#94A3B8",
                                "&.Mui-checked": { color: "primary.main" },
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
        <Button
          variant="secondary"
          onClick={() => navigate(ROUTES.ADMIN_ROLES)}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          isLoading={saving}
          onClick={handleSave}
          disabled={loading || saving || !canSaveRolePermissions}
        >
          {isEdit ? "Save Changes" : "Add Role Privileges"}
        </Button>
      </Box>
    </Box>
  );
}
