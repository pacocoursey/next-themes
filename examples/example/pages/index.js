import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const Index = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div>
      <h1>next-themes Example</h1>
      <select value={theme} onChange={e => setTheme(e.target.value)} data-test-id="theme-selector">
        <option value="system">System</option>
        {mounted && (
          <>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </>
        )}
      </select>

      <br />
      <br />

      <div>
        <Link href="/dark">Forced Dark Page</Link> • <Link href="/light">Forced Light Page</Link>
      </div>
    </div>
  )
}

export default Index
