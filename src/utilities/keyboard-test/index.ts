import { lazy } from 'react';
const KeyboardTest = lazy(() => import('./KeyboardTest'));
import { registry } from '../../core/registry';

export const registerKeyboardTest = () => {
  registry.register({
    id: 'keyboard-test',
    name: 'Keyboard Test',
    description: 'Real-time input diagnostic for mechanical and membrane arrays.',
    icon: '⌨️',
    category: 'other',
    component: KeyboardTest,
  });
};
