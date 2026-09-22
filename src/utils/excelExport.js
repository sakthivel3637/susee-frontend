/**
 * Triggers the browser to download a binary file.
 * @param {Blob} blob - Binary file data.
 * @param {string} defaultFileName - Name of the file.
 */
export const downloadExcelFile = (blob, defaultFileName = 'export.xlsx') => {
  const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultFileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
