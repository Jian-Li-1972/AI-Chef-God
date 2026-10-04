/**
 * Utility to scale recipe ingredient quantities.
 */

/**
 * Converts a fraction string (e.g., "1/2") to a decimal number.
 */
const fractionToDecimal = (fraction: string): number => {
  const parts = fraction.split('/');
  if (parts.length === 2) {
    const numerator = parseFloat(parts[0]);
    const denominator = parseFloat(parts[1]);
    if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }
  return parseFloat(fraction);
};

/**
 * Converts a decimal number back to a fraction string if it's a common fraction.
 */
const decimalToFraction = (decimal: number): string => {
  if (Number.isInteger(decimal)) return decimal.toString();
  
  const tolerance = 0.01;
  const commonFractions = [
    { n: 1, d: 2, s: "1/2" },
    { n: 1, d: 3, s: "1/3" },
    { n: 2, d: 3, s: "2/3" },
    { n: 1, d: 4, s: "1/4" },
    { n: 3, d: 4, s: "3/4" },
    { n: 1, d: 8, s: "1/8" },
    { n: 3, d: 8, s: "3/8" },
    { n: 5, d: 8, s: "5/8" },
    { n: 7, d: 8, s: "7/8" },
  ];

  const whole = Math.floor(decimal);
  const remainder = decimal - whole;

  if (remainder < tolerance) return whole.toString();
  if (1 - remainder < tolerance) return (whole + 1).toString();

  for (const f of commonFractions) {
    if (Math.abs(remainder - (f.n / f.d)) < tolerance) {
      return whole > 0 ? `${whole} ${f.s}` : f.s;
    }
  }

  return decimal.toFixed(2).replace(/\.?0+$/, '');
};

/**
 * Scales a quantity string by a given factor.
 * Handles formats like "2", "1/2", "1 1/2", "500g", "2.5 cups".
 */
export const scaleQuantity = (quantity: string, factor: number): string => {
  if (factor === 1) return quantity;
  
  // Regex to find numbers (including fractions and mixed numbers)
  // 1. Mixed numbers: "1 1/2"
  // 2. Fractions: "1/2"
  // 3. Decimals/Integers: "2.5", "2"
  const mixedRegex = /^(\d+)\s+(\d+\/\d+)(.*)$/;
  const fractionRegex = /^(\d+\/\d+)(.*)$/;
  const numberRegex = /^(\d*\.?\d+)(.*)$/;

  let match;
  let value = 0;
  let suffix = "";

  if ((match = quantity.match(mixedRegex))) {
    value = parseInt(match[1]) + fractionToDecimal(match[2]);
    suffix = match[3];
  } else if ((match = quantity.match(fractionRegex))) {
    value = fractionToDecimal(match[1]);
    suffix = match[2];
  } else if ((match = quantity.match(numberRegex))) {
    value = parseFloat(match[1]);
    suffix = match[2];
  } else {
    // If no number found at the start, just return as is
    return quantity;
  }

  const scaledValue = value * factor;
  return `${decimalToFraction(scaledValue)}${suffix}`;
};
