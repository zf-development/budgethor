export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = splitCsvLines(source);
  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(lines[0] ?? "");
  const table = lines.map((line) => parseCsvLine(line, delimiter)).filter((row) => {
    return row.some((cell) => cell.trim() !== "");
  });
  const headers = (table[0] ?? []).map((header) => header.trim());
  const rows = table.slice(1).map((row) => {
    const padded = [...row];
    while (padded.length < headers.length) padded.push("");
    return padded.slice(0, headers.length);
  });
  return { headers, rows };
}

function detectDelimiter(headerLine: string) {
  const counts = {
    ",": (headerLine.match(/,/g) ?? []).length,
    ";": (headerLine.match(/;/g) ?? []).length,
    "\t": (headerLine.match(/\t/g) ?? []).length,
  };
  if (counts[";"] >= counts[","] && counts[";"] >= counts["\t"] && counts[";"] > 0) return ";";
  if (counts["\t"] > counts[","] && counts["\t"] > 0) return "\t";
  return ",";
}

function splitCsvLines(source: string) {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }
    if (char === "\n" && !inQuotes) {
      lines.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current) lines.push(current);
  return lines;
}

function parseCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}
