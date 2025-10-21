export default function StylistSelect({ stylists, value, onChange }) {
    
    return (
        <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10">
            <option value="" disabled>Elegí peluquero/a</option>
            {stylists.map((st) => (<option key={st.id} value={st.id}>{st.name}</option>))}
        </select>
    );
}