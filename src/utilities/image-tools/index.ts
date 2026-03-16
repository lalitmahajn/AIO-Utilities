import React from 'react';
import { registry } from '../../core/registry';

const ImageConverter = React.lazy(() => import('./ImageConverter'));
const ImageCompressor = React.lazy(() => import('./ImageCompressor'));

export function registerImageTools() {
  registry.register({
    id: 'image-converter',
    name: 'Image Converter',
    description: 'Convert images instantly in your browser (PNG, JPEG, WEBP, SVG).',
    icon: '🖼️',
    category: 'image',
    component: ImageConverter,
  });

  registry.register({
    id: 'image-compressor',
    name: 'Image Compressor',
    description: 'Compress images to a target file size with optimal quality.',
    icon: '📉',
    category: 'image',
    component: ImageCompressor,
  });
}
