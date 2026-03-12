import ThemeToggle from '../../../components/ThemeToggle'

export default function IndexPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <main
        style={{
          width: '100%',
          maxWidth: '720px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '40px',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          next-themes demo
        </h1>

        <p
          style={{
            fontSize: '18px',
            lineHeight: 1.6,
            marginBottom: '24px',
          }}
        >
          This example demonstrates switching between light, dark, and system
          themes with a reusable ThemeToggle component.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <ThemeToggle />
        </div>
      </main>
    </div>
  )
}
