export default function Profile() {
  return (
    <div className="space-y-6">
      <h2 className="app-title">Perfil</h2>

      <div className="app-card space-y-4">
        <div>
          <label className="app-subtitle">Nome</label>
          <input className="app-input mt-1" placeholder="Seu nome" />
        </div>

        <button className="app-button w-full">Salvar</button>
      </div>
    </div>
  );
}
