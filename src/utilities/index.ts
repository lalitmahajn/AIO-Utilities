import { registerAgeCalculator } from './age-calculator';
import { registerUnitConverter } from './unit-converter';
import { registerWorldClock } from './world-clock';
import { registerPdfTools } from './pdf-tools';

export const registerAllUtilities = () => {
  registerAgeCalculator();
  registerUnitConverter();
  registerWorldClock();
  registerPdfTools();
};
