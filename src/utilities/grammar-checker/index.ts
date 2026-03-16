import { lazy } from 'react';
const GrammarChecker = lazy(() => import('./GrammarChecker'));
import { registry } from '../../core/registry';

export const registerGrammarChecker = () => {
  registry.register({
    id: 'grammar-checker',
    name: 'Grammar Checker',
    description: 'Check your text for grammar, spelling, and style issues.',
    icon: '✍️',
    category: 'documents',
    component: GrammarChecker,
  });
};
