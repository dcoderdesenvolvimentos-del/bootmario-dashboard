import { Home, Wallet, Bell, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function BottomBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <>
      {/* MENU MAIS */}
      {openMenu && <MoreMenu onClose={() => setOpenMenu(false)} />}

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex justify-around items-center z-40">
        <Item
          icon={<Home size={22} />}
          label="Home"
          active={location.pathname === "/dashboard"}
          onClick={() => navigate("/dashboard")}
        />

        <Item
          icon={<Wallet size={22} />}
          label="Gastos"
          active={location.pathname.startsWith("/gastos")}
          onClick={() => navigate("/gastos")}
        />

        {/* ESPAÇO CENTRAL (caso você use FAB depois) */}
        <div className="w-12" />

        <Item
          icon={<Bell size={22} />}
          label="Lembretes"
          active={location.pathname.startsWith("/compromissos")}
          onClick={() => navigate("/compromissos")}
        />

        {/* BOTÃO MAIS */}
        <button
          onClick={() => setOpenMenu(true)}
          className="flex flex-col items-center text-xs text-gray-500"
        >
          <Menu size={22} />
          Mais
        </button>
      </nav>
    </>
  );
}

/* ========================= */
/* ITEM DO BOTTOM BAR        */
/* ========================= */
function Item({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center text-xs transition-colors ${
        active ? "text-blue-600" : "text-gray-500"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ========================= */
/* MENU "MAIS" (OVERLAY)     */
/* ========================= */
function MoreMenu({ onClose }) {
  const navigate = useNavigate();

  function go(path) {
    navigate(path);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
      <div className="w-full bg-white rounded-t-2xl p-4 space-y-2">
        <MenuItem label="Dashboard" onClick={() => go("/dashboard")} />
        <MenuItem label="Gastos" onClick={() => go("/gastos")} />
        <MenuItem label="Receitas" onClick={() => go("/receitas")} />
        <MenuItem label="Listas" onClick={() => go("/listas")} />
        <MenuItem label="Compromissos" onClick={() => go("/compromissos")} />

        <div className="border-t my-2" />

        <MenuItem label="Configurações" onClick={() => go("/configuracoes")} />

        <button
          onClick={onClose}
          className="w-full py-3 text-center text-gray-500"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ========================= */
/* ITEM DO MENU "MAIS"       */
/* ========================= */
function MenuItem({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100"
    >
      {label}
    </button>
  );
}
