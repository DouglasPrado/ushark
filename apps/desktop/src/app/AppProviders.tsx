import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";
import { MockConfigurationService } from "../../../../packages/mocks/src";
import { ConfigurationServiceProvider } from "../features/configuration/configuration.service";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );
  const [configurationService] = useState(() => new MockConfigurationService());

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigurationServiceProvider service={configurationService}>
        {children}
      </ConfigurationServiceProvider>
    </QueryClientProvider>
  );
}
