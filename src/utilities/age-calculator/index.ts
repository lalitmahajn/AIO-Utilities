import { lazy } from 'react';
const AgeCalculator = lazy(() => import('./AgeCalculator'));
import { registry } from '../../core/registry';

export const registerAgeCalculator = () => {
  registry.register({
    id: 'age-calculator',
    name: 'Age Calculator',
    description: 'Calculate your exact age in years, months, and days.',
    icon: '🎂',
    category: 'calculators',
    component: AgeCalculator,
  });
};
