import { ThemeModeToggle } from "./components/ThemeModeToggle";
import Dashboard from "./pages/Dashboard";
import Insights from "./pages/Insights";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="fixed top-0 left-0 right-0 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="container mx-auto flex justify-between items-center py-3 px-4">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
            Polarinch Receipt Insights
          </h1>
          <ThemeModeToggle />
        </div>
      </header>

      <main className="pt-16">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Tabs defaultValue="insights">
            <TabsList className="flex justify-center mb-4 bg-transparent">
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            </TabsList>
            <TabsContent value="insights">
              <Insights />
            </TabsContent>
            <TabsContent value="dashboard">
              <Dashboard />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default App;
