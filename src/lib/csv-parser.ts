/**
 * Robust CSV and TSV (Tab-separated values from Google Sheets / Excel clipboard) parser.
 * Handles quoted fields, commas inside quotes, tabs, newlines, and headers.
 */

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, string>[];
  rawRows: string[][];
}

export function parseSheetData(input: string): ParsedSheet {
  if (!input || !input.trim()) {
    return { headers: [], rows: [], rawRows: [] };
  }

  // Detect delimiter: tab (Sheets/Excel copy-paste) or comma (CSV) or semicolon
  const firstLine = input.trim().split(/\r?\n/)[0] || "";
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;

  let delimiter = ",";
  if (tabCount >= commaCount && tabCount >= semicolonCount && tabCount > 0) {
    delimiter = "\t";
  } else if (semicolonCount > commaCount && semicolonCount > 0) {
    delimiter = ";";
  }

  const lines = parseDelimitedLines(input.trim(), delimiter);
  if (lines.length === 0) {
    return { headers: [], rows: [], rawRows: [] };
  }

  const rawHeaders = lines[0].map((h) => h.trim());
  const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rowValues = lines[i];
    // Skip empty lines
    if (rowValues.length === 0 || (rowValues.length === 1 && !rowValues[0].trim())) {
      continue;
    }

    const rowObj: Record<string, string> = {};
    for (let j = 0; j < rawHeaders.length; j++) {
      const colKey = headers[j] || `col_${j}`;
      rowObj[colKey] = (rowValues[j] || "").trim();
    }
    rows.push(rowObj);
  }

  return {
    headers: rawHeaders,
    rows,
    rawRows: lines.slice(1),
  };
}

function parseDelimitedLines(text: string, delimiter: string): string[][] {
  const result: string[][] = [];
  let currentLine: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentLine.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++; // skip \n
      }
      currentLine.push(currentField);
      result.push(currentLine);
      currentLine = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentLine.length > 0) {
    currentLine.push(currentField);
    result.push(currentLine);
  }

  return result;
}

/**
 * Normalizes fuzzy column names to standard keys.
 */
export function findColumnValue(row: Record<string, string>, possibleKeys: string[]): string {
  const rowKeys = Object.keys(row);
  for (const candidate of possibleKeys) {
    const cleanCand = candidate.toLowerCase().replace(/[^a-z0-9]/g, "");
    const match = rowKeys.find((k) => k === cleanCand || k.includes(cleanCand) || cleanCand.includes(k));
    if (match && row[match] !== undefined && row[match] !== "") {
      return row[match];
    }
  }
  return "";
}
