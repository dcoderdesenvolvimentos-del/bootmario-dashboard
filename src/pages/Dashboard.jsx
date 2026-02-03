import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [gastos, setGastos] = useState([]);
  const [listas, setListas] = useState([]);
  const [lembretes, setLembretes] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());

  /* 🔐 AUTH */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  /* 🔴 FIRESTORE */
  useEffect(() => {
    if (!user) return;

    const u1 = onSnapshot(collection(db, "users", user.uid, "gastos"), (snap) =>
      setGastos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    const u2 = onSnapshot(collection(db, "users", user.uid, "listas"), (snap) =>
      setListas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    const u3 = onSnapshot(
      collection(db, "users", user.uid, "lembretes"),
      (snap) => setLembretes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    return () => {
      u1();
      u2();
      u3();
    };
  }, [user]);

  /* 📅 GASTOS DO MÊS */
  const gastosMes = useMemo(() => {
    if (!gastos.length) return [];
    return gastos.filter((g) => {
      const d = g.timestamp?.toDate?.();
      if (!d) return false;
      return toMes(d) === mesSelecionado;
    });
  }, [gastos, mesSelecionado]);

  /* 📅 MÊS ANTERIOR */
  const gastosMesAnterior = useMemo(() => {
    if (!gastos.length) return [];
    const mesAnterior = getMesAnterior(mesSelecionado);
    return gastos.filter((g) => {
      const d = g.timestamp?.toDate?.();
      if (!d) return false;
      return toMes(d) === mesAnterior;
    });
  }, [gastos, mesSelecionado]);

  /* 💰 TOTAIS */
  const totalMes = useMemo(() => soma(gastosMes), [gastosMes]);
  const totalMesAnterior = useMemo(
    () => soma(gastosMesAnterior),
    [gastosMesAnterior],
  );
  const diff = totalMes - totalMesAnterior;

  /* 📈 GRÁFICO DIA */
  const chartDia = useMemo(() => {
    return gastosMes
      .filter((g) => g.timestamp?.toDate)
      .map((g) => ({
        dia: g.timestamp.toDate().getDate(),
        valor: Number(g.valor || 0),
      }));
  }, [gastosMes]);

  /* 📊 CATEGORIAS */
  const chartCategoria = useMemo(() => {
    if (!totalMes) return [];
    const map = {};
    gastosMes.forEach((g) => {
      const c = g.categoria || "outros";
      map[c] = (map[c] || 0) + Number(g.valor || 0);
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      percent: ((value / totalMes) * 100).toFixed(1),
    }));
  }, [gastosMes, totalMes]);

  /* 🖥️ RENDER */
  if (loadingAuth) {
    return <div className="p-10 text-blue-600">Carregando…</div>;
  }

  if (!user) {
    return <div className="p-10 text-red-500">Sessão expirada</div>;
  }

  return (
    <div className="bg-blue-50 min-h-screen p-4 space-y-6">
      <h1 className="text-2xl font-bold text-blue-700">Resumo financeiro</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Gastos do mês" value={`R$ ${totalMes.toFixed(2)}`} />
        <Card
          title="Mês anterior"
          value={`R$ ${totalMesAnterior.toFixed(2)}`}
        />
        <Card
          title="Diferença"
          value={`${diff >= 0 ? "+" : ""}R$ ${diff.toFixed(2)}`}
          highlight={diff > 0 ? "red" : "green"}
        />
        <Card title="Listas" value={listas.length} />
      </div>

      <Section title="Gastos por dia">
        <LineChartBox data={chartDia} />
      </Section>

      <Section title="Gastos por categoria">
        <PieChartBox data={chartCategoria} />
      </Section>
    </div>
  );
}

/* COMPONENTES AUXILIARES (IGUAIS AO SEU) */
// Card, Section, LineChartBox, PieChartBox, helpers
