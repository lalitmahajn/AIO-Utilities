import { lazy } from 'react';
const ImageConverter = lazy(() => import('./ImageConverter'));
import { registry } from '../../core/registry';

export function registerImageTools() {
  registry.register({
    id: 'image-converter',
    name: 'Image Converter',
    description: 'Convert images instantly in your browser (PNG, JPEG, WEBP, SVG).',
    icon: '🖼️',
    category: 'converters',
    component: ImageConverter,
  });
}
