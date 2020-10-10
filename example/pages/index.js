import { useTheme } from 'next-themes'

const Index = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <button
        onClick={() =>
          setTheme(
            theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
          )
        }
      >
        Toggle Theme (current: {theme})
      </button>
      <h1>Hello!</h1>
    </div>
  )
}

export default Index
