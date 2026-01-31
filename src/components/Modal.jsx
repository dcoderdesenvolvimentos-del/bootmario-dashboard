export default function Modal({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-xl p-4">
        {children}

        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-red-500"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
