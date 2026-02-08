import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/firebase";

export default function MagicLogin() {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function login() {
      try {
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

        // 🔐 Login com token customizado
        const userCredential = await signInWithCustomToken(auth, token);

        // ✅ UID REAL do Firebase Auth
        const uid = userCredential.user.uid;

        // 🔥 SALVA O UID PRA USAR NO DASHBOARD
        localStorage.setItem("uid", uid);

        console.log("✅ UID salvo:", uid);

        navigate("/dashboard");
      } catch (err) {
        console.error("Erro no magic login:", err);
        navigate("/");
      }
    }

    if (auth.currentUser) {
      console.log("✅ Usuário já logado");

      // garante que o uid esteja salvo
      localStorage.setItem("uid", auth.currentUser.uid);

      navigate("/dashboard");
      return;
    }

    login();
  }, [slug, navigate]);

  return <p>Entrando no dashboard…</p>;
}
