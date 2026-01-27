import { ChatKitPanel } from "./components/ChatKitPanel";

export default function App() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-100 dark:bg-slate-950">
      <div className="w-full">
        <ChatKitPanel />
      </div>
    </main>
  );
}
