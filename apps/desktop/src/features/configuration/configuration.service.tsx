import { createContext, useContext, type PropsWithChildren } from "react";
import type { ConfigurationService } from "../../../../../packages/types/src";

const ConfigurationServiceContext = createContext<ConfigurationService | null>(
  null,
);

export function ConfigurationServiceProvider({
  service,
  children,
}: PropsWithChildren<{ service: ConfigurationService }>) {
  return (
    <ConfigurationServiceContext.Provider value={service}>
      {children}
    </ConfigurationServiceContext.Provider>
  );
}

export function useConfigurationService() {
  const service = useContext(ConfigurationServiceContext);
  if (!service) {
    throw new Error(
      "ConfigurationServiceProvider precisa envolver a aplicação.",
    );
  }
  return service;
}
