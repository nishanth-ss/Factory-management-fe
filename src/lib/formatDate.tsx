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
