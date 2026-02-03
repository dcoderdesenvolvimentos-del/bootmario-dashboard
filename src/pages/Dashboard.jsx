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
  const [uid, setUid] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [gastos, setGastos] = useState([]);
  const [listas, setListas] = useState([]);
  const [lembretes, setLembretes] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());

  /* 🔐 RESTAURA SESSÃO NO REFRESH */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
      else setUid(null);
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  /* 🛑 PROTEÇÕES */
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-blue-600">
        Carregando dashboard...
      </div>
    );
  }

  if (!uid) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        Sessão expirada. Acesse novamente pelo link do Mário.
      </div>
    );
  }

  /* 🔴 FIRESTORE EM TEMPO REAL */
  useEffect(() => {
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

  /* 📈 GRÁFICO DIÁRIO */
  const chartDia = gastosMes.map((g) => ({
    dia: g.timestamp.toDate().getDate(),
    valor: Number(g.valor),
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
      percent: ((value / totalMes) * 100).toFixed(1),
    }));
  }, [gastosMes, totalMes]);

  return (
    <div className="bg-blue-50 min-h-screen p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-bold text-blue-700">Resumo financeiro</h1>

        <select
          className="bg-white border border-blue-200 rounded-lg p-2 text-sm"
          value={mesSelecionado}
          onChange={(e) => setMesSelecionado(e.target.value)}
        >
          {gerarMeses(gastos).map((m) => (
            <option key={m} value={m}>
              {formatarMes(m)}
            </option>
          ))}
        </select>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* GRÁFICOS */}
      <Section title="Gastos por dia">
        <LineChartBox data={chartDia} />
      </Section>

      <Section title="Gastos por categoria">
        <PieChartBox data={chartCategoria} />
      </Section>

      {/* LISTAS E LEMBRETES */}
      <Section title="Últimos gastos">
        {gastosMes.slice(0, 5).map((g) => (
          <Row
            key={g.id}
            left={g.local || "Gasto"}
            right={`R$ ${Number(g.valor).toFixed(2)}`}
          />
        ))}
      </Section>

      <Section title="Lembretes">
        {lembretes.map((l) => (
          <Row key={l.id} left={l.text || l.nome} />
        ))}
      </Section>
    </div>
  );
}

/* 🧩 UI */

function Card({ title, value, highlight }) {
  const color =
    highlight === "red"
      ? "text-red-500"
      : highlight === "green"
        ? "text-green-600"
        : "text-blue-600";

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
      <div className="bg-blue-600 px-4 py-2">
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Row({ left, right }) {
  return (
    <div className="flex justify-between py-2 border-b last:border-0 text-sm">
      <span>{left}</span>
      {right && <span className="text-red-500">{right}</span>}
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex justify-between text-sm">
            <span>{d.name}</span>
            <span className="font-semibold">{d.percent}%</span>
          </div>
        ))}
      </div>
    </div>
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
  const d = new Date(y, m - 2, 1);
  return toMes(d);
}

function gerarMeses(gastos) {
  const set = new Set();
  gastos.forEach((g) => {
    const d = g.timestamp?.toDate?.();
    if (!d) return;
    set.add(toMes(d));
  });
  return Array.from(set).sort().reverse();
}

function formatarMes(m) {
  const [y, mo] = m.split("-");
  return `${mo}/${y}`;
}
