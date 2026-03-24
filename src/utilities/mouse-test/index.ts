import { lazy } from 'react';
const MouseTest = lazy(() => import('./MouseTest'));
import { registry } from '../../core/registry';

export const registerMouseTest = () => {
  registry.register({
    id: 'mouse-test',
    name: 'Mouse Test',
    description: 'Verify button integrity, scroll precision, and double-click consistency.',
    icon: '🖱️',
    category: 'other',
    component: MouseTest,
  });
};
