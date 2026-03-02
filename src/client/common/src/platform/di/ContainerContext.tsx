import { createContext } from 'react';
import type { ReactNode } from 'react';
import { Container } from 'inversify';

export const ContainerContext = createContext<Container | null>(null);

interface ContainerProviderProps {
  container: Container;
  children: ReactNode;
}

export function ContainerProvider({ container, children }: ContainerProviderProps) {
  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  );
}
