import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { UtilityRegistry, type Utility } from './registry.ts';

describe('UtilityRegistry', () => {
  let registry: UtilityRegistry;

  const mockUtility: Utility = {
    id: 'test-util',
    name: 'Test Utility',
    description: 'A test utility',
    category: 'calculators',
    component: () => null,
  };

  const otherUtility: Utility = {
    id: 'other-util',
    name: 'Other Utility',
    description: 'Another test utility',
    category: 'converters',
    component: () => null,
  };

  beforeEach(() => {
    registry = new UtilityRegistry();
  });

  describe('register', () => {
    it('should register a new utility', () => {
      registry.register(mockUtility);
      const retrieved = registry.getUtility(mockUtility.id);
      assert.strictEqual(retrieved, mockUtility);
    });

    it('should overwrite utility with the same id', () => {
      registry.register(mockUtility);
      const updatedUtility = { ...mockUtility, name: 'Updated' };
      registry.register(updatedUtility);
      const retrieved = registry.getUtility(mockUtility.id);
      assert.strictEqual(retrieved?.name, 'Updated');
    });
  });

  describe('getUtility', () => {
    it('should return undefined for non-existent utility', () => {
      const retrieved = registry.getUtility('non-existent');
      assert.strictEqual(retrieved, undefined);
    });

    it('should return the correct utility', () => {
      registry.register(mockUtility);
      const retrieved = registry.getUtility(mockUtility.id);
      assert.strictEqual(retrieved, mockUtility);
    });
  });

  describe('getAllUtilities', () => {
    it('should return an empty array when no utilities are registered', () => {
      const all = registry.getAllUtilities();
      assert.strictEqual(all.length, 0);
    });

    it('should return all registered utilities', () => {
      registry.register(mockUtility);
      registry.register(otherUtility);
      const all = registry.getAllUtilities();
      assert.strictEqual(all.length, 2);
      assert.ok(all.includes(mockUtility));
      assert.ok(all.includes(otherUtility));
    });
  });

  describe('getUtilitiesByCategory', () => {
    it('should return utilities only from the specified category', () => {
      registry.register(mockUtility);
      registry.register(otherUtility);
      const calculators = registry.getUtilitiesByCategory('calculators');
      assert.strictEqual(calculators.length, 1);
      assert.strictEqual(calculators[0].id, mockUtility.id);
    });

    it('should return an empty array if no utilities match the category', () => {
      registry.register(mockUtility);
      const formatters = registry.getUtilitiesByCategory('formatters');
      assert.strictEqual(formatters.length, 0);
    });
  });
});
