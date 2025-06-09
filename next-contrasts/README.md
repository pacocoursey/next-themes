# next-contrasts ![next-contrasts minzip package size](https://img.shields.io/bundlephobia/minzip/next-contrasts) [![Version](https://img.shields.io/npm/v/next-contrasts.svg?colorB=green)](https://www.npmjs.com/package/next-contrasts)

An abstraction for contrasts in your React app.

- ✅ Perfect contrast mode in 2 lines of code
- ✅ System setting with prefers-contrast
- ✅ Support for Next.js 13 `appDir`
- ✅ No flash on load (both SSR and SSG)
- ✅ Sync contrast across tabs and windows
- ✅ Disable flashing when changing contrast
- ✅ Force pages to specific contrast
- ✅ Class or data attribute selector
- ✅ `useContrast` hook

Check out the [Live Example](https://next-contrasts-example.vercel.app/) to try it for yourself.

## Install

```bash
$ npm install next-contrasts
# or
$ yarn add next-contrasts
# or
$ pnpm add next-contrasts
```

## Use

### With pages/

You'll need a [Custom `App`](https://nextjs.org/docs/advanced-features/custom-app) to use next-contrasts. The simplest `_app` looks like this:

```jsx
// pages/_app.js

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default MyApp
```

Adding contrast mode support takes 2 lines of code:

```jsx
// pages/_app.js
import { ContrastProvider } from 'next-contrasts'

function MyApp({ Component, pageProps }) {
  return (
    <ContrastProvider>
      <Component {...pageProps} />
    </ContrastProvider>
  )
}

export default MyApp
```

### With app/

You'll need to update your `app/layout.jsx` to use next-contrasts. The simplest `layout` looks like this:

```jsx
// app/layout.jsx
export default function Layout({ children }) {
  return (
    <html>
      <head />
      <body>{children}</body>
    </html>
  )
}
```

Adding contrast mode support takes 2 lines of code:

```jsx
// app/layout.jsx
import { ContrastProvider } from 'next-contrasts'

export default function Layout({ children }) {
  return (
    <html suppressHydrationWarning>
      <head />
      <body>
        <ContrastProvider>{children}</ContrastProvider>
      </body>
    </html>
  )
}
```

Note that `ContrastProvider` is a client component, not a server component.

> **Note!** If you do not add [suppressHydrationWarning](https://reactjs.org/docs/dom-elements.html#suppresshydrationwarning:~:text=It%20only%20works%20one%20level%20deep) to your `<html>` you will get warnings because `next-contrasts` updates that element. This property only applies one level deep, so it won't block hydration warnings on other elements.

### HTML & CSS

That's it, your Next.js app fully supports contrast mode, including System preference with `prefers-contrast`. The contrast is also immediately synced between tabs. By default, next-contrasts modifies the `data-contrast` attribute on the `html` element, which you can easily use to style your app:

```css
:root {
  /* Your default contrast */
  --background: #222;
  --foreground: #ddd;
}

[data-contrast='more'] {
  --background: #000;
  --foreground: #fff;
}

[data-contrast='less'] {
  --background: #444;
  --foreground: #bbb;
}
```

### useContrast

Your UI will need to know the current contrast and be able to change it. The `useContrast` hook provides contrast information:

```jsx
import { useContrast } from 'next-contrasts'

const ContrastChanger = () => {
  const { contrast, setContrast } = useContrast()

  return (
    <div>
      The current contrast is: {contrast}
      <button onClick={() => setContrast('more')}>More contrast Mode</button>
      <button onClick={() => setContrast('less')}>Less contrast Mode</button>
      <button onClick={() => setContrast('no-preference')}>No preference contrast Mode</button>
    </div>
  )
}
```

> **Warning!** The above code is hydration _unsafe_ and will throw a hydration mismatch warning when rendering with SSG or SSR. This is because we cannot know the `contrast` on the server, so it will always be `undefined` until mounted on the client.
>
> You should delay rendering any contrast toggling UI until mounted on the client. See the [example](#avoid-hydration-mismatch).

## API

Let's dig into the details.

### ContrastProvider

All your contrast configuration is passed to ContrastProvider.

- `storageKey = 'contrast'`: Key used to store contrast setting in localStorage
- `defaultContrast = 'no-preference'`: Default contrast name
- `forcedContrast`: Forced contrast name for the current page (does not modify saved contrast settings)
- `disableTransitionOnChange = false`: Optionally disable all CSS transitions when switching contrasts ([example](#disable-transitions-on-theme-change))
- `attribute = 'data-contrast'`: HTML attribute modified based on the active contrast
  - accepts `class` and `data-*` (meaning any data attribute, `data-mode`, `data-color`, etc.) ([example](#class-instead-of-data-attribute))
- `value`: Optional mapping of contrast name to attribute value
  - value is an `object` where key is the contrast name and value is the attribute value ([example](#differing-dom-attribute-and-theme-name))
- `nonce`: Optional nonce passed to the injected `script` tag, used to allow-list the next-contrasts script in your CSP
- `scriptProps`: Optional props to pass to the injected `script` tag ([example](#using-with-cloudflare-rocket-loader))

### useContrast

useContrast takes no parameters, but returns:

- `contrast`: Active contrast name
- `setContrast(name)`: Function to update the contrast. The API is identical to the [set function](https://react.dev/reference/react/useState#setstate) returned by `useState`-hook. Pass the new contrast value or use a callback to set the new contrast based on the current contrast.
- `forcedContrast`: Forced page contrast or falsy. If `forcedContrast` is set, you should disable any contrast switching UI

Not too bad, right? Let's see how to use these properties with examples:

## Examples

The [Live Example](https://next-contrasts-example.vercel.app/) shows next-contrasts in action, with more, less, no-preference contrasts and pages with forced contrasts.

### Class instead of data attribute

If your Next.js app uses a class to style the page based on the contrast, change the attribute prop to `class`:

```jsx
<ContrastProvider attribute="class">
```

Now, setting the contrast to "more" will set `class="more-contrast"` on the `html` element.

### Force page to a contrast

Let's say your cool new marketing page is more contrast only. The page should always use the more contrast, and changing the contrast should have no effect. To force a contrast on your Next.js pages, simply set a variable on the page component:

```js
// pages/awesome-page.js

const Page = () => { ... }
Page.contrast = 'more'
export default Page
```

In your `_app`, read the variable and pass it to ContrastProvider:

```jsx
function MyApp({ Component, pageProps }) {
  return (
    <ContrastProvider forcedContrast={Component.contrast || null}>
      <Component {...pageProps} />
    </ContrastProvider>
  )
}
```

Done! Your page is always more contrast (regardless of user preference), and calling `setContrast` from `useContrast` is now a no-op. However, you should make sure to disable any of your UI that would normally change the contrast:

```js
const { forcedContrast } = useContrast()

// Contrast is forced, we shouldn't allow user to change the contrast
const disabled = !!forcedContrast
```

### Disable transitions on contrast change

I wrote about [this technique here](https://paco.sh/blog/disable-theme-transitions). We can forcefully disable all CSS transitions before the contrast is changed, and re-enable them immediately afterwards. This ensures your UI with different transition durations won't feel inconsistent when changing the contrast.

To enable this behavior, pass the `disableTransitionOnChange` prop:

```jsx
<ContrastProvider disableTransitionOnChange>
```

### Differing DOM attribute and contrast name

The name of the active contrast is used as both the localStorage value and the value of the DOM attribute. If the contrast name is "less", localStorage will contain `contrast=less` and the DOM will be `data-contrast="less"`. You **cannot** modify the localStorage value, but you **can** modify the DOM value.

If we want the DOM to instead render `data-contrast="my-less-contrast"` when the contrast is "less", pass the `value` prop:

```jsx
<ContrastProvider value={{ less: 'my-less-contrast' }}>
```

Done! To be extra clear, this affects only the DOM. Here's how all the values will look:

```js
const { contrast } = useContrast()
// => "less"

localStorage.getItem('contrast')
// => "less"

document.documentElement.getAttribute('data-contrast')
// => "my-less-contrast"
```

### Using with Cloudflare Rocket Loader

[Rocket Loader](https://developers.cloudflare.com/fundamentals/speed/rocket-loader/) is a Cloudflare optimization that defers the loading of inline and external scripts to prioritize the website content. Since next-contrasts relies on a script injection to avoid screen flashing on page load, Rocket Loader breaks this functionality. Individual scripts [can be ignored](https://developers.cloudflare.com/fundamentals/speed/rocket-loader/ignore-javascripts/) by adding the `data-cfasync="false"` attribute to the script tag:

```jsx
<ContrastProvider scriptProps={{ 'data-cfasync': 'false' }}>
```

### Without CSS variables

This library does not rely on your contrast styling using CSS variables. You can hard-code the values in your CSS, and everything will work as expected (without any flashing):

```css
html,
body {
  color: #000;
  background: #fff;
}

[data-contrast='more'],
[data-contrast='more'] body {
  color: #fff;
  background: #000;
}
```

### With Styled Components and any CSS-in-JS

Next Contrasts is completely CSS independent, it will work with any library. For example, with Styled Components you just need to `createGlobalStyle` in your custom App:

```jsx
// pages/_app.js
import { createGlobalStyle } from 'styled-components'
import { ContrastProvider } from 'next-contrasts'

// Your themeing variables
const GlobalStyle = createGlobalStyle`
  :root {
    --fg: #000;
    --bg: #fff;
  }

  [data-contrast="more"] {
    --fg: #fff;
    --bg: #000;
  }
`

function MyApp({ Component, pageProps }) {
  return (
    <>
      <GlobalStyle />
      <ContrastProvider>
        <Component {...pageProps} />
      </ContrastProvider>
    </>
  )
}
```

### Avoid Hydration Mismatch

Because we cannot know the `contrast` on the server, many of the values returned from `useContrast` will be `undefined` until mounted on the client. This means if you try to render UI based on the current contrast before mounting on the client, you will see a hydration mismatch error.

The following code sample is **unsafe**:

```jsx
import { useContrast } from 'next-contrasts'

// Do NOT use this! It will throw a hydration mismatch error.
const ContrastSwitch = () => {
  const { contrast, setContrast } = useContrast()

  return (
    <select value={contrast} onChange={e => setContrast(e.target.value)}>
      <option value="no-preference">No preference</option>
      <option value="more">More</option>
      <option value="less">Less</option>
    </select>
  )
}

export default ContrastSwitch
```

To fix this, make sure you only render UI that uses the current contrast when the page is mounted on the client:

```jsx
import { useState, useEffect } from 'react'
import { useContrast } from 'next-contrasts'

const ContrastSwitch = () => {
  const [mounted, setMounted] = useState(false)
  const { contrast, setContrast } = useContrast()

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <select value={contrast} onChange={e => setContrast(e.target.value)}>
      <option value="no-preference">No preference</option>
      <option value="more">More</option>
      <option value="less">Less</option>
    </select>
  )
}

export default ContrastSwitch
```

Alternatively, you could lazy load the component on the client side. The following example uses `next/dynamic` but you could also use `React.lazy`:

```js
import dynamic from 'next/dynamic'

const ContrastSwitch = dynamic(() => import('./ContrastSwitch'), { ssr: false })

const ContrastPage = () => {
  return (
    <div>
      <ContrastSwitch />
    </div>
  )
}

export default ContrastPage
```

To avoid [Layout Shift](https://web.dev/cls/), consider rendering a skeleton/placeholder until mounted on the client side.

#### Images

Showing different images based on the current contrast also suffers from the hydration mismatch problem. With [`next/image`](https://nextjs.org/docs/basic-features/image-optimization) you can use an empty image until the contrast is resolved:

```jsx
import Image from 'next/image'
import { useContrast } from 'next-contrasts'

function ContrastedImage() {
  const { contrast } = useContrast()
  let src

  switch (contrastt) {
    case 'less':
      src = '/less.png'
      break
    case 'more':
      src = '/more.png'
      break
    default:
      src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      break
  }

  return <Image src={src} width={400} height={400} />
}

export default ContrastedImage
```

#### CSS

You can also use CSS to hide or show content based on the current contrast. To avoid the hydration mismatch, you'll need to render _both_ versions of the UI, with CSS hiding the unused version. For example:

```jsx
function ContrastedImage() {
  return (
    <>
      {/* When the contrast is more, hide this div */}
      <div data-hide-on-contrast="more">
        <Image src="more.png" width={400} height={400} />
      </div>

      {/* When the contrast is less, hide this div */}
      <div data-hide-on-contrast="less">
        <Image src="less.png" width={400} height={400} />
      </div>
    </>
  )
}

export default ContrastedImage
```

```css
[data-contrast='more'] [data-hide-on-contrast='more'],
[data-contrast='less'] [data-hide-on-contrast='less'] {
  display: none;
}
```

## Discussion

### The Flash

ContrastProvider automatically injects a script into `next/head` to update the `html` element with the correct attributes before the rest of your page loads. This means the page will not flash under any circumstances, including forced contrasts, system contrast, and incognito. No `noflash.js` required.

## FAQ

---

**Why is my page still flashing?**

In Next.js dev mode, the page may still flash. When you build your app in production mode, there will be no flashing.

---

**Why do I get server/client mismatch error?**

When using `useContrast`, you will use see a hydration mismatch error when rendering UI that relies on the current contrast. This is because many of the values returned by `useContrast` are undefined on the server, since we can't read `localStorage` until mounting on the client. See the [example](#avoid-hydration-mismatch) for how to fix this error.

---

**Do I need to use CSS variables with this library?**

Nope. See the [example](#without-css-variables).

---

**Can I set the class or data attribute on the body or another element?**

Nope. If you have a good reason for supporting this feature, please open an issue.

---

**Can I use this package with Gatsby or CRA?**

Yes, starting from the 0.3.0 version.

---

**Is the injected script minified?**

Yes.

---
