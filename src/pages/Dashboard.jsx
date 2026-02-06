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

const COLORS = ["#f97316", "#22c55e", "#3b82f6", "#ef4444", "#8b5cf6"];

export default function Dashboard() {
  const [gastos, setGastos] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());

  const uid = auth.currentUser?.uid;

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

    return () => {
      unsubGastos();
      unsubReceitas();
    };
  }, [uid]);

  const gastosMes = gastos.filter((g) => {
    const d = g.timestamp?.toDate?.();
    return d && toMes(d) === mesSelecionado;
  });

  const receitasMes = receitas.filter((r) => {
    const d = r.createdAt?.toDate?.();
    return d && toMes(d) === mesSelecionado;
  });

  const totalGastos = soma(gastosMes);
  const totalReceitas = soma(receitasMes);
  const saldo = totalReceitas - totalGastos;

  /* 📊 Pizza */
  const chartCategoria = useMemo(() => {
    const map = {};
    gastosMes.forEach((g) => {
      const cat = g.categoria || "Outros";
      map[cat] = (map[cat] || 0) + Number(g.valor);
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      percent: ((value / totalGastos) * 100).toFixed(1),
    }));
  }, [gastosMes]);

  /* 📈 Linha */
  const chartDia = gastosMes.map((g) => ({
    dia: g.timestamp.toDate().getDate(),
    valor: Number(g.valor),
  }));

  return (
    <div className="bg-slate-100 min-h-screen p-4 space-y-5">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Resumo financeiro</h1>

        <select
          className="bg-white rounded-lg px-3 py-1 text-sm shadow"
          value={mesSelecionado}
          onChange={(e) => setMesSelecionado(e.target.value)}
        >
          {[
            ...new Set(
              [...gastos, ...receitas].map((g) =>
                toMes((g.timestamp || g.createdAt).toDate()),
              ),
            ),
          ].map((m) => (
            <option key={m} value={m}>
              {formatarMes(m)}
            </option>
          ))}
        </select>
      </div>

      {/* RECEITAS / DESPESAS */}
      <div className="grid grid-cols-2 gap-4">
        <SummaryCard title="Receitas" value={totalReceitas} color="green" />
        <SummaryCard title="Despesas" value={totalGastos} color="red" />
      </div>

      {/* SALDO */}
      <SummaryCard
        title="Saldo atual"
        value={saldo}
        color={saldo >= 0 ? "green" : "red"}
        big
      />

      {/* 🍩 GASTOS POR CATEGORIA */}
      <Card title="Detalhes">
        {chartCategoria.length ? (
          <div className="h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartCategoria} dataKey="value" outerRadius={90}>
                  {chartCategoria.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty />
        )}
      </Card>

      {/* 📈 GASTOS POR DIA */}
      <Card title="Gastos por dia">
        {chartDia.length ? (
          <div className="h-48">
            <ResponsiveContainer>
              <LineChart data={chartDia}>
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Line dataKey="valor" stroke="#f97316" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty />
        )}
      </Card>

      {/* 💳 ÚLTIMAS TRANSAÇÕES */}
      <UltimasTransacoes gastos={gastosMes} receitas={receitasMes} />
    </div>
  );
}

/* ================= COMPONENTES ================= */

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function SummaryCard({ title, value, color, big }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow p-4 ${big ? "text-center" : ""}`}
    >
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`text-2xl font-bold text-${color}-600`}>
        {formatMoney(value)}
      </p>
    </div>
  );
}

function UltimasTransacoes({ gastos, receitas }) {
  const transacoes = [
    ...gastos.map((g) => ({
      tipo: "despesa",
      texto: g.local,
      valor: g.valor,
      categoria: g.categoria,
      data: g.timestamp.toDate(),
    })),
    ...receitas.map((r) => ({
      tipo: "receita",
      texto: r.descricao,
      valor: r.valor,
      categoria: r.origem,
      data: r.createdAt.toDate(),
    })),
  ].sort((a, b) => b.data - a.data);

  return (
    <Card title="Últimas transações">
      {transacoes.slice(0, 6).map((t, i) => (
        <div
          key={i}
          className="flex justify-between py-3 border-b last:border-0"
        >
          <div>
            <p className="font-medium">{t.texto}</p>
            <div className="flex gap-2 mt-1">
              <Tag>{t.categoria}</Tag>
              <Tag color={t.tipo === "despesa" ? "red" : "green"}>{t.tipo}</Tag>
            </div>
          </div>
          <span
            className={`font-semibold text-${t.tipo === "despesa" ? "red" : "green"}-600`}
          >
            {formatMoney(t.valor)}
          </span>
        </div>
      ))}
    </Card>
  );
}

function Tag({ children, color = "gray" }) {
  const map = {
    gray: "bg-gray-100 text-gray-600",
    red: "bg-red-100 text-red-600",
    green: "bg-green-100 text-green-600",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${map[color]}`}>
      {children}
    </span>
  );
}

function Empty() {
  return <p className="text-sm text-slate-400">Sem dados</p>;
}

/* ================= HELPERS ================= */

function soma(arr) {
  return arr.reduce((acc, v) => acc + Number(v.valor || 0), 0);
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

function formatarMes(m) {
  const [y, mo] = m.split("-");
  return `${mo}/${y}`;
}
