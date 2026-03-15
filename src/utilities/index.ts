import { registerAgeCalculator } from './age-calculator';
import { registerUnitConverter } from './unit-converter';

export const registerAllUtilities = () => {
  registerAgeCalculator();
  registerUnitConverter();
  // Add more utility registrations here
};
