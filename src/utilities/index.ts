import { registerAgeCalculator } from './age-calculator';
import { registerUnitConverter } from './unit-converter';
import { registerWorldClock } from './world-clock';
import { registerPdfTools } from './pdf-tools';
import { registerImageTools } from './image-tools';
import { registerQrGenerator } from './generators';
import { registerGrammarChecker } from './grammar-checker';
import { registerMouseTest } from './mouse-test';
import { registerKeyboardTest } from './keyboard-test';

export const registerAllUtilities = () => {
  registerAgeCalculator();
  registerUnitConverter();
  registerWorldClock();
  registerPdfTools();
  registerImageTools();
  registerQrGenerator();
  registerGrammarChecker();
  registerMouseTest();
  registerKeyboardTest();
};
