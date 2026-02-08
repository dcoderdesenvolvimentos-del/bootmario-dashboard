import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { CalendarDays, CheckCircle } from "lucide-react";
import Page from "../components/Page";
import { db } from "@/firebase";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = {
  proximo: "#6366f1",
  hoje: "#f97316",
  concluido: "#22c55e",
};

/* ================= RECORRÊNCIA ================= */

// 🔁 gera ocorrências VIRTUAIS (não salva no Firestore)
function gerarOcorrencias(base, diasFuturos = 60) {
  if (!base.recurrence) {
    return [{ ...base, data: base.when }];
  }

  const ocorrencias = [];
  let atual = new Date(base.when);
  const limite = new Date();
  limite.setDate(limite.getDate() + diasFuturos);

  while (atual <= limite) {
    ocorrencias.push({
      ...base,
      data: new Date(atual),
      origemId: base.id,
    });

    if (base.recurrence === "daily") atual.setDate(atual.getDate() + 1);
    if (base.recurrence === "weekly") atual.setDate(atual.getDate() + 7);
    if (base.recurrence === "monthly") atual.setMonth(atual.getMonth() + 1);
    if (base.recurrence === "yearly")
      atual.setFullYear(atual.getFullYear() + 1);
  }

  return ocorrencias;
}

export default function Compromissos() {
  const uid = localStorage.getItem("uid");

  const [lembretes, setLembretes] = useState([]);
  const [filtro, setFiltro] = useState("proximos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  /* 🔄 TEMPO REAL */
  useEffect(() => {
    if (!uid) return;

    return onSnapshot(collection(db, "users", uid, "reminders"), (snap) =>
      setLembretes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  }, [uid]);

  const agora = new Date();

  function isHoje(d) {
    const n = new Date();
    return (
      d.getDate() === n.getDate() &&
      d.getMonth() === n.getMonth() &&
      d.getFullYear() === n.getFullYear()
    );
  }

  /* ================= LISTA BASE (COM RECORRÊNCIA) ================= */
  const listaBase = useMemo(() => {
    const lista = [];

    lembretes.forEach((l) => {
      const when =
        l.when?.toDate?.() ||
        (typeof l.when === "number" ? new Date(l.when) : null);

      if (!when) return;

      const base = {
        ...l,
        when,
      };

      const ocorrencias = gerarOcorrencias(base);

      ocorrencias.forEach((o) => {
        let status = "proximo";
        if (o.data < agora) status = "concluido";
        else if (isHoje(o.data)) status = "hoje";

        lista.push({
          ...o,
          status,
        });
      });
    });

    return lista.sort((a, b) => a.data - b.data);
  }, [lembretes]);

  /* ================= LISTA FILTRADA (TELA) ================= */
  const compromissosFiltrados = useMemo(() => {
    return listaBase.filter((c) => {
      if (filtro === "hoje") return c.status === "hoje";
      if (filtro === "concluidos") return c.status === "concluido";
      return c.status === "proximo" || c.status === "hoje";
    });
  }, [listaBase, filtro]);

  /* ================= KPIs ================= */
  const totalHoje = listaBase.filter((c) => c.status === "hoje").length;
  const totalProximos = listaBase.filter((c) => c.status === "proximo").length;
  const totalConcluidos = listaBase.filter(
    (c) => c.status === "concluido",
  ).length;

  /* ================= GRÁFICO ================= */
  const graficoStatus = [
    { name: "Próximos", value: totalProximos, key: "proximo" },
    { name: "Hoje", value: totalHoje, key: "hoje" },
    { name: "Concluídos", value: totalConcluidos, key: "concluido" },
  ].filter((i) => i.value > 0);

  return (
    <Page title="Compromissos">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Kpi title="Próximos" value={totalProximos} color="proximo" />
        <Kpi title="Hoje" value={totalHoje} color="hoje" />
        <Kpi title="Concluídos" value={totalConcluidos} color="concluido" />
      </div>

      {/* FILTROS */}
      <div className="flex gap-2">
        <Filtro
          ativo={filtro === "proximos"}
          onClick={() => setFiltro("proximos")}
        >
          Próximos
        </Filtro>
        <Filtro ativo={filtro === "hoje"} onClick={() => setFiltro("hoje")}>
          Hoje
        </Filtro>
        <Filtro
          ativo={filtro === "concluidos"}
          onClick={() => setFiltro("concluidos")}
        >
          Concluídos
        </Filtro>
      </div>

      {/* GRÁFICO */}
      <Card title="Visão geral">
        {graficoStatus.length ? (
          <div className="h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={graficoStatus} dataKey="value" nameKey="name">
                  {graficoStatus.map((s) => (
                    <Cell key={s.key} fill={COLORS[s.key]} />
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

      {/* LISTA */}
      {compromissosFiltrados.length === 0 && <Empty />}

      {compromissosFiltrados.map((c) => (
        <div
          key={`${c.id}-${c.data.toISOString()}`}
          className="bg-white rounded-xl p-4 shadow border-l-4"
          style={{ borderColor: COLORS[c.status] }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">
                {capitalize(c.text || "Compromisso")}
              </p>

              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <CalendarDays size={14} />
                {c.data.toLocaleString("pt-BR")}
              </div>

              {c.recurrence && (
                <span className="mt-1 inline-block text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600">
                  Recorrente
                </span>
              )}
            </div>

            <span
              className="text-xs px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: COLORS[c.status] }}
            >
              {c.status}
            </span>
          </div>

          {c.status === "concluido" && (
            <div className="flex items-center gap-1 text-green-600 text-xs mt-2">
              <CheckCircle size={14} />
              Finalizado
            </div>
          )}

          <div className="flex gap-3 mt-3 text-sm">
            <button onClick={() => setEditando(c)} className="text-indigo-600">
              Editar
            </button>
            <button onClick={() => excluir(uid, c.id)} className="text-red-600">
              Excluir
            </button>
          </div>
        </div>
      ))}

      {/* FAB */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full
        bg-gradient-to-br from-indigo-500 to-violet-500
        text-white text-2xl shadow-lg"
      >
        +
      </button>

      {(modalOpen || editando) && (
        <CompromissoModal
          uid={uid}
          compromisso={editando}
          onClose={() => {
            setModalOpen(false);
            setEditando(null);
          }}
        />
      )}
    </Page>
  );
}

/* ================= COMPONENTES ================= */

function Kpi({ title, value, color }) {
  return (
    <div
      className="rounded-xl p-4 text-white shadow"
      style={{ backgroundColor: COLORS[color] }}
    >
      <p className="text-xs opacity-90">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Filtro({ ativo, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm transition ${
        ativo ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-600"
      }`}
    >
      {children}
    </button>
  );
}

function Empty() {
  return <p className="text-sm text-gray-400">Nenhum compromisso</p>;
}

/* ================= MODAL ================= */

function CompromissoModal({ uid, compromisso, onClose }) {
  const [text, setText] = useState(compromisso?.text || "");
  const [when, setWhen] = useState(
    compromisso?.when
      ? compromisso.when.toDate().toISOString().slice(0, 16)
      : "",
  );

  async function salvar() {
    const data = {
      text,
      when: Timestamp.fromDate(new Date(when)),
      recurrence: compromisso?.recurrence || null,
    };

    if (compromisso) {
      await updateDoc(doc(db, "users", uid, "reminders", compromisso.id), data);
    } else {
      await addDoc(collection(db, "users", uid, "reminders"), data);
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-4 w-80 space-y-3">
        <h2 className="font-bold">
          {compromisso ? "Editar compromisso" : "Novo compromisso"}
        </h2>

        <input
          placeholder="Descrição"
          className="w-full border rounded px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <input
          type="datetime-local"
          className="w-full border rounded px-3 py-2"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border rounded p-2">
            Cancelar
          </button>
          <button
            onClick={salvar}
            className="flex-1 bg-indigo-600 text-white rounded p-2"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */

function capitalize(t = "") {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

async function excluir(uid, id) {
  if (!confirm("Excluir compromisso?")) return;
  await deleteDoc(doc(db, "users", uid, "reminders", id));
}
