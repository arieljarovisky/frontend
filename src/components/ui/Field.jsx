export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-sm font-medium">{label}</div>}
      {children}
      <div className="min-h-[1.25rem] mt-1 text-xs">
        {error ? <span className="text-red-600">{error}</span> : hint ? <span className="text-gray-500">{hint}</span> : null}
      </div>
    </label>
  );
}