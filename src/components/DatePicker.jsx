export default function DatePicker({ value, onChange }) {
    return (
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10" />
    );
}