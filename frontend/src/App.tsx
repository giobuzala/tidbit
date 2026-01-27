import { ChatKitPanel } from "./components/ChatKitPanel";

export default function App() {
  return (
    <main className="flex h-full flex-col bg-slate-100 dark:bg-slate-950">
      <div className="h-full w-full">
        <ChatKitPanel />
      </div>
    </main>
  );
}
