import { ChatKitPanel } from "./components/ChatKitPanel";

export default function App() {
  return (
    <main className="flex h-full flex-col bg-white dark:bg-slate-900">
      <div className="h-full w-full">
        <ChatKitPanel />
      </div>
    </main>
  );
}
