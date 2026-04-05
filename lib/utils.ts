export const formatCurrency = (value: number, currency: string = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    // Fallback if currency code is invalid or formatting fails
    const formattedValue = value.toFixed(2);
    return `$${formattedValue}`;
  }
};
