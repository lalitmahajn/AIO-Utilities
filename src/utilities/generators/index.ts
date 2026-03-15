import QrGenerator from './QrGenerator';
import { registry } from '../../core/registry';

export const registerQrGenerator = () => {
  registry.register({
    id: 'qr-generator',
    name: 'QR Code Generator',
    description: 'Instant, beautiful QR code generator with live preview and customization.',
    icon: '🔳',
    category: 'generators',
    component: QrGenerator
  });
};
