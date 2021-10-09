import { createStitches } from "@stitches/react";

export const { css, styled, getCssText, globalCss, theme, createTheme } = createStitches({
    theme: {
        fonts: {
            sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
        },
        colors: {
            background: '#F1F1F1',
            foreground: '#000000'
        }
    }
})

export const darkTheme = createTheme({
    colors: {
        background: '#000000',
        foreground: '#F1F1F1'
    }
})
