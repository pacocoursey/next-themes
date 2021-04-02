import { useTheme } from 'next-themes'
import Link from 'next/link'

const Index = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <h1>next-themes Example</h1>
      {theme !== undefined && (
        <select value={theme} onChange={e => setTheme(e.target.value)}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="system">System</option>
        </select>
      )}

      <br />
      <br />

      <div>
        <Link href="/dark">
          <a>Forced Dark Page</a>
        </Link>{' '}
        •{' '}
        <Link href="/light">
          <a>Forced Light Page</a>
        </Link>
      </div>
    </div>
  )
}

export default Index
