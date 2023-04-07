import React from 'react'
import { Html, Head, Main, NextScript } from 'next/document'

const MyDocument = () => {
    return (
      <Html lang="en">
        <Head />
        <body className="bg-white dark:bg-black text-white dark:text-black">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
}

export default MyDocument
