import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useState } from "react";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const user = auth.currentUser;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold"
      >
        {user?.uid?.slice(0, 2).toUpperCase()}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow">
          <button className="w-full px-4 py-2 text-sm hover:bg-blue-50">
            Meus dados
          </button>
          <button
            onClick={() => signOut(auth)}
            className="w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
