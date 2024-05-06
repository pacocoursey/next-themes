import ThemeToggles from '../components/ThemeToggles'

export default function Home() {
  return (
    <div className="w-full container p-4 mx-auto">
      <div className="py-20 flex flex-col items-center justify-center text-gray-800 dark:text-gray-100">
        <h1 className="text-5xl text-center  font-bold">
          Next Themes + Tailwind +{' '}
          <span className="text-primary-foreground bg-primary py-2 px-4 rounded">Multi</span> Themes
        </h1>
        <p className="italic text-2xl">with app-dir</p>
        <ThemeToggles />
      </div>
    </div>
  )
}
