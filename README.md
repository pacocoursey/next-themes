# next-themes ![next-themes minzip package size](https://img.shields.io/bundlephobia/minzip/next-themes)

An abstraction for themes in your Next.js app.

- ✅ Perfect dark mode in 2 lines of code
- ✅ System setting with prefers-color-scheme
- ✅ No flash on load (both SSR and SSG)
- ✅ Sync theme across tabs and windows
- ✅ Disable flashing when changing themes
- ✅ Force pages to specific themes
- ✅ Class or data attribute selector
- ✅ `useTheme` hook

## Install

```bash
$ npm install next-themes
# or
$ yarn add next-themes
```

## Use

You'll need a [Custom `App`](https://nextjs.org/docs/advanced-features/custom-app) to use next-themes. The simplest `_app` looks like this:

```js
// pages/_app.js

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default MyApp
```

Adding dark mode support takes 2 lines of code:

```js
import { ThemeProvider } from 'next-theme'

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
```

That's it, your Next.js app fully supports dark mode, including System preference with `prefers-color-scheme`. The theme is also immediately synced between tabs. By default, next-themes modifies the `data-theme` attribute on the `html` element, which you can easily use to style your app:

```css
:root {
  /* Your default theme */
  --background: white;
  --foreground: black;
}

[data-theme='dark'] {
  --background: black;
  --foreground: white;
}
```

### useTheme

Your UI will need to know the current theme and be able to change it. The `useTheme` hook provides theme information:

```js
const ThemeChanger = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      The current theme is: {theme}
      <button onClick={() => setTheme('light')}>Light Mode</button>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
    </div>
  )
}
```

## API

Let's dig into the details.

### ThemeProvider

All your theme configuration is passed to ThemeProvider.

- `storageKey = 'theme'`: Key used to store theme setting in localStorage
- `defaultTheme = 'light'`: Default theme name
- `forcedTheme`: Forced theme name for the current page (does not modify saved theme settings)
- `enableSystem = true`: Whether to switch between `dark` and `light` based on `prefers-color-scheme`
- `disableTransitionOnChange = false`: Optionally disable all CSS transitions when switching themes ([example](#disable-transitions-on-theme-change))
- `themes = ['light', 'dark']`: List of theme names
- `attribute = 'data-theme'`: HTML attribute modified based on the active theme
  - accepts `class` and `data-*` (meaning any data attribute, `data-mode`, `data-color`, etc.) ([example](#class-instead-of-data-attribute))
- `value`: Optional mapping of theme name to attribute value
  - value is an `object` where key is the theme name and value is the attribute value ([example](#differing-dom-attribute-and-theme-name))

### useTheme

useTheme takes no parameters, but returns:

- `theme`: Active theme name
- `setTheme(name)`: Function to update the theme
- `forcedTheme`: Forced page theme or falsy. If `forcedTheme` is set, you should disable any theme switching UI
- `resolvedTheme`: If `enableSystem` is true and the active theme is "system", this returns whether the system preference resolved to "dark" or "light". Otherwise, identical to `theme`
- `themes`: The list of themes passed to `ThemeProvider` (with "system" appended, if `enableSystem` is true)

Not too bad, right? Let's see how to use these properties with examples:

## Examples

### Use System preference by default

The `defaultTheme` is "light". If you want to respect the System preference instead, set it to "system":

```js
<ThemeProvider defaultTheme="system">
```

### Ignore System preference

If you don't want a System theme, disable it via `enableSystem`:

```js
<ThemeProvider enableSystem={false}>
```

### Class instead of data attribute

If your Next.js app uses a class to style the page based on the theme, change the attribute prop to `class`:

```js
<ThemeProvider attribute="class">
```

Now, setting the theme to "dark" will set `class="dark"` on the `html` element.

### Force page to a theme

Let's say your cool new marketing page is dark mode only. The page should always use the dark theme, and changing the theme should have no effect. To force a theme on your Next.js pages, simply set a variable on the page component:

```js
// pages/awesome-page.js

const Page = () => { ... }
Page.theme = 'dark'
export default Page
```

In your `_app`, read the variable and pass it to ThemeProvider:

```js
function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider forcedTheme={Component.theme || null}>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
```

Done! Your page is always dark theme (regardless of user preference), and calling `setTheme` from `useTheme` is now a no-op. However, you should make sure to disable any of your UI that would normally change the theme:

```js
const { forcedTheme } = useTheme()

// Theme is forced, we shouldn't allow user to change the theme
const disabled = !!forcedTheme
```

### Disable transitions on theme change

I wrote about [this technique here](https://paco.sh/blog/disable-theme-transitions). We can forcefully disable all CSS transitions before the theme is changed, and re-enable them immediately afterwards. This ensures your UI with different transition durations won't feel inconsistent when changing the theme.

To enable this behavior, pass the `disableTransitionOnChange` prop:

```js
<ThemeProvider disableTransitionOnChange>
```

### Differing DOM attribute and theme name

The name of the active theme is used as both the localStorage value and the value of the DOM attribute. If the theme name is "pink", localStorage will contain `theme=pink` and the DOM will be `data-theme="pink"`. You **cannot** modify the localStorage value, but you **can** modify the DOM value.

If we want the DOM to instead render `data-theme="my-pink-theme"` when the theme is "pink", pass the `value` prop:

```js
<ThemeProvider value={{ pink: 'my-pink-theme' }}>
```

Done! To be extra clear, this affects only the DOM. Here's how all the values will look:

```js
const { theme } = useTheme()
// => "pink"

localStorage.get('theme')
// => "pink"

document.documentElement.getAttribute('data-theme')
// => "my-pink-theme"
```

### More than light and dark mode

next-themes is designed to support any number of themes! Simply pass a list of themes:

```js
<ThemeProvider themes={['pink', 'red', 'blue']}>
```

> **Note!** When you pass `themes`, the default set of themes ("light" and "dark") are overriden. Make sure you include those if you still want your light and dark themes:

```js
<ThemeProvider themes={['pink', 'red', 'blue', 'light', 'dark']}>
```

## Discussion

### The Flash

ThemeProvider automatically injects a script into `next/head` to update the `html` element with the correct attributes before the rest of your page loads. This means the page will not flash under any circumstances, including forced themes, system theme, multiple themes, and incognito. No `noflash.js` required.

## FAQ

---

**Can I set the class or data attribute on the body or another element?**

Nope. If you have a good reason for supporting this feature, please open an issue.

---

**Can I use this package with Gatsby or CTA?**

Nope.

---

**Is the injected script minified?**

Yes, using Terser.

---

**Why is `resolvedTheme` necessary?**

When supporting the System theme preference, you want to make sure that's reflected in your UI. This means your buttons, selects, dropdowns, or whatever you use to indicate the current theme should say "System" when the System theme preference is active.

If we didn't distinguish between `theme` and `resolvedTheme`, the UI would show "Dark" or "Light", when it should really be "System".

`resolvedTheme` is then useful for modifying behavior or styles at runtime:

```js
const { resolvedTheme } = useTheme()

<div style={{ color: resolvedTheme === 'dark' ? white : black }}>
```

If we didn't have `resolvedTheme` and only used `theme`, you'd lose information about the state of your UI (you would only know the theme is "system", and not what it resolved to).

