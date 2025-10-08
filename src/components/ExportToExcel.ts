import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportToExcel = (reportName: string, reportData: any) => {
  if (!reportData) return;

  const rows = reportData?.data?.rows || reportData?.data;
  if (!rows || !rows.length) {
    console.error("No data available to export for", reportName);
    return;
  }

  // If rows are arrays, convert to objects using headers
  const headers = reportData?.data?.headers;

  const dataObjects = Array.isArray(rows[0])
    ? rows.map((row: any[]) => {
        const obj: Record<string, any> = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index];
        });
        return obj;
      })
    : rows; // if already objects, use as-is

  const worksheet = XLSX.utils.json_to_sheet(dataObjects);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `${reportName}.xlsx`);
};
