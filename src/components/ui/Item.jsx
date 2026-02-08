function Item({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center text-xs transition-colors ${
        active ? "text-blue-600" : "text-gray-500"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
