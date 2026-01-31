export default function Section({ title, children }) {
  return (
    <section className="bg-white rounded-xl shadow-sm p-4 space-y-3">
      <h2 className="text-sm font-semibold text-blue-700">{title}</h2>
      {children}
    </section>
  );
}
