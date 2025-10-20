import { useEffect, useState } from "react";
import { getStylists, getServices, getAvailability, createAppointment } from "../api";

export default function NewAppointment({ onCreated }) {
    const [stylists, setStylists] = useState([]);
    const [services, setServices] = useState([]);
    const [form, setForm] = useState({
        customerPhone: "",
        customerName: "",
        stylistId: "",
        serviceId: "",
        date: "",
        startsAt: ""
    });
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotsError, setSlotsError] = useState("");

    useEffect(() => {
        getStylists().then(setStylists);
        getServices().then(setServices);
    }, []);

    // Carga automática de slots cuando cambian los 3 campos clave
    useEffect(() => {
        // no busques si falta algún campo
        if (!form.stylistId || !form.serviceId || !form.date) {
            setSlots([]);
            setSlotsError("");
            setLoadingSlots(false);
            return;
        }

        const ac = new AbortController();    // ← para cancelar la request anterior
        setLoadingSlots(true);
        setSlotsError("");
        setSlots([]);

        (async () => {
            try {
                const data = await getAvailability(
                    Number(form.stylistId),
                    Number(form.serviceId),
                    form.date,
                    ac.signal
                );
                setSlots(Array.isArray(data?.slots) ? data.slots : []);
            } catch (e) {
                if (e.name !== "CanceledError" && e.name !== "AbortError") {
                    setSlotsError(e?.response?.data?.error || e.message);
                }
            } finally {
                setLoadingSlots(false);
            }
        })();

        // cleanup: cancela la request si cambian los deps o desmonta el componente
        return () => ac.abort();
    }, [form.stylistId, form.serviceId, form.date]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value, ...(name !== "startsAt" ? { startsAt: "" } : {}) }));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.startsAt) return alert("Elegí un horario disponible");
        try {
            const res = await createAppointment({
                customerPhone: form.customerPhone.trim(),
                customerName: form.customerName.trim() || undefined,
                stylistId: Number(form.stylistId),
                serviceId: Number(form.serviceId),
                startsAt: form.startsAt // ISO que viene del backend (UTC)
            });
            if (res.ok) {
                alert("Turno creado ✅");
                onCreated?.();
                setForm(prev => ({ ...prev, startsAt: "" }));
            } else {
                alert(res.error || "Error creando turno");
            }
        } catch (err) {
            alert(err?.response?.data?.error || err.message);
        }
    };

    return (
        <form onSubmit={handleCreate} className="space-y-3 p-4 border rounded-lg">
            <h3 style={{ fontWeight: 600 }}>Nuevo Turno</h3>

            <div>
                <label>Teléfono (E.164):</label><br />
                <input name="customerPhone" value={form.customerPhone} onChange={handleChange} placeholder="+54911..." />
            </div>

            <div>
                <label>Nombre (opcional):</label><br />
                <input name="customerName" value={form.customerName} onChange={handleChange} placeholder="Ariel" />
            </div>

            <div>
                <label>Servicio:</label><br />
                <select name="serviceId" value={form.serviceId} onChange={handleChange}>
                    <option value="">-- elegir --</option>
                    {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.duration_min} min)</option>
                    ))}
                </select>
            </div>

            <div>
                <label>Peluquero:</label><br />
                <select name="stylistId" value={form.stylistId} onChange={handleChange}>
                    <option value="">-- elegir --</option>
                    {stylists.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label>Fecha:</label><br />
                <input type="date" name="date" value={form.date} onChange={handleChange} />
            </div>

            <div>
                <label>Horario:</label><br />
                {loadingSlots && <div>Cargando horarios...</div>}
                {slotsError && <div style={{ color: "crimson" }}>{slotsError}</div>}
                {!loadingSlots && !slotsError && (
                    <select
                        name="startsAt"
                        value={form.startsAt}
                        onChange={handleChange}
                        disabled={slots.length === 0}
                    >
                        <option value="">{slots.length ? "-- elegir --" : "Sin disponibilidad"}</option>
                        {slots.map(iso => {
                            const d = new Date(iso);
                            const hh = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                            return <option key={iso} value={iso}>{hh}</option>;
                        })}
                    </select>
                )}
            </div>

            <button type="submit" disabled={!form.startsAt}>Crear Turno</button>
        </form>
    );
}
