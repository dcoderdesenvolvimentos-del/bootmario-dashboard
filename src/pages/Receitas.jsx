import Page from "../components/Page";

export default function Receitas() {
  return (
    <Page title="Receitas">
      <div className="grid grid-cols-2 gap-4">
        <Card title="Total do mês" value="R$ 0,00" color="text-green-600" />
        <Card title="Quantidade" value="0" />
      </div>

      <Empty text="Nenhuma receita registrada ainda" />
    </Page>
  );
}

function Card({ title, value, color }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-xl font-bold ${color || ""}`}>{value}</p>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow text-center text-gray-400">
      {text}
    </div>
  );
}
