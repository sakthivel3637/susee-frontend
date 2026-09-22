import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000F7E', // --blue
      light: '#000F7E', // --blue-light
      dark: '#1e3a8a', // --navy
    },
    secondary: {
      main: '#0891b2', // --cyan
      light: '#000F7E',
      dark: '#1e3a8a',
    },
    success: {
      main: '#000F7E', // --success
    },
    error: {
      main: '#dc2626', // --danger
    },
    warning: {
      main: '#d97706', // --warn
    },
    info: {
      main: '#000F7E', // --blue
    },
    background: {
      default: '#f0f4ff', // --bg
      paper: '#ffffff', // --surface
    },
    text: {
      primary: '#1e293b', // --text
      secondary: '#475569', // --text2
      disabled: '#94a3b8', // --text3
    },
    divider: '#dce6f5', // --border
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #000F7E 0%, #000F7E 100%)',
          boxShadow: '0 1px 3px rgba(37, 99, 235, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
          '&:hover': {
            background: '#1e3a8a',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #0891b2 0%, #3b82f6 100%)',
          boxShadow: 'none',
          '&:hover': {
            background: '#1e3a8a',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 4px 16px rgba(37, 99, 235, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)', // --shadow-md
          border: '1px solid #dce6f5', // --border
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: '#ffffff', // --surface
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation1: {
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#ffffff', // --white
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: '#dce6f5', // --border
            },
            '&:hover fieldset': {
              borderColor: '#c3d4ee', // --border2
            },
            '&.Mui-focused fieldset': {
              borderColor: '#000F7E', // --blue
              borderWidth: '1px',
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.15)',
            }
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#ffffff', // --white
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#dce6f5', // --border
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#c3d4ee', // --border2
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#000F7E', // --blue
            borderWidth: '1px',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.15)',
          }
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          color: '#475569', // --text2
          fontSize: '0.875rem',
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: 8,
          backgroundColor: '#ffffff',
          overflowX: 'auto',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f0f4ff', // --bg (#f0f4ff)
          '& .MuiTableCell-root': {
            color: '#475569', // --text2
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            padding: '16px 24px',
            borderBottom: '1px solid #dce6f5', // --border
            borderTop: 'none',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease',
          '&:nth-of-type(even)': {
            backgroundColor: '#f0f4ff',
          },
          '&:hover': {
            backgroundColor: '#E0E8FF !important',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          borderBottom: '1px solid #dce6f5', // --border
          color: '#1e293b', // --text
          fontSize: '0.875rem',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: 8,
          backgroundColor: '#ffffff', // --white
          overflow: 'hidden',
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #dce6f5', // --border
            padding: '8px 24px',
            color: '#1e293b', // --text
            fontSize: '0.875rem',
            '&:focus': { outline: 'none' },
            '&:focus-within': { outline: 'none' },
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f0f4ff', // --bg (#f0f4ff)
            borderBottom: '1px solid #dce6f5', // --border
            color: '#475569', // --text2
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
          },
          '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
          '& .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
          '& .MuiDataGrid-row': {
            transition: 'background-color 0.2s ease',
            '&:hover': { backgroundColor: '#eff6ff' }, // --blue-pale
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid #dce6f5', // --border
            backgroundColor: '#ffffff', // --white
          },
        },
      },
    },
  },
});

export default theme;
