import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
}

const navigationItems = [
  {
    label: 'Overview',
    path: '/',
  },
  {
    label: 'Servers',
    path: '/servers',
  },
  {
    label: 'Docker',
    path: '/docker',
  },
  {
    label: 'Processes',
    path: '/processes',
  },
  {
    label: 'Network',
    path: '/network',
  },
  {
    label: 'Storage',
    path: '/storage',
  },
  {
    label: 'Logs',
    path: '/logs',
  },
];

export function MainLayout({
  children,
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900">

        {/* Logo */}
        <div className="border-b border-slate-800 p-6">

          <h1 className="text-xl font-bold tracking-tight">
            InfraVision
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Infrastructure Explorer
          </p>

        </div>

        {/* Navigation */}
        <nav className="p-4">

          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Explore
          </div>

          <div className="space-y-1">

            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `
                  group flex w-full items-center rounded-md px-3 py-2.5 text-sm
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                  }
                  `
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Indicator */}
                    <span
                      className={`
                        mr-3 h-1.5 w-1.5 rounded-full transition-all duration-200
                        ${
                          isActive
                            ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]'
                            : 'bg-transparent group-hover:bg-slate-600'
                        }
                      `}
                    />

                    {item.label}
                  </>
                )}
              </NavLink>
            ))}

          </div>

        </nav>

      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1">

        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800 px-8">

          <div>
            <span className="text-sm text-slate-400">
              Infrastructure
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-emerald-400">

            <span className="relative flex h-2 w-2">

              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />

            </span>

            System Online

          </div>

        </header>

        {/* Content */}
        <section className="p-8">
          {children}
        </section>

      </main>

    </div>
  );
}