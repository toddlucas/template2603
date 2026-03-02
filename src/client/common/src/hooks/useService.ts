import type { ServiceIdentifier } from 'inversify';
import { useContainer } from '../platform/di/useContainer';

export function useService<T>(identifier: ServiceIdentifier<T>): T {
  const container = useContainer();
  return container.get<T>(identifier);
}
