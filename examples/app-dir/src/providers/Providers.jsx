"use client"

import { ThemeProvider } from "next-themes"
import { usePathname } from "next/navigation"

export default function Providers({ children }) {
  const path = usePathname()

  return (
    <ThemeProvider forcedTheme={path === "/light" ? "light" : path === "/dark" ? "dark" : undefined} attribute="class">
      {children}
    </ThemeProvider>
  )
}
