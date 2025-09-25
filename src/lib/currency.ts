/**
 * Utility functions for formatting currency in Indian Rupees
 */

/**
 * Format a number as Indian Rupees with proper locale formatting
 * @param amount - The number to format
 * @param showSymbol - Whether to show the ₹ symbol (default: true)
 * @returns Formatted currency string
 */
export function formatINR(amount: number | string | null | undefined, showSymbol: boolean = true): string {
  // Handle null, undefined, or empty values
  if (amount === null || amount === undefined || amount === '') {
    return showSymbol ? '₹0.00' : '0.00';
  }

  // Convert to number
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle invalid numbers
  if (isNaN(numAmount)) {
    return showSymbol ? '₹0.00' : '0.00';
  }

  // Format using Indian locale with Indian Rupee
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);

  // If showSymbol is false, remove the ₹ symbol
  if (!showSymbol) {
    return formatted.replace('₹', '').trim();
  }

  return formatted;
}

/**
 * Format a number as Indian Rupees without currency symbol (for input fields)
 * @param amount - The number to format
 * @returns Formatted number string without symbol
 */
export function formatINRNumber(amount: number | string | null | undefined): string {
  // Handle null, undefined, or empty values
  if (amount === null || amount === undefined || amount === '') {
    return '0.00';
  }

  // Convert to number
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle invalid numbers
  if (isNaN(numAmount)) {
    return '0.00';
  }

  // Format using Indian locale with decimal style (no currency symbol)
  return new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * Parse a formatted Indian Rupee string back to number
 * @param formattedAmount - The formatted currency string
 * @returns Parsed number
 */
export function parseINR(formattedAmount: string): number {
  if (!formattedAmount) return 0;
  
  // Remove currency symbol, commas, spaces (including non-breaking spaces)
  const cleanAmount = formattedAmount
    .replace(/₹/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')  // Remove all spaces
    .replace(/\u00A0/g, '') // Remove non-breaking spaces
    .trim();
  
  const parsed = parseFloat(cleanAmount);
  return isNaN(parsed) ? 0 : parsed;
}