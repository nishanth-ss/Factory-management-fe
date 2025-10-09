// src/components/FormattedDate.tsx
import React from "react";
import { format, parseISO } from "date-fns";

interface FormattedDateProps {
  date: string | Date | null | undefined;
  formatString?: string; // Optional custom format
}

const FormattedDate: React.FC<FormattedDateProps> = ({
  date,
  formatString = "dd/MM/yyyy HH:mm:ss",
}) => {
  if (!date) return <span>Not available</span>;

  let parsedDate: Date;
  try {
    parsedDate = typeof date === "string" ? parseISO(date) : date;
  } catch {
    return <span>Invalid date</span>;
  } 

  return <span>{format(parsedDate, formatString)}</span>;
};

export default FormattedDate;


export function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffDay) > 0) return rtf.format(-diffDay, 'day');
  if (Math.abs(diffHour) > 0) return rtf.format(-diffHour, 'hour');
  if (Math.abs(diffMin) > 0) return rtf.format(-diffMin, 'minute');
  return rtf.format(-diffSec, 'second');
}