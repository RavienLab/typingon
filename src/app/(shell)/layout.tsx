"use client";

import { Shell } from "@/components/layout/Shell";
import { ParagraphProvider } from "@/components/typing/ParagraphProvider";
import { usePathname } from "next/navigation";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Result page should not show the main shell/header
  const hideShell = pathname.startsWith("/test/result");

  return (
    <ParagraphProvider> 
      {hideShell ? (
        children
      ) : (
        <Shell>
          {children}
        </Shell>
      )}
    </ParagraphProvider>
  );
}