import PdfPasswordRemover from './PdfPasswordRemover';
import { registry } from '../../core/registry';

export function registerPdfTools() {
  registry.register({
    id: 'pdf-password-remover',
    name: 'PDF Password Remover',
    description: 'Remove password protection from PDF files securely in your browser.',
    category: 'documents',
    component: PdfPasswordRemover,
  });
}
