import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import Page from "../components/Page";
import { db } from "../firebase";

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

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

/* ================= UTIL ================= */
function formatarDataHora(timestamp) {
  if (!timestamp) return "";
  const d = timestamp.toDate();
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Gastos() {
  const uid = localStorage.getItem("uid");

  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);

  /* filtros */
  const [periodo, setPeriodo] = useState("mes");
  const [categoria, setCategoria] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  /* modais */
  const [showNew, setShowNew] = useState(false);
  const [editando, setEditando] = useState(null);
  const [limiteCategorias, setLimiteCategorias] = useState("all");

  /* ================= FETCH ================= */
  async function buscarGastos() {
    if (!uid) return;

    const q = query(
      collection(db, "users", uid, "gastos"),
      orderBy("timestamp", "desc"),
    );

    const snap = await getDocs(q);
    setGastos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => {
    buscarGastos();
  }, [uid]);

  /* ================= FILTRO AVANÇADO ================= */
  const gastosFiltrados = useMemo(() => {
    const now = new Date();

    return gastos.filter((g) => {
      const d = g.timestamp?.toDate();
      if (!d) return false;

      if (
        periodo === "mes" &&
        (d.getMonth() !== now.getMonth() ||
          d.getFullYear() !== now.getFullYear())
      )
        return false;

      if (periodo === "passado") {
        const ini = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const fim = new Date(now.getFullYear(), now.getMonth(), 0);
        if (d < ini || d > fim) return false;
      }

      if (categoria && g.categoria !== categoria) return false;
      if (min && Number(g.valor) < Number(min)) return false;
      if (max && Number(g.valor) > Number(max)) return false;

      return true;
    });
  }, [gastos, periodo, categoria, min, max]);

  /* ================= KPIs ================= */
  const total = gastosFiltrados.reduce((a, g) => a + Number(g.valor), 0);

  const totalMesAtual = gastos
    .filter((g) => {
      const d = g.timestamp.toDate();
      const n = new Date();
      return (
        d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
      );
    })
    .reduce((a, g) => a + Number(g.valor), 0);

  const totalMesPassado = gastos
    .filter((g) => {
      const d = g.timestamp.toDate();
      const n = new Date();
      return (
        d.getMonth() === n.getMonth() - 1 && d.getFullYear() === n.getFullYear()
      );
    })
    .reduce((a, g) => a + Number(g.valor), 0);

  const variacao =
    totalMesPassado === 0
      ? 0
      : ((totalMesAtual - totalMesPassado) / totalMesPassado) * 100;

  /* ================= GRÁFICOS ================= */
  const graficoLinha = gastosFiltrados
    .slice()
    .reverse()
    .map((g) => ({
      dia: g.timestamp.toDate().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      valor: g.valor,
    }));

  const graficoCategorias = Object.values(
    gastosFiltrados.reduce((acc, g) => {
      acc[g.categoria] ??= { name: g.categoria, value: 0 };
      acc[g.categoria].value += Number(g.valor);
      return acc;
    }, {}),
  );

  const totalCategorias = graficoCategorias.reduce(
    (acc, c) => acc + c.value,
    0,
  );

  const categoriasExibidas =
    limiteCategorias === "top5"
      ? graficoCategorias.sort((a, b) => b.value - a.value).slice(0, 5)
      : graficoCategorias;

  const categoriasUnicas = [...new Set(gastos.map((g) => g.categoria))];

  /* ================= AÇÕES ================= */
  async function excluir(id) {
    if (!confirm("Excluir este gasto?")) return;
    await deleteDoc(doc(db, "users", uid, "gastos", id));
    buscarGastos();
  }

  return (
    <Page title="Gastos">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Kpi title="Total" value={`R$ ${total.toFixed(2)}`} />
        <Kpi title="Mês passado" value={`R$ ${totalMesPassado.toFixed(2)}`} />
        <Kpi
          title="Variação"
          value={`${variacao.toFixed(1)}%`}
          color={variacao >= 0 ? "text-white" : "text-white"}
        />
      </div>

      {/* FILTROS */}
      <Card>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="input"
          >
            <option value="mes">Mês atual</option>
            <option value="passado">Mês passado</option>
          </select>

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="input"
          >
            <option value="">Todas categorias</option>
            {categoriasUnicas.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <input
            placeholder="Valor mínimo"
            type="number"
            className="input"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />

          <input
            placeholder="Valor máximo"
            type="number"
            className="input"
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
        </div>
      </Card>

      {/* GRÁFICOS */}
      <Card>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={graficoLinha}>
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip />
            <Line dataKey="valor" stroke="#ef4444" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        {/* HEADER */}
        <div className="flex justify-between items-center mb-3">
          <p className="font-semibold text-slate-700">Gastos por categoria</p>

          <select
            value={limiteCategorias}
            onChange={(e) => setLimiteCategorias(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="all">Todas</option>
            <option value="top5">Top 5</option>
          </select>
        </div>

        {/* GRÁFICO */}
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={categoriasExibidas}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={80}
            >
              {categoriasExibidas.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>

        {/* LEGENDA / DADOS */}
        <div className="mt-4 space-y-2">
          {categoriasExibidas.map((cat, i) => {
            const percent = totalCategorias
              ? ((cat.value / totalCategorias) * 100).toFixed(1)
              : 0;

            return (
              <div
                key={cat.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span>{cat.name}</span>
                </div>

                <div className="text-right">
                  <p className="font-medium">R$ {cat.value.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{percent}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* LISTA */}
      {loading && <p className="text-center text-gray-400">Carregando...</p>}

      {gastosFiltrados.map((g) => (
        <div
          key={g.id}
          className="bg-white rounded-xl p-4 shadow border-l-4 border-blue-500 flex justify-between items-center"
        >
          <div>
            <p className="font-medium">{g.local}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{g.categoria}</span>
              <span>•</span>
              <span>{formatarDataHora(g.timestamp)}</span>
            </div>
          </div>

          <div className="text-right">
            <p className="font-bold text-red-600">
              R$ {Number(g.valor).toFixed(2)}
            </p>
            <div className="flex gap-2 text-xs">
              <button onClick={() => setEditando(g)} className="text-blue-600">
                Editar
              </button>
              <button onClick={() => excluir(g.id)} className="text-red-600">
                Excluir
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* BOTÃO FLUTUANTE */}
      <button
        onClick={() => setShowNew(true)}
        className="fixed bottom-20 right-4 bg-gradient-to-r from-blue-800 to-blue-600 text-white rounded-full w-14 h-14 text-2xl shadow-lg"
      >
        +
      </button>

      {/* MODAIS */}
      {showNew && (
        <GastoModal onClose={() => setShowNew(false)} onSave={buscarGastos} />
      )}

      {editando && (
        <GastoModal
          gasto={editando}
          onClose={() => setEditando(null)}
          onSave={buscarGastos}
        />
      )}
    </Page>
  );
}

/* ================= COMPONENTES ================= */

function Kpi({ title, value, color }) {
  return (
    <div className="bg-gradient-to-br from-blue-900 to-blue-600 text-white rounded-xl p-3 shadow">
      <p className="text-xs opacity-80">{title}</p>
      <p className={`font-bold ${color || ""}`}>{value}</p>
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow">
      {children}
    </div>
  );
}

/* ================= MODAL ================= */

function GastoModal({ gasto, onClose, onSave }) {
  const uid = localStorage.getItem("uid");

  const [form, setForm] = useState({
    local: gasto?.local || "",
    categoria: gasto?.categoria || "",
    valor: gasto?.valor || "",
  });

  async function salvar() {
    if (gasto) {
      await updateDoc(doc(db, "users", uid, "gastos", gasto.id), {
        ...form,
        valor: Number(form.valor),
      });
    } else {
      await addDoc(collection(db, "users", uid, "gastos"), {
        ...form,
        valor: Number(form.valor),
        timestamp: Timestamp.now(),
      });
    }

    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-4 w-80 space-y-3">
        <h2 className="font-bold">{gasto ? "Editar gasto" : "Novo gasto"}</h2>

        <input
          placeholder="Local"
          className="input"
          value={form.local}
          onChange={(e) => setForm({ ...form, local: e.target.value })}
        />
        <input
          placeholder="Categoria"
          className="input"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
        />
        <input
          placeholder="Valor"
          type="number"
          className="input"
          value={form.valor}
          onChange={(e) => setForm({ ...form, valor: e.target.value })}
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border rounded p-2">
            Cancelar
          </button>
          <button
            onClick={salvar}
            className="flex-1 bg-blue-600 text-white rounded p-2"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
