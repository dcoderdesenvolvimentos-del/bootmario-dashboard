import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/auth/AuthProvider";
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
  const { user, loading } = useAuth();

  const [gastos, setGastos] = useState([]);
  const [listas, setListas] = useState([]);
  const [lembretes, setLembretes] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());

  /* ⏳ EVITA QUEBRAR NO REFRESH */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-blue-600">
        Carregando dashboard…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        Sessão expirada. Acesse pelo link do Mário.
      </div>
    );
  }

  const uid = user.uid;

  /* 🔥 FIRESTORE EM TEMPO REAL */
  useEffect(() => {
    if (!uid) return;

    const unsubGastos = onSnapshot(
      collection(db, "users", uid, "gastos"),
      (snap) => setGastos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    const unsubListas = onSnapshot(
      collection(db, "users", uid, "listas"),
      (snap) => setListas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    const unsubLembretes = onSnapshot(
      collection(db, "users", uid, "lembretes"),
      (snap) => setLembretes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    return () => {
      unsubGastos();
      unsubListas();
      unsubLembretes();
    };
  }, [uid]);

  /* 📅 FILTRO POR MÊS */
  const gastosMes = useMemo(() => {
    return gastos.filter((g) => {
      const d = g.timestamp?.toDate?.();
      if (!d) return false;
      return toMes(d) === mesSelecionado;
    });
  }, [gastos, mesSelecionado]);

  const totalMes = soma(gastosMes);

  /* 📊 GRÁFICOS */
  const chartDia = gastosMes.map((g) => ({
    dia: g.timestamp.toDate().getDate(),
    valor: Number(g.valor),
  }));

  const chartCategoria = useMemo(() => {
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

  return (
    <div className="bg-blue-50 min-h-screen p-4 space-y-6">
      <h1 className="text-2xl font-bold text-blue-700">Resumo geral</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Gastos do mês" value={`R$ ${totalMes.toFixed(2)}`} />
        <Card title="Listas" value={listas.length} />
        <Card title="Lembretes" value={lembretes.length} />
        <Card title="Registros" value={gastos.length} />
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

/* UI */

function Card({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow border">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-xl font-bold text-blue-600">{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow border">
      <div className="bg-blue-600 text-white px-4 py-2 font-semibold">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function LineChartBox({ data }) {
  if (!data.length) return <p>Sem dados</p>;

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="dia" />
          <YAxis />
          <Tooltip />
          <Line dataKey="valor" stroke="#2563eb" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieChartBox({ data }) {
  if (!data.length) return <p>Sem dados</p>;

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" outerRadius={90}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* HELPERS */

function soma(arr) {
  return arr.reduce((acc, g) => acc + Number(g.valor || 0), 0);
}

function toMes(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMesAtual() {
  return toMes(new Date());
}
