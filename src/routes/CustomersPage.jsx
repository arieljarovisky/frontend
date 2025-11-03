// src/routes/CustomersPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "../shared/useQuery.js";
import { apiClient } from "../api";
import { SearchInput, initials, formatPhone } from "../shared/ui.jsx";
import { useDebouncedValue } from "../shared/useDebouncedValue.js";

export default function CustomersPage() {
    // 1) Estado local de búsqueda
    const [params, setParams] = useSearchParams();
    const initialQ = params.get("q") || "";
    const [q, setQ] = useState(initialQ);

    // 2) Si cambia la URL (ej: atrás/adelante), actualizo el input
    useEffect(() => {
        const urlQ = params.get("q") || "";
        setQ(urlQ);
    }, [params]);

    // 3) Debounce
    const qDebounced = useDebouncedValue(q, 300);

    // 4) Fetch dinámico (se cancela si el usuario sigue tecleando)
    const { data: rows = [], loading, error } =
        useQuery((signal) => apiClient.listCustomers(qDebounced, signal), [qDebounced]);

    // 5) Actualizo la URL cuando se envía el form (Enter o botón Buscar)
    function submitSearch(v) {
        const next = new URLSearchParams(params);
        if (v) next.set("q", v);
        else next.delete("q");
        setParams(next, { replace: true }); // no rompe el historial
    }

    return (
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-3">
                <div className="w-full flex flex-col gap-0">
                    <SearchInput
                        value={q}
                        onChange={setQ}
                        onSubmit={submitSearch}
                        placeholder="Buscar por nombre o teléfono…"
                        width="100%"
                    />
                    {loading && qDebounced ? (
                        <div className="text-xs text-gray-500 mt-1">Buscando…</div>
                    ) : null}
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-dark">
                <div className="grid grid-cols-12 px-5 py-3 text-xs font-medium text-white-500 border-b bg-dark-200">
                    <div className="col-span-5">Cliente</div>
                    <div className="col-span-4">Teléfono</div>
                    <div className="col-span-3 text-right"># Turnos</div>
                </div>

                {loading ? (
                    <div className="px-5 py-6 text-sm text-gray-500">Cargando…</div>
                ) : error ? (
                    <div className="px-5 py-6 text-sm text-red-600">{error}</div>
                ) : rows.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-gray-500">Sin resultados.</div>
                ) : (
                    <div className="divide-y">
                        {rows.map((r) => (
                            <Link
                                key={r.id}
                                to={`/customers/${r.id}`}
                                className="w-full text-left px-5 py-3 hover:bg-gray-800 grid grid-cols-12 items-center"
                            >
                                <div className="col-span-5 flex items-center gap-3">
                                    <div className="size-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                                        {initials(r.name || "?")}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">{r.name || "(Sin nombre)"}</div>
                                        <div className="text-xs text-gray-500">ID #{r.id}</div>
                                    </div>
                                </div>
                                <div className="col-span-4 text-sm text-white-700">
                                    {formatPhone(r.phone_e164 ?? r.phone)}
                                </div>
                                <div className="col-span-3 text-right text-sm font-semibold">
                                    {r.total_appointments ?? r.appointments_count ?? 0}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
