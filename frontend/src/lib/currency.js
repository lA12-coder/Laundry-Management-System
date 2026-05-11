export const formatETB = (value) => {
  const amount = Number(value || 0);
  return `ETB ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};
