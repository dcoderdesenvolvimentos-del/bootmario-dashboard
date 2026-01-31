import { useEffect, useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/firebase";

export default function AddGasto({ onSuccess }) {
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
    });

    return () => unsub();
  }, []);

  async function salvar() {
    if (!user) {
      alert("Usuário não autenticado");
      return;
    }

    await addDoc(collection(db, "users", user.uid, "gastos"), {
      valor: Number(valor),
      descricao,
      createdAt: Timestamp.now(),
    });

    setValor("");
    setDescricao("");
    onSuccess?.();
  }

  return (
    <>
      <h2 className="text-lg font-semibold mb-3">Novo gasto</h2>

      <input
        className="w-full border p-2 rounded mb-2"
        placeholder="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />

      <input
        type="number"
        className="w-full border p-2 rounded mb-2"
        placeholder="Valor"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />

      <button
        onClick={salvar}
        className="w-full bg-green-600 text-white p-2 rounded"
        disabled={!user}
      >
        Salvar
      </button>
    </>
  );
}
