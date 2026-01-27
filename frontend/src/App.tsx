import { ChatKitPanel } from "./components/ChatKitPanel";

export default function App() {
  return (
    <main className="flex h-full flex-col bg-[#212121]">
      <div className="h-full w-full">
        <ChatKitPanel />
      </div>
    </main>
  );
}
