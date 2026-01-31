import { useState } from "react";
import { Button } from "@/components/ui/button";
import Modal from "./Modal";
import AddGasto from "./forms/AddGasto";

export default function FabButton() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null);

  function closeAll() {
    setMenuOpen(false);
    setModal(null);
  }

  return (
    <>
      {/* MENU */}
      {menuOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50">
          <Button onClick={() => setModal("gasto")}>➖ Gasto</Button>
          <Button onClick={() => alert("Receita depois")}>➕ Receita</Button>
          <Button onClick={() => alert("Lembrete depois")}>⏰ Lembrete</Button>
        </div>
      )}

      {/* BOTÃO CENTRAL */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full bg-green-600 text-white text-3xl shadow-lg z-50"
      >
        {menuOpen ? "×" : "+"}
      </button>

      {/* MODAL */}
      <Modal open={modal === "gasto"} onClose={closeAll}>
        <AddGasto onSuccess={closeAll} />
      </Modal>
    </>
  );
}
