import { lazy } from 'react';
const PdfPasswordRemover = lazy(() => import('./PdfPasswordRemover'));
import { registry } from '../../core/registry';

export function registerPdfTools() {
  registry.register({
    id: 'pdf-password-remover',
    name: 'PDF Password Remover',
    description: 'Remove password protection from PDF files securely in your browser.',
    icon: '🔓',
    category: 'documents',
    component: PdfPasswordRemover,
  });
}
