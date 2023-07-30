"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false)
  const { forcedTheme, resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <div className="flex items-center gap-4">
        <button disabled={!!forcedTheme} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className={`bg-black text-white dark:bg-white dark:text-black text-sm rounded-md min-w-max py-1 px-2 disabled:bg-gray-300 dark:disabled:bg-gray-300/20`}>
          Switch theme
        </button>
        {!!forcedTheme ? <div className="text-xs text-black dark:text-white" >This button is no-op now. however, you should make sure to disable any of your UI that would normally change the theme.</div> : null }
      </div>
      <div className="py-4">App theme: {mounted ? resolvedTheme : ""} </div>
    </>
  )
}

export default ThemeSwitcher
