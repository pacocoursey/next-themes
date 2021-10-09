import { useTheme } from "next-themes"
import { styled } from "../stitches.config"

const Page = styled('div', {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
})

const ThemeSwitcher = styled('button', {
  border: 'none',
  color: '$background',
  backgroundColor: '$foreground',
  fontSize: '1.2em',
  padding: '.5em',
  borderRadius: '.5rem'
})

const Home = () => {
  const { theme, setTheme } = useTheme()

  return (
    <Page>
      <h1>Next Themes + Stitches</h1>
      <ThemeSwitcher onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Change Theme
      </ThemeSwitcher>
    </Page>
  )
  }

export default Home
