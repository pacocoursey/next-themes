import ThemeToggle from '../components/ThemeToggle'

export default function Home() {
  return (
    <div className="w-full container p-4 mx-auto">
      <div className="py-20 flex flex-col items-center justify-center">
        <h1 className="text-5xl text-center text-gray-800 dark:text-gray-100 font-bold">
          Next Themes + Tailwind Dark Mode
        </h1>
        <p className="italic text-2xl">with app-dir</p>

        <ThemeToggle />
      </div>
    </div>
  )
}
