"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";

/**
 * Providers — wraps the app with all client-side context providers.
 *
 * QueryClient is created inside the component so each browser tab
 * gets its own cache, and React re-renders don't recreate it on
 * every render (thanks to useState).
 *
 * This file is marked "use client" so it can be imported into the
 * root layout (which is a Server Component) without issues.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute — career data doesn't change often
            retry: 1,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}
