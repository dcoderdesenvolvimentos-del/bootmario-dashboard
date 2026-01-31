import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/firebase";

export default function MagicLogin() {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function login() {
      const res = await fetch(
        "https://bot-whatsapp-production-0c8c.up.railway.app/dashboard/magic-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        },
      );

      if (!res.ok) {
        navigate("/");
        return;
      }

      const { token } = await res.json();
      await signInWithCustomToken(auth, token);

      navigate("/dashboard");
    }

    if (auth.currentUser) {
      console.log("✅ Usuário já logado, pulando magic login");
      return;
    }
    login();
  }, [slug]);

  return <p>Entrando no dashboard…</p>;
}
