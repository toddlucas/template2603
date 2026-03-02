import { useContext } from 'react';
import { Container } from 'inversify';
import { ContainerContext } from './ContainerContext';

export function useContainer(): Container {
  const container = useContext(ContainerContext);
  if (!container) {
    throw new Error('useContainer must be used within a ContainerProvider');
  }
  return container;
}
