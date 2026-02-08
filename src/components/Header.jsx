import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const [uid, setUid] = useState(null);
  const [initial, setInitial] = useState("?");

  // 🔐 ESCUTA O AUTH (resolve refresh)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
        setInitial("?");
      }
    });

    return () => unsubAuth();
  }, []);

  // 🔴 ESCUTA DADOS DO USUÁRIO
  useEffect(() => {
    if (!uid) return;

    const unsubUser = onSnapshot(doc(db, "users", uid), (snap) => {
      const data = snap.data();
      if (data?.name) {
        setInitial(data.name.charAt(0).toUpperCase());
      }
    });

    return () => unsubUser();
  }, [uid]);

  return (
    <header
      className="
      fixed top-0 left-0 right-0 z-50
      h-16 px-4
      flex items-center justify-between
      bg-gradient-to-r from-blue-600 to-indigo-600
      backdrop-blur-md
      shadow-md
    "
    >
      {/* LOGO / TÍTULO */}
      <div className="flex flex-col leading-tight">
        <span className="text-white font-bold text-lg tracking-tight">
          Mario.ai
        </span>
        <span className="text-xs text-blue-100">Seu controle financeiro</span>
      </div>
      <Avatar className="h-9 w-9 cursor-pointer">
        <AvatarFallback className="bg-white text-blue-600 font-bold">
          {initial}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
