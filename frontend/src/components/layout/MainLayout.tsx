import type { ReactNode } from "react"

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-6">
          <h1 className="text-xl font-bold">
            InfraVision
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Infrastructure Explorer
          </p>
        </div>

        <nav className="p-4">
          <div className="mb-2 text-xs font-semibold uppercase text-slate-500">
            Explore
          </div>

          <div className="space-y-1">
            <button className="w-full rounded-md bg-slate-800 px-3 py-2 text-left text-sm">
              Overview
            </button>

            <button className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
              Servers
            </button>

            <button className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
              Docker
            </button>

            <button className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
              Processes
            </button>

            <button className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
              Network
            </button>

            <button className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
              Storage
            </button>

            <button className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
              Logs
            </button>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 px-8">
          <div>
            <span className="text-sm text-slate-400">
              Infrastructure
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            System Online
          </div>
        </header>

        {/* Content */}
        <section className="p-8">
          {children}
        </section>
      </main>
    </div>
  )
}