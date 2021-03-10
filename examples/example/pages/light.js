import Link from 'next/link'

const Page = () => {
	return (
    <Link href="/">
      <a>Go back home</a>
    </Link>
	)
}

Page.theme = 'my-light-theme'
export default Page
