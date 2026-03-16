import { lazy } from 'react';
const WorldClock = lazy(() => import('./WorldClock'));
import { registry } from '../../core/registry';

export const registerWorldClock = () => {
  registry.register({
    id: 'world-clock',
    name: 'World Clock',
    description: 'Track multiple timezones and convert hours instantly.',
    icon: '🌍',
    category: 'productivity',
    component: WorldClock,
  });
};

export default WorldClock;
