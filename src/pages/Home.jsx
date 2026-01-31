export default function Home() {
  return (
    <div className="space-y-6">
      <h2 className="app-title">Resumo</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="app-card">
          <p className="app-subtitle">Receitas</p>
          <p className="text-2xl font-bold">R$ 0,00</p>
        </div>

        <div className="app-card">
          <p className="app-subtitle">Gastos</p>
          <p className="text-2xl font-bold">R$ 0,00</p>
        </div>
      </div>
    </div>
  );
}
