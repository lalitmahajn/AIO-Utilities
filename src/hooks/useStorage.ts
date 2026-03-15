import { useState, useEffect } from 'react';
import { dexieAdapter } from '../core/storage';

export function useStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dexieAdapter.getItem<T>(key).then((stored) => {
      if (stored !== undefined) {
        setValue(stored);
      }
      setLoading(false);
    });
  }, [key]);

  const updateValue = async (newValue: T) => {
    setValue(newValue);
    await dexieAdapter.setItem(key, newValue);
  };

  return [value, updateValue, loading] as const;
}
