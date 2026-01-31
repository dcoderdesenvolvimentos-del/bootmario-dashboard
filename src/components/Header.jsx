import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  return (
    <header className="h-14 bg-white shadow-sm flex items-center justify-between px-4">
      <h1 className="font-semibold text-lg text-gray-800">BootMario</h1>

      <Avatar className="h-8 w-8 cursor-pointer">
        <AvatarFallback>R</AvatarFallback>
      </Avatar>
    </header>
  );
}
