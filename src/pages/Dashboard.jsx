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

/* 🎨 PALETA */
const COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [gastos, setGastos] = useState([]);
  const [listas, setListas] = useState([]);
  const [lembretes, setLembretes] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());

  /* 🔐 ESPERA LOGIN (ESSENCIAL PARA REFRESH) */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  /* 🔴 FIRESTORE TEMPO REAL (SÓ DEPOIS DO LOGIN) */
  useEffect(() => {
    if (!user) return;

    const unsubGastos = onSnapshot(
      collection(db, "users", user.uid, "gastos"),
      (snap) => setGastos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    const unsubListas = onSnapshot(
      collection(db, "users", user.uid, "listas"),
      (snap) => setListas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    const unsubLembretes = onSnapshot(
      collection(db, "users", user.uid, "lembretes"),
      (snap) => setLembretes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    return () => {
      unsubGastos();
      unsubListas();
      unsubLembretes();
    };
  }, [user]);

  /* ⏳ LOADING SEGURO */
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-blue-600">
        Carregando dashboard…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Sessão expirada. Volte pelo link do Mário.
      </div>
    );
  }

  /* 📅 GASTOS DO MÊS */
  const gastosMes = useMemo(() => {
    return gastos.filter((g) => {
      const d = g.timestamp?.toDate?.();
      if (!d) return false;
      return toMes(d) === mesSelecionado;
    });
  }, [gastos, mesSelecionado]);

  /* 📅 MÊS ANTERIOR */
  const mesAnterior = getMesAnterior(mesSelecionado);

  const gastosMesAnterior = useMemo(() => {
    return gastos.filter((g) => {
      const d = g.timestamp?.toDate?.();
      if (!d) return false;
      return toMes(d) === mesAnterior;
    });
  }, [gastos, mesAnterior]);

  /* 💰 TOTAIS */
  const totalMes = soma(gastosMes);
  const totalMesAnterior = soma(gastosMesAnterior);
  const diff = totalMes - totalMesAnterior;

  /* 📈 GRÁFICO DIÁRIO (SEGURO) */
  const chartDia = gastosMes
    .filter((g) => g.timestamp?.toDate)
    .map((g) => ({
      dia: g.timestamp.toDate().getDate(),
      valor: Number(g.valor || 0),
    }));

  /* 📊 GRÁFICO CATEGORIA */
  const chartCategoria = useMemo(() => {
    const map = {};
    gastosMes.forEach((g) => {
      const c = g.categoria || "outros";
      map[c] = (map[c] || 0) + Number(g.valor || 0);
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      percent: totalMes ? ((value / totalMes) * 100).toFixed(1) : 0,
    }));
  }, [gastosMes, totalMes]);

  return (
    <div className="bg-blue-50 min-h-screen p-4 space-y-6">
      <h1 className="text-2xl font-bold text-blue-700">Resumo financeiro</h1>

      {/* CARDS */}
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

/* 🧩 COMPONENTES */

function Card({ title, value, highlight }) {
  const color =
    highlight === "red"
      ? "text-red-500"
      : highlight === "green"
        ? "text-green-600"
        : "text-blue-600";

  return (
    <div className="bg-white rounded-xl p-4 shadow border border-blue-100">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow border border-blue-100 overflow-hidden">
      <div className="bg-blue-500 px-4 py-2 text-white font-semibold">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function LineChartBox({ data }) {
  if (!data.length) return <p className="text-sm text-slate-400">Sem dados</p>;

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
  if (!data.length) return <p className="text-sm text-slate-400">Sem dados</p>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* 🔧 HELPERS */

function soma(arr) {
  return arr.reduce((acc, g) => acc + Number(g.valor || 0), 0);
}

function toMes(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMesAtual() {
  return toMes(new Date());
}

function getMesAnterior(mes) {
  const [y, m] = mes.split("-").map(Number);
  return toMes(new Date(y, m - 2, 1));
}
