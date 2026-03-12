import { useTheme } from 'next-themes'
import Link from 'next/link'

const Page = () => {
  const { resolvedTheme } = useTheme()
  return (
    <div>
      <Link href="/">Go back home</Link>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
    </div>
  )
}

Page.theme = 'light'
export default Page
