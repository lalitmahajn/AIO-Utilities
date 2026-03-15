import { registerAgeCalculator } from './age-calculator';
import { registerUnitConverter } from './unit-converter';
import { registerWorldClock } from './world-clock';

export const registerAllUtilities = () => {
  registerAgeCalculator();
  registerUnitConverter();
  registerWorldClock();
};
