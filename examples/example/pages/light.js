import Link from 'next/link'

const Page = () => {
  return (
    <Link href="/">
      <a>Go back home</a>
    </Link>
  )
}

Page.theme = 'light'
export default Page
