export default function Page({ title, children }) {
  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-white z-10 px-4 py-3 border-b">
        <h1 className="text-lg font-semibold">{title}</h1>
      </header>

      <main className="p-2 space-y-4">{children}</main>
    </div>
  );
}
