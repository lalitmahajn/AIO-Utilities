import type { ComponentType } from 'react';

export interface Utility {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: 'calculators' | 'converters' | 'formatters' | 'productivity' | 'other';
  component: ComponentType;
}

class UtilityRegistry {
  private utilities: Map<string, Utility> = new Map();

  register(utility: Utility) {
    this.utilities.set(utility.id, utility);
  }

  getUtility(id: string): Utility | undefined {
    return this.utilities.get(id);
  }

  getAllUtilities(): Utility[] {
    return Array.from(this.utilities.values());
  }

  getUtilitiesByCategory(category: Utility['category']): Utility[] {
    return this.getAllUtilities().filter((u) => u.category === category);
  }
}

export const registry = new UtilityRegistry();
