import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  Stack,
  Select,
  MenuItem,
  Pagination,
  Paper,
} from "@mui/material";
import Loader from "../Loader";
import EmptyState from "../EmptyState";

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  isLoading = false,
  emptyMessage = "No records found",
  onRowClick,
  onRowDoubleClick,
  showPagination = true,
  defaultItemsPerPage = 10,
  serverSide = false,
  totalCount = 0,
  page: serverPage = 0,
  rowsPerPage: serverRowsPerPage = 10,
  rowsPerPageOptions = [10, 25, 50],
  onPageChange,
  onRowsPerPageChange,
}) {
  const [localPage, setLocalPage] = useState(0);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(defaultItemsPerPage);

  const page = serverSide ? serverPage : localPage;
  const rowsPerPage = serverSide ? serverRowsPerPage : localRowsPerPage;

  const totalPages = serverSide
    ? Math.ceil(totalCount / rowsPerPage)
    : Math.ceil(data.length / rowsPerPage);

  const paginatedData =
    showPagination && !serverSide
      ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : data;

  const handlePageChange = (e, value) => {
    const newPage = value - 1;
    if (serverSide) {
      if (onPageChange) onPageChange(newPage);
    } else {
      setLocalPage(newPage);
    }
  };

  const handleRowsPerPageChange = (e) => {
    const newLimit = Number(e.target.value);
    if (serverSide) {
      if (onRowsPerPageChange) onRowsPerPageChange(newLimit);
    } else {
      setLocalRowsPerPage(newLimit);
      setLocalPage(0);
    }
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: 0,
          border: "1px solid rgba(0, 0, 0, 0.12)",
          boxShadow: "none",
          overflow: "hidden",
        }}
      >
        <TableContainer sx={{ border: "none", borderRadius: 0 }}>
          <Table
            sx={{
              borderCollapse: "separate",
              borderSpacing: 0,
              "& .MuiButton-root": {
                width: "auto",
                minWidth: "max-content",
                whiteSpace: "nowrap",
                flexShrink: 0,
              },
              "& .MuiButton-startIcon, & .MuiButton-endIcon": {
                flexShrink: 0,
              },
            }}
          >
            <TableHead>
              <TableRow>
                {columns.map((col, index) => {
                  const isActionColumn =
                    String(col.header || "").toLowerCase() === "actions";

                  return (
                    <TableCell
                      key={index}
                      sx={{
                        bgcolor: "#f0f4ff",
                        color: "#000000",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        textTransform: "none",
                        borderBottom: "none",
                        py: 2,
                        px: 3,
                        whiteSpace: "nowrap",
                        width: isActionColumn ? "1%" : col.width || "auto",
                        "&:first-of-type": { pl: 4 },
                        "&:last-of-type": { pr: 4 },
                      }}
                      width={isActionColumn ? "1%" : col.width || "auto"}
                    >
                      {col.header}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading || loading ? (
                <TableRow>
                  <TableCell
                    colSpan={Math.max(1, columns.length)}
                    align="center"
                    sx={{ py: 10 }}
                  >
                    <Loader text="Loading data..." />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={Math.max(1, columns.length)}
                    align="center"
                    sx={{ py: 1 }}
                  >
                    <EmptyState message={emptyMessage} />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={row.id || index}
                    onClick={() => onRowClick && onRowClick(row)}
                    onDoubleClick={() =>
                      onRowDoubleClick && onRowDoubleClick(row)
                    }
                    sx={{
                      bgcolor: "#FFFFFF",
                      cursor:
                        onRowClick || onRowDoubleClick ? "pointer" : "default",
                      transition: "background-color 0.2s",
                    }}
                  >
                    {columns.map((col, colIndex) => {
                      const isActionColumn = String(col.header || "")
                        .toLowerCase()
                        .includes("action");

                      return (
                        <TableCell
                          key={colIndex}
                          sx={{
                            py: 2.25,
                            px: 3,
                            color: "#334155",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            // whiteSpace: isActionColumn ? 'nowrap' : 'normal',
                            whiteSpace: "nowrap",
                            width: isActionColumn ? "1%" : col.width || "auto",
                            "&:first-of-type": { pl: 4 },
                            "&:last-of-type": { pr: 4 },
                          }}
                        >
                          {col.render
                            ? col.render(row)
                            : row[col.accessor] !== undefined &&
                                row[col.accessor] !== null
                              ? row[col.accessor]
                              : "—"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {showPagination && data.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "center", sm: "center" },
              p: 2,
              px: 3,
              gap: { xs: 2, sm: 0 },
              borderTop: "1px solid #E2E8F0",
              // bgcolor: '#FAFAFA'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Select
                size="small"
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                sx={{
                  fontSize: "0.875rem",
                  color: "#334155",
                  fontWeight: 600,
                  bgcolor: "#FFFFFF",
                  fieldset: { borderColor: "#E2E8F0", borderRadius: 0 },
                  height: 36,
                }}
              >
                {rowsPerPageOptions.map((num) => (
                  <MenuItem key={num} value={num} sx={{ fontSize: "0.875rem" }}>
                    {num}
                  </MenuItem>
                ))}
              </Select>
              <Typography
                variant="body2"
                sx={{ color: "#64748B", fontWeight: 500 }}
              >
                Showing {page * rowsPerPage + 1}-
                {Math.min(
                  (page + 1) * rowsPerPage,
                  serverSide ? totalCount : data.length,
                )}{" "}
                of {serverSide ? totalCount : data.length}
              </Typography>
            </Stack>

            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={handlePageChange}
              shape="rounded"
              sx={{
                "& .MuiPaginationItem-root": {
                  fontWeight: 600,
                  color: "#475569",
                  border: "1px solid transparent",
                  "&:hover": {
                    bgcolor: "#F1F5F9",
                  },
                },
                "& .Mui-selected": {
                  bgcolor: "#000f7e!important",
                  color: "#FFFFFF !important",
                  border: "none",
                  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
                  "&:hover": {
                    bgcolor: "#000f7e !important",
                  },
                },
              }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
