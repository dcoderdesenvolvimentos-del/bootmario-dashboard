import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
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
  const [gastos, setGastos] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [listas, setListas] = useState([]);
  const [lembretes, setLembretes] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());

  const uid = auth.currentUser?.uid;

  /* 🔴 TEMPO REAL */
  useEffect(() => {
    if (!uid) return;

    const unsubGastos = onSnapshot(
      collection(db, "users", uid, "gastos"),
      (snap) => setGastos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    const unsubReceitas = onSnapshot(
      collection(db, "users", uid, "receitas"),
      (snap) => setReceitas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
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
      unsubReceitas();
      unsubListas();
      unsubLembretes();
    };
  }, [uid]);

  /* 📅 FILTRO POR MÊS */
  const gastosMes = useMemo(
    () =>
      gastos.filter((g) => {
        const d = g.timestamp?.toDate?.();
        return d && toMes(d) === mesSelecionado;
      }),
    [gastos, mesSelecionado],
  );

  const receitasMes = useMemo(
    () =>
      receitas.filter((r) => {
        const d = r.createdAt?.toDate?.();
        return d && toMes(d) === mesSelecionado;
      }),
    [receitas, mesSelecionado],
  );

  /* 💰 TOTAIS */
  const totalReceitas = soma(receitasMes);
  const totalGastos = soma(gastosMes);
  const saldoAtual = totalReceitas - totalGastos;

  return (
    <div className="bg-blue-50 min-h-screen p-4 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-700">Resumo financeiro</h1>

        <select
          className="bg-white border rounded-lg px-3 py-1 text-sm"
          value={mesSelecionado}
          onChange={(e) => setMesSelecionado(e.target.value)}
        >
          {gerarMeses([...gastos, ...receitas]).map((m) => (
            <option key={m} value={m}>
              {formatarMes(m)}
            </option>
          ))}
        </select>
      </div>

      {/* 🔢 CARDS SUPERIORES */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          title="Receitas"
          value={formatMoney(totalReceitas)}
          highlight="green"
        />
        <Card
          title="Despesas"
          value={formatMoney(totalGastos)}
          highlight="red"
        />
      </div>

      {/* 🔢 CARDS INFERIORES */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          title="Saldo atual"
          value={formatMoney(saldoAtual)}
          highlight={saldoAtual >= 0 ? "green" : "red"}
        />
        <Card title="Listas" value={listas.length} />
        <Card title="Compromissos" value={lembretes.length} />
      </div>

      {/* 📋 ÚLTIMAS TRANSAÇÕES */}
      <UltimasTransacoes gastos={gastosMes} receitas={receitasMes} />
    </div>
  );
}

/* =======================
   COMPONENTES
======================= */

function Card({ title, value, highlight }) {
  const color =
    highlight === "red"
      ? "text-red-500"
      : highlight === "green"
        ? "text-green-600"
        : "text-blue-600";

  return (
    <div className="bg-white rounded-xl p-4 shadow border">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

/* =======================
   ÚLTIMAS TRANSAÇÕES
======================= */

function UltimasTransacoes({ gastos, receitas }) {
  const [filtro, setFiltro] = useState("todas");

  const transacoes = useMemo(() => {
    const g = gastos.map((g) => ({
      id: g.id,
      tipo: "despesa",
      descricao: g.local || "Despesa",
      categoria: g.categoria || "Outros",
      valor: Number(g.valor),
      data: g.timestamp?.toDate?.(),
      status: "Pago",
    }));

    const r = receitas.map((r) => ({
      id: r.id,
      tipo: "receita",
      descricao: r.descricao || "Receita",
      categoria: r.origem || "Entrada",
      valor: Number(r.valor),
      data: r.createdAt?.toDate?.(),
      status: "Recebido",
    }));

    let todas = [...g, ...r].filter((t) => t.data);
    todas.sort((a, b) => b.data - a.data);

    if (filtro === "despesas") return todas.filter((t) => t.tipo === "despesa");
    if (filtro === "receitas") return todas.filter((t) => t.tipo === "receita");

    return todas;
  }, [gastos, receitas, filtro]);

  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Últimas transações</h2>

        <div className="flex gap-2 mt-3">
          {["todas", "despesas", "receitas"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1 rounded-full text-sm border ${
                filtro === f
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600"
              }`}
            >
              {f === "todas"
                ? "Todas"
                : f === "despesas"
                  ? "Despesas"
                  : "Receitas"}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y">
        {transacoes.slice(0, 10).map((t) => (
          <div key={t.id} className="p-4 flex justify-between">
            <div>
              <p className="font-medium">{t.descricao}</p>
              <p className="text-xs text-slate-400">
                {t.data.toLocaleDateString("pt-BR")}
              </p>

              <div className="flex gap-2 mt-1">
                <Tag color="orange">{t.categoria}</Tag>
                <Tag color={t.tipo === "despesa" ? "red" : "green"}>
                  {t.tipo === "despesa" ? "Despesa" : "Receita"}
                </Tag>
                <Tag color="green">{t.status}</Tag>
              </div>
            </div>

            <div
              className={`font-semibold ${
                t.tipo === "despesa" ? "text-red-500" : "text-green-600"
              }`}
            >
              {formatMoney(t.valor)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tag({ children, color }) {
  const map = {
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
    green: "bg-green-100 text-green-700",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${map[color]}`}>
      {children}
    </span>
  );
}

/* =======================
   HELPERS
======================= */

function soma(arr) {
  return arr.reduce((acc, g) => acc + Number(g.valor || 0), 0);
}

function formatMoney(v) {
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function toMes(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMesAtual() {
  return toMes(new Date());
}

function gerarMeses(items) {
  const set = new Set();
  items.forEach((i) => {
    const d = i.timestamp?.toDate?.() || i.createdAt?.toDate?.();
    if (d) set.add(toMes(d));
  });
  return Array.from(set).sort().reverse();
}

function formatarMes(m) {
  const [y, mo] = m.split("-");
  return `${mo}/${y}`;
}
