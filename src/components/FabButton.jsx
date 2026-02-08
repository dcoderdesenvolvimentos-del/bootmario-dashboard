import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MinusCircle, PlusCircle, Bell } from "lucide-react";
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
      {/* OVERLAY COM BLUR */}
      {menuOpen && (
        <div
          onClick={closeAll}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        />
      )}

      {/* MENU FLUTUANTE */}
      {menuOpen && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 flex flex-col gap-3 z-50 animate-in fade-in slide-in-from-bottom-4">
          <FabMenuButton
            label="Gasto"
            color="red"
            icon={<MinusCircle size={20} />}
            onClick={() => setModal("gasto")}
          />

          <FabMenuButton
            label="Receita"
            color="green"
            icon={<PlusCircle size={20} />}
            onClick={() => alert("Receita depois")}
          />

          <FabMenuButton
            label="Lembrete"
            color="purple"
            icon={<Bell size={20} />}
            onClick={() => alert("Lembrete depois")}
          />
        </div>
      )}

      {/* BOTÃO PRINCIPAL */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="
          fixed bottom-6 left-1/2 -translate-x-1/2 z-50
          h-16 w-16 rounded-full text-white text-3xl
          flex items-center justify-center
          bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500
          shadow-[0_12px_30px_rgba(99,102,241,0.45)]
          transition-all duration-300
          hover:scale-110
          active:scale-95
        "
      >
        <span
          className={`transition-transform duration-300 ${
            menuOpen ? "rotate-45" : "rotate-0"
          }`}
        >
          +
        </span>
      </button>

      {/* MODAL */}
      <Modal open={modal === "gasto"} onClose={closeAll}>
        <AddGasto onSuccess={closeAll} />
      </Modal>
    </>
  );
}

/* ================= BOTÃO DO MENU ================= */

function FabMenuButton({ label, icon, color, onClick }) {
  const colors = {
    red: "text-red-600 hover:bg-red-50",
    green: "text-green-600 hover:bg-green-50",
    purple: "text-purple-600 hover:bg-purple-50",
  };

  return (
    <Button
      onClick={onClick}
      className={`
        flex items-center gap-3 px-6 py-3 rounded-full
        bg-white shadow-lg
        transition-all
        ${colors[color]}
      `}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Button>
  );
}
