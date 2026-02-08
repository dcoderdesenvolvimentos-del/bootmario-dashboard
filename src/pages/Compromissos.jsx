import Page from "../components/Page";

export default function Listas() {
  return (
    <Page title="Listas">
      <Empty text="Nenhuma lista criada ainda" />
    </Page>
  );
}

function Empty({ text }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow text-center text-gray-400">
      {text}
    </div>
  );
}
