import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import {
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";

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
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [gastos, setGastos] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [listas, setListas] = useState([]);
  const [lembretes, setLembretes] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());
  const mesAnterior = getMesAnterior(mesSelecionado);

  const [uid, setUid] = useState(null);

  /* 📅 FILTROS */
  const gastosMes = gastos.filter((g) => {
    const d = g.timestamp?.toDate?.();
    return d && toMes(d) === mesSelecionado;
  });

  const receitasMes = receitas.filter((r) => {
    const d = r.createdAt?.toDate?.();
    return d && toMes(d) === mesSelecionado;
  });

  /* 💰 TOTAIS (PRIMEIRO!) */
  const totalGastos = soma(gastosMes);
  const totalReceitas = soma(receitasMes);
  const saldoAtual = totalReceitas - totalGastos;

  const gastosMesAnterior = gastos.filter((g) => {
    const d = g.timestamp?.toDate?.();
    return d && toMes(d) === mesAnterior;
  });

  const receitasMesAnterior = receitas.filter((r) => {
    const d = r.createdAt?.toDate?.();
    return d && toMes(d) === mesAnterior;
  });

  const totalGastosAnterior = soma(gastosMesAnterior);
  const totalReceitasAnterior = soma(receitasMesAnterior);

  /* 📊 VARIAÇÕES (%) — SÓ AGORA */
  const variacaoReceitas =
    totalReceitasAnterior > 0
      ? ((totalReceitas - totalReceitasAnterior) / totalReceitasAnterior) * 100
      : 0;

  const variacaoGastos =
    totalGastosAnterior > 0
      ? ((totalGastos - totalGastosAnterior) / totalGastosAnterior) * 100
      : 0;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) return;

    const unsubUser = onSnapshot(doc(db, "users", uid), (snap) => {
      const data = snap.data();
      if (data?.name) {
        setNomeUsuario(data.name);
      }
    });

    return () => unsubUser();
  }, [uid]);

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
      collection(db, "users", uid, "reminders"),
      (snap) => setLembretes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    return () => {
      unsubGastos();
      unsubReceitas();
      unsubListas();
      unsubLembretes();
    };
  }, [uid]);

  /* 📊 GRÁFICOS */
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

  const chartDia = gastosMes.map((g) => ({
    dia: g.timestamp.toDate().getDate(),
    valor: Number(g.valor),
  }));

  return (
    <div className="bg-slate-100 min-h-screen pt-16 p-0 space-y-5">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-slate-100 flex justify-between items-center py-2">
        <h1 className="text-xl font-bold">
          {getSaudacao()}
          {nomeUsuario ? `, ${nomeUsuario}!` : "!"}
        </h1>

        <select
          className="bg-white rounded-lg px-3 py-1 text-sm shadow"
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
      {/* RECEITAS / GASTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          title="Receitas"
          value={totalReceitas}
          type="receita"
          variacao={variacaoReceitas}
        />

        <SummaryCard
          title="Despesas"
          value={totalGastos}
          type="gasto"
          variacao={variacaoGastos}
        />
      </div>
      {/* SALDO */}
      <SummaryCardSaldo title="Saldo atual" value={saldoAtual} />

      {/* LISTAS / COMPROMISSOS */}
      <div className="grid grid-cols-2 gap-4">
        <InfoCard title="Listas" value={listas.length} />
        <InfoCard title="Compromissos" value={lembretes.length} />
      </div>
      {/* GRÁFICO PIZZA */}
      <Card title="Detalhes por categoria">
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
      {/* GRÁFICO LINHA */}
      <Card title="Gastos por dia">
        {chartDia.length ? (
          <div className="h-48">
            <ResponsiveContainer>
              <LineChart data={chartDia}>
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Line dataKey="valor" stroke="#f91616" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty />
        )}
      </Card>
      {/* ÚLTIMAS TRANSAÇÕES */}
      <UltimasTransacoes gastos={gastosMes} receitas={receitasMes} />
      <ProximosCompromissos lembretes={lembretes} />
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

function SummaryCard({
  title,
  value,
  type = "default", // receita | gasto | saldo
  variacao = null,
}) {
  const styles = {
    receita: {
      bg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      iconBg: "bg-emerald-700",
    },
    gasto: {
      bg: "bg-gradient-to-br from-red-500 to-red-600",
      iconBg: "bg-red-700",
    },
    saldo: {
      bg: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconBg: "bg-blue-700",
    },
  };

  const s = styles[type] || styles.saldo;
  const isUp = variacao > 0;

  return (
    <div
      className={`rounded-2xl p-5 text-white shadow-md flex justify-between items-start ${s.bg}`}
    >
      <div>
        <p className="text-sm opacity-90">{title}</p>

        <p className="text-3xl font-extrabold mt-1">{formatMoney(value)}</p>

        {variacao !== null && (
          <div className="flex items-center gap-1 mt-2 text-sm font-medium">
            {isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>
              {isUp ? "+" : ""}
              {variacao.toFixed(1)}% este mês
            </span>
          </div>
        )}
      </div>

      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.iconBg}`}
      >
        {isUp ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
      </div>
    </div>
  );
}

function SummaryCardSaldo({ title, value }) {
  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg flex justify-between items-center">
      <div>
        <p className="text-sm opacity-90">{title}</p>

        <p className="text-3xl font-bold mt-1">{formatMoney(value)}</p>

        <div className="flex items-center gap-2 text-sm mt-2 opacity-90">
          <Wallet size={16} />
          <span>Saldo disponível</span>
        </div>
      </div>

      <div className="bg-white/20 p-3 rounded-xl">
        <Wallet size={22} />
      </div>
    </div>
  );
}

function InfoCard({ title, value, icon: Icon, color = "blue" }) {
  const colors = {
    blue: {
      bg: "from-blue-500 to-blue-600",
      text: "text-blue-600",
      icon: "text-blue-500",
    },
    green: {
      bg: "from-green-500 to-green-600",
      text: "text-green-600",
      icon: "text-green-500",
    },
    purple: {
      bg: "from-purple-500 to-purple-600",
      text: "text-purple-600",
      icon: "text-purple-500",
    },
    orange: {
      bg: "from-orange-500 to-orange-600",
      text: "text-orange-600",
      icon: "text-orange-500",
    },
  };

  const c = colors[color] || colors.blue;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Faixa decorativa */}
      <div
        className={`absolute top-0 left-0 h-2 w-full bg-gradient-to-r ${c.bg}`}
      />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={`mt-1 text-3xl font-extrabold ${c.text}`}>{value}</p>
        </div>

        {Icon && (
          <div className="rounded-xl bg-slate-100 p-3">
            <Icon className={`h-6 w-6 ${c.icon}`} />
          </div>
        )}
      </div>
    </div>
  );
}

function UltimasTransacoes({ gastos, receitas }) {
  const [filtro, setFiltro] = useState("todas");

  const transacoes = useMemo(() => {
    let lista = [
      ...gastos.map((g) => ({
        tipo: "Despesa",
        texto: g.local || "Despesa",
        valor: g.valor,
        categoria: g.categoria || "Outros",
        data: g.timestamp.toDate(),
      })),
      ...receitas.map((r) => ({
        tipo: "Receita",
        texto: r.descricao || "Receita",
        valor: r.valor,
        categoria: r.origem || "Entrada",
        data: r.createdAt.toDate(),
      })),
    ].sort((a, b) => b.data - a.data);

    // 🔘 filtros normais
    if (filtro === "despesas") {
      return lista.filter((t) => t.tipo === "Despesa").slice(0, 5);
    }

    if (filtro === "receitas") {
      return lista.filter((t) => t.tipo === "Receita").slice(0, 5);
    }

    // 🔥 FRONT-ONLY: evita repetir parcelas no "todas"
    const vistos = new Set();
    const unicos = [];

    for (const t of lista) {
      const chave = `${t.tipo}-${t.texto}-${t.valor}-${t.categoria}`;

      if (!vistos.has(chave)) {
        vistos.add(chave);
        unicos.push(t);
      }
    }

    return unicos.slice(0, 5);
  }, [gastos, receitas, filtro]);

  // 🔤 helper LOCAL — só texto
  const capitalize = (text = "") =>
    text.charAt(0).toUpperCase() + text.slice(1);

  return (
    <Card title="Últimas transações">
      {/* 🔘 FILTROS */}
      <div className="flex gap-2 mb-4">
        <Filtro ativo={filtro === "todas"} onClick={() => setFiltro("todas")}>
          Todas
        </Filtro>
        <Filtro
          ativo={filtro === "despesas"}
          onClick={() => setFiltro("despesas")}
        >
          Despesas
        </Filtro>
        <Filtro
          ativo={filtro === "receitas"}
          onClick={() => setFiltro("receitas")}
        >
          Receitas
        </Filtro>
      </div>

      {/* 📋 LISTA */}
      {transacoes.length === 0 && <Empty />}

      {transacoes.slice(0, 3).map((t, i) => (
        <div
          key={i}
          className="flex justify-between items-start py-3 border-b last:border-0"
        >
          <div>
            {/* ✅ TEXTO CAPITALIZADO */}
            <p className="font-medium">{capitalize(t.texto)}</p>

            <div className="flex gap-2 mt-1 flex-wrap">
              {/* ✅ CATEGORIA CAPITALIZADA */}
              <Tag>{capitalize(t.categoria)}</Tag>

              <Tag color={t.tipo === "Despesa" ? "red" : "green"}>{t.tipo}</Tag>

              <Tag color="gray">
                {t.tipo === "Despesa" ? "Pago" : "Recebido"}
              </Tag>
            </div>
          </div>

          <span
            className={`font-semibold ${
              t.tipo === "Despesa" ? "text-red-600" : "text-green-600"
            }`}
          >
            {formatMoney(t.valor)}
          </span>
        </div>
      ))}
    </Card>
  );
}

function ProximosCompromissos({ lembretes }) {
  const [filtro, setFiltro] = useState("proximos");
  const [dataSelecionada, setDataSelecionada] = useState(null);

  const agora = new Date();

  // 🔒 normaliza para comparar só dia/mês/ano
  function normalizeDay(date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).getTime();
  }

  const compromissosFiltrados = useMemo(() => {
    return lembretes
      .map((l) => {
        // ❌ IGNORA se já foi enviado
        if (l.sent === true) return null;

        const when =
          l.when?.toDate?.() ||
          (typeof l.when === "number" ? new Date(l.when) : null);

        if (!when || isNaN(when.getTime())) return null;

        // ❌ ignora passado
        if (when < agora) return null;

        return {
          id: l.id,
          titulo:
            l.text?.charAt(0).toUpperCase() + l.text?.slice(1) || "Compromisso",
          data: when,
        };
      })
      .filter(Boolean)
      .filter((c) => {
        if (filtro === "hoje") {
          return normalizeDay(c.data) === normalizeDay(agora);
        }

        if (filtro === "semana") {
          const fimSemana = new Date(agora);
          fimSemana.setDate(agora.getDate() + 7);
          return c.data >= agora && c.data <= fimSemana;
        }

        if (filtro === "data" && dataSelecionada) {
          return normalizeDay(c.data) === normalizeDay(dataSelecionada);
        }

        return true; // próximos
      })
      .sort((a, b) => a.data - b.data)
      .slice(0, 5);
  }, [lembretes, filtro, dataSelecionada]);

  return (
    <Card title="Próximos compromissos">
      {/* 🔘 FILTROS */}
      <div className="flex gap-2 mb-4">
        <Filtro
          ativo={filtro === "proximos"}
          onClick={() => setFiltro("proximos")}
        >
          Próximos
        </Filtro>

        <Filtro ativo={filtro === "hoje"} onClick={() => setFiltro("hoje")}>
          Hoje
        </Filtro>

        <Filtro ativo={filtro === "semana"} onClick={() => setFiltro("semana")}>
          Semana
        </Filtro>

        <Filtro ativo={filtro === "data"} onClick={() => setFiltro("data")}>
          <CalendarDays
            size={18}
            className={filtro === "data" ? "text-white" : "text-gray-600"}
          />
        </Filtro>
      </div>

      {/* 📅 CALENDÁRIO */}
      {filtro === "data" && (
        <input
          type="date"
          className="mb-4 w-full rounded-lg border px-3 py-2 text-sm"
          onChange={(e) =>
            setDataSelecionada(new Date(e.target.value + "T00:00:00"))
          }
        />
      )}

      {/* 📋 LISTA */}
      {compromissosFiltrados.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum compromisso futuro</p>
      ) : (
        compromissosFiltrados.map((c) => (
          <div
            key={c.id}
            className="flex justify-between items-center py-3 border-b last:border-0"
          >
            <div>
              <p className="font-medium">{c.titulo}</p>
              <p className="text-xs text-slate-600">
                {c.data.toLocaleString("pt-BR")}
              </p>
            </div>

            <span className="text-xs px-3 py-1 rounded-full bg-green-400 text-black">
              Agendado
            </span>
          </div>
        ))
      )}
    </Card>
  );
}

function Filtro({ ativo, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm transition ${
        ativo ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
      }`}
    >
      {children}
    </button>
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

function gerarMeses(arr) {
  const set = new Set();
  arr.forEach((i) => {
    const d = (i.timestamp || i.createdAt)?.toDate?.();
    if (d) set.add(toMes(d));
  });
  return Array.from(set).sort().reverse();
}

function formatarMes(m) {
  const [y, mo] = m.split("-");
  return `${mo}/${y}`;
}
function parseDatePTBR(text) {
  if (!text || typeof text !== "string") return null;

  const meses = {
    janeiro: 0,
    fevereiro: 1,
    março: 2,
    marco: 2,
    abril: 3,
    maio: 4,
    junho: 5,
    julho: 6,
    agosto: 7,
    setembro: 8,
    outubro: 9,
    novembro: 10,
    dezembro: 11,
  };

  const regex = /(\d{1,2}) de (\w+) de (\d{4}) às (\d{2}):(\d{2})/i;

  const match = text.match(regex);
  if (!match) return null;

  const [, dia, mesTxt, ano, hora, minuto] = match;

  const mes = meses[mesTxt.toLowerCase()];
  if (mes === undefined) return null;

  return new Date(
    Number(ano),
    mes,
    Number(dia),
    Number(hora),
    Number(minuto),
    0,
  );
}

function getSaudacao() {
  const hora = new Date().getHours();

  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function getMesAnterior(mes) {
  const [ano, mesAtual] = mes.split("-").map(Number);

  const data = new Date(ano, mesAtual - 2, 1);
  return toMes(data);
}
