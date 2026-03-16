import { registerAgeCalculator } from './age-calculator';
import { registerUnitConverter } from './unit-converter';
import { registerWorldClock } from './world-clock';
import { registerPdfTools } from './pdf-tools';
import { registerImageTools } from './image-tools';
import { registerQrGenerator } from './generators';
import { registerGrammarChecker } from './grammar-checker';

export const registerAllUtilities = () => {
  registerAgeCalculator();
  registerUnitConverter();
  registerWorldClock();
  registerPdfTools();
  registerImageTools();
  registerQrGenerator();
  registerGrammarChecker();
};
