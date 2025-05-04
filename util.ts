import moment from "moment";

export function parseDateFromFilename(filename: string): moment.Moment | null {
  // Match YYYY-MM-DD format (adjust regex as needed)
  const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
  if (!dateMatch) return null;
  
  return moment(dateMatch[0], "YYYY-MM-DD");
}