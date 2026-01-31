import { Home, Wallet, Bell, List } from "lucide-react";

export default function BottomBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex justify-around items-center">
      <Item icon={<Home size={22} />} label="Home" />
      <Item icon={<Wallet size={22} />} label="Gastos" />
      <div className="w-12" />
      <Item icon={<Bell size={22} />} label="Lembretes" />
      <Item icon={<List size={22} />} label="Listas" />
    </nav>
  );
}

function Item({ icon, label }) {
  return (
    <button className="flex flex-col items-center text-gray-500 text-xs">
      {icon}
      {label}
    </button>
  );
}
