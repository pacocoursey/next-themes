import ThemeSwitcher from "@/components/ThemeSwitcher"
import Link from "next/link"

export default function Home() {
  return (
    <div>
      <ThemeSwitcher />
      <div className="flex gap-5">
        <Link href="/light" className={`text-black dark:text-white text-sm rounded-md underline underline-offset-4`}>
          Forced light
        </Link>
        <Link href="/dark" className={`text-black dark:text-white text-sm rounded-md underline underline-offset-4`}>
          Forced dark
        </Link>
      </div>
    </div>
  )
}
