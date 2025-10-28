import React from "react";
 import { apiClient } from "../api";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "../shared/useQuery.js";
import { formatPhone, initials, formatDateTime, StatusPill} from "../shared/ui.jsx";

export default function CustomerDetailPage() {
    const { id } = useParams();
    const { data, loading, error } = useQuery((signal) => apiClient.customerDetail(id, signal), [id]);


    if (loading) return <p className="text-sm text-gray-500">Cargando…</p>;
    if (error) return <p className="text-sm text-red-600">{error}</p>;
    if (!data) return <p className="text-sm text-gray-500">No encontrado.</p>;


    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-base">
                        {initials(data.name || "?")}
                    </div>
                    <div>
                        <div className="text-lg font-semibold">{data.name || "(Sin nombre)"}</div>
                        <div className="text-sm text-gray-600">{formatPhone(data.phone)}</div>
                    </div>
                </div>
                <Link to="/customers" className="text-sm text-gray-600 hover:text-gray-900">← Volver</Link>
            </div>


            <div>
                <div className="text-sm font-medium mb-2">Historial de turnos</div>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                        <div className="col-span-4">Fecha</div>
                        <div className="col-span-3">Estado</div>
                        <div className="col-span-5">Servicio / Peluquero</div>
                    </div>
                    {Array.isArray(data.appointments) && data.appointments.length > 0 ? (
                        <div className="divide-y">
                            {data.appointments.map((a) => (
                                <div key={a.id} className="grid grid-cols-12 px-4 py-2 text-sm">
                                    <div className="col-span-4">{formatDateTime(a.starts_at)}</div>
                                    <div className="col-span-3"><StatusPill status={a.status} /></div>
                                    <div className="col-span-5 text-gray-700">{a.service} · <span className="text-gray-500">{a.stylist}</span></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 py-6 text-sm text-gray-500">Sin turnos todavía.</div>
                    )}
                </div>
            </div>
        </div>
    );
}