import Header from "./Header";
import BottomBar from "./BottomBar";
import FabButton from "./FabButton";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 pb-24">{children}</main>

      <FabButton />
      <BottomBar />
    </div>
  );
}
