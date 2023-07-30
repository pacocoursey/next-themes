import "./globals.css"
import { Inter } from "next/font/google"

//theme-provider
import Providers from "@/providers/Providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "next-themes",
  description: "dark mode implementation with next-themes",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} p-10 min-h-screen dark:bg-black`}>
        <Providers>
          <h1 className={`text-3xl pb-5 font-semibold`}>Next-themes w/ App dir</h1>
          {children}
        </Providers>
      </body>
    </html>
  )
}
