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
  const uid = auth.currentUser?.uid;

  const [gastos, setGastos] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [listas, setListas] = useState([]);
  const [lembretes, setLembretes] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());
  const [filtroTransacao, setFiltroTransacao] = useState("todas");

  /* 🔴 TEMPO REAL */
  useEffect(() => {
    if (!uid) return;

    const unsubs = [
      onSnapshot(collection(db, "users", uid, "gastos"), (snap) =>
        setGastos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(collection(db, "users", uid, "receitas"), (snap) =>
        setReceitas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(collection(db, "users", uid, "listas"), (snap) =>
        setListas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
      onSnapshot(collection(db, "users", uid, "lembretes"), (snap) =>
        setLembretes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ),
    ];

    return () => unsubs.forEach((u) => u());
  }, [uid]);

  /* 📅 FILTRO MÊS */
  const gastosMes = gastos.filter(
    (g) =>
      g.timestamp?.toDate && toMes(g.timestamp.toDate()) === mesSelecionado,
  );

  const receitasMes = receitas.filter(
    (r) =>
      r.createdAt?.toDate && toMes(r.createdAt.toDate()) === mesSelecionado,
  );

  /* 💰 TOTAIS */
  const totalGastos = soma(gastosMes);
  const totalReceitas = soma(receitasMes);
  const saldoAtual = totalReceitas - totalGastos;

  /* 📈 GRÁFICO DIA */
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
    }));
  }, [gastosMes]);

  /* 🔁 TRANSAÇÕES */
  const transacoes = useMemo(() => {
    const lista = [
      ...gastos.map((g) => ({
        id: g.id,
        tipo: "Despesa",
        titulo: g.local || "Despesa",
        valor: g.valor,
        categoria: g.categoria || "outros",
        status: "Pago",
        data: g.timestamp.toDate(),
      })),
      ...receitas.map((r) => ({
        id: r.id,
        tipo: "Receita",
        titulo: r.descricao || "Receita",
        valor: r.valor,
        categoria: r.origem || "Entrada",
        status: "Recebido",
        data: r.createdAt.toDate(),
      })),
    ].sort((a, b) => b.data - a.data);

    if (filtroTransacao === "despesas")
      return lista.filter((t) => t.tipo === "Despesa");

    if (filtroTransacao === "receitas")
      return lista.filter((t) => t.tipo === "Receita");

    return lista;
  }, [gastos, receitas, filtroTransacao]);

  return (
    <div className="bg-blue-50 min-h-screen p-4 space-y-6">
      {/* HEADER */}
      <Card>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700">
            Resumo financeiro
          </h1>

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
      </Card>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 gap-4">
        <Card title="Receitas do mês" value={formatMoney(totalReceitas)} />
        <Card title="Gastos do mês" value={formatMoney(totalGastos)} />
        <Card title="Saldo atual" value={formatMoney(saldoAtual)} />
        <Card title="Listas" value={listas.length} />
        <Card title="Compromissos" value={lembretes.length} />
      </div>

      {/* GRÁFICOS */}
      <Card title="Gastos por dia">
        <LineChartBox data={chartDia} />
      </Card>

      <Card title="Gastos por categoria">
        <PieChartBox data={chartCategoria} />
      </Card>

      {/* TRANSAÇÕES */}
      <Card title="Últimas transações">
        <div className="flex gap-2 mb-4">
          {["todas", "despesas", "receitas"].map((f) => (
            <Filtro
              key={f}
              ativo={filtroTransacao === f}
              onClick={() => setFiltroTransacao(f)}
            >
              {f}
            </Filtro>
          ))}
        </div>

        {transacoes.slice(0, 8).map((t) => (
          <div
            key={t.id}
            className="flex justify-between items-start py-3 border-b last:border-0"
          >
            <div>
              <p className="font-medium">{t.titulo}</p>
              <div className="flex gap-2 mt-1 flex-wrap text-xs">
                <Tag>{t.categoria}</Tag>
                <Tag>{t.tipo}</Tag>
                <Tag>{t.status}</Tag>
              </div>
            </div>

            <span
              className={
                t.tipo === "Despesa" ? "text-red-500" : "text-green-600"
              }
            >
              {formatMoney(t.valor)}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* 🧩 COMPONENTES */

function Card({ title, value, children }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
      {title && <p className="text-sm text-slate-500 mb-1">{title}</p>}
      {value !== undefined && (
        <p className="text-xl font-bold text-blue-600 mb-2">{value}</p>
      )}
      {children}
    </div>
  );
}

function Filtro({ ativo, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm ${
        ativo ? "bg-blue-600 text-white" : "bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function Tag({ children }) {
  return (
    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
      {children}
    </span>
  );
}

/* 📊 CHARTS */

function LineChartBox({ data }) {
  if (!data.length) return <p className="text-sm text-slate-400">Sem dados</p>;

  return (
    <div className="h-56">
      <ResponsiveContainer>
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
    <div className="h-56">
      <ResponsiveContainer>
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

/* 🔧 HELPERS */

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

function gerarMeses(gastos) {
  const set = new Set();
  gastos.forEach((g) => {
    const d = g.timestamp?.toDate?.();
    if (d) set.add(toMes(d));
  });
  return Array.from(set).sort().reverse();
}

function formatarMes(m) {
  const [y, mo] = m.split("-");
  return `${mo}/${y}`;
}
