import { lazy } from 'react';
const InputTester = lazy(() => import('./InputTester'));
import { registry } from '../../core/registry';

export const registerInputTester = () => {
  registry.register({
    id: 'input-tester',
    name: 'Input Tester',
    description: 'Unified diagnostic for keyboard and mouse input integrity.',
    icon: '🎮',
    category: 'other',
    component: InputTester,
  });
};
