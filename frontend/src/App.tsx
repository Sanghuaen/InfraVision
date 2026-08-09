import { MainLayout } from "./components/layout/MainLayout"

function App() {
  return (
    <MainLayout>
      <div>
        <h2 className="text-2xl font-bold">
          Infrastructure Overview
        </h2>

        <p className="mt-2 text-slate-400">
          Explore your infrastructure in one place.
        </p>
      </div>
    </MainLayout>
  )
}

export default App