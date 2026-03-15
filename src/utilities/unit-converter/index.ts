import UnitConverter from './UnitConverter';
import { registry } from '../../core/registry';

export const registerUnitConverter = () => {
  registry.register({
    id: 'unit-converter',
    name: 'Unit Converter',
    description: 'Convert between different units of length, weight, and temperature.',
    icon: '📐',
    category: 'converters',
    component: UnitConverter,
  });
};
