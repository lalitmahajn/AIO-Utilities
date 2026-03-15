import ImageConverter from './ImageConverter';
import { registry } from '../../core/registry';

export function registerImageTools() {
  registry.register({
    id: 'image-converter',
    name: 'Image Converter',
    description: 'Convert images instantly in your browser (PNG, JPEG, WEBP, SVG).',
    category: 'converters',
    component: ImageConverter,
  });
}
