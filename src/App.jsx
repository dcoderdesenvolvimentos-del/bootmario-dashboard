import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import MagicLogin from "./pages/MagicLogin";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* login mágico */}
        <Route path="/m/:slug" element={<MagicLogin />} />

        {/* dashboard protegido */}
        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />

        {/* rota padrão */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
