import { ThemeProvider } from "next-themes"
import { darkTheme, globalCss, theme } from "../stitches.config"

const globalStyles = globalCss({
  '*': {
    fontFamily: '$sans'
  },
  'html, body': {
    color: '$foreground',
    backgroundColor: '$background',
  }
})

function MyApp({ Component, pageProps }) {
  globalStyles()

  return (
    <ThemeProvider attribute="class" value={{
      // Run the .toString method to get the classname of the stitches-theme
      light: theme.toString(),
      dark: darkTheme.toString()
    }}>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
