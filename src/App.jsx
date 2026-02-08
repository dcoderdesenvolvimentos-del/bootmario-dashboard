import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import MagicLogin from "./pages/MagicLogin";

import Gastos from "./pages/Gastos";
import Receitas from "./pages/Receitas";
import Listas from "./pages/Listas";
import Compromissos from "./pages/Compromissos";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* login mágico */}
        <Route path="/m/:slug" element={<MagicLogin />} />

        {/* rotas protegidas */}
        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />

        <Route
          path="/gastos"
          element={
            <AppLayout>
              <Gastos />
            </AppLayout>
          }
        />

        <Route
          path="/receitas"
          element={
            <AppLayout>
              <Receitas />
            </AppLayout>
          }
        />

        <Route
          path="/listas"
          element={
            <AppLayout>
              <Listas />
            </AppLayout>
          }
        />

        <Route
          path="/compromissos"
          element={
            <AppLayout>
              <Compromissos />
            </AppLayout>
          }
        />

        {/* rota padrão */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
