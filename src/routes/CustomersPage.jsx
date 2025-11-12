// src/routes/CustomersPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "../shared/useQuery.js";
import { apiClient } from "../api";
import { SearchInput, initials, formatPhone } from "../shared/ui.jsx";
import { useDebouncedValue } from "../shared/useDebouncedValue.js";
import { useApp } from "../context/UseApp.js";

export default function CustomersPage() {
    // 1) Estado local de búsqueda
    const [params, setParams] = useSearchParams();
    const { tenantSlug } = useParams();
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

    const { classesEnabled } = useApp();

    const showMembershipColumn = useMemo(
        () =>
            Array.isArray(rows) &&
            rows.some((row) => row?.has_subscription || row?.subscription_status || row?.has_active_subscription),
        [rows]
    );

    const columnLayout = useMemo(() => {
        const base = {
            customer: 5,
            phone: 4,
            appointments: 3,
            classes: 0,
            membership: 0,
        };

        if (classesEnabled && showMembershipColumn) {
            return {
                customer: 4,
                phone: 3,
                appointments: 2,
                classes: 2,
                membership: 1,
            };
        }

        if (classesEnabled) {
            return {
                customer: 5,
                phone: 3,
                appointments: 2,
                classes: 2,
                membership: 0,
            };
        }

        if (showMembershipColumn) {
            return {
                customer: 5,
                phone: 3,
                appointments: 2,
                classes: 0,
                membership: 2,
            };
        }

        return base;
    }, [classesEnabled, showMembershipColumn]);

    const membershipStyles = {
        authorized: { label: "Activa", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20" },
        pending: { label: "Pendiente", className: "bg-amber-500/10 text-amber-400 border border-amber-400/20" },
        paused: { label: "Pausada", className: "bg-slate-500/10 text-slate-300 border border-slate-400/20" },
        cancelled: { label: "Cancelada", className: "bg-rose-500/10 text-rose-400 border border-rose-400/20" },
        default: { label: "Sin suscripción", className: "bg-foreground/5 text-foreground-secondary border border-border" },
    };

    const renderMembershipPill = (row) => {
        if (!showMembershipColumn) return null;
        if (!row?.has_subscription) {
            const style = membershipStyles.default;
            return (
                <span className={`inline-flex items-center justify-end rounded-full px-3 py-1 text-xs font-medium ${style.className}`}>
                    {style.label}
                </span>
            );
        }
        const statusKey = row?.has_active_subscription ? "authorized" : row?.subscription_status || "default";
        const style = membershipStyles[statusKey] || membershipStyles.default;
        return (
            <span className={`inline-flex items-center justify-end rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style.className}`}>
                {style.label}
            </span>
        );
    };

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
                        <div className="text-xs text-foreground-muted mt-1">Buscando…</div>
                    ) : null}
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="grid grid-cols-12 px-5 py-3 text-xs font-medium text-foreground-secondary border-b border-border bg-background-secondary">
                    <div className={`col-span-${columnLayout.customer}`}>Cliente</div>
                    <div className={`col-span-${columnLayout.phone}`}>Teléfono</div>
                    <div className={`col-span-${columnLayout.appointments} text-right`}>Turnos</div>
                    {classesEnabled ? (
                        <div className={`col-span-${columnLayout.classes} text-right`}>
                            <div># Clases</div>
                            <div className="text-[10px] text-foreground-muted uppercase tracking-wide">Anotadas / Realizadas</div>
                        </div>
                    ) : null}
                    {showMembershipColumn ? (
                        <div className={`col-span-${columnLayout.membership} text-right`}>Membresía</div>
                    ) : null}
                </div>

                {loading ? (
                    <div className="px-5 py-6 text-sm text-foreground-muted">Cargando…</div>
                ) : error ? (
                    <div className="px-5 py-6 text-sm text-red-600">{error}</div>
                ) : rows.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-foreground-muted">Sin resultados.</div>
                ) : (
                    <div className="divide-y divide-border">
                        {rows.map((r) => (
                            <Link
                                key={r.id}
                                to={`/${tenantSlug}/customers/${r.id}`}
                                className="w-full text-left px-5 py-3 hover:bg-background-secondary grid grid-cols-12 items-center transition-colors"
                            >
                                <div className={`col-span-${columnLayout.customer} flex items-center gap-3`}>
                                    <div className="size-9 rounded-full bg-background-secondary flex items-center justify-center text-foreground-secondary text-sm">
                                        {initials(r.name || "?")}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-foreground">{r.name || "(Sin nombre)"}</div>
                                        <div className="text-xs text-foreground-muted">ID #{r.id}</div>
                                    </div>
                                </div>
                                <div className={`col-span-${columnLayout.phone} text-sm text-foreground-secondary`}>
                                    {formatPhone(r.phone_e164 ?? r.phone)}
                                </div>
                                <div className={`col-span-${columnLayout.appointments} text-right text-sm font-semibold`}>
                                    {r.total_appointments ?? r.appointments_count ?? 0}
                                </div>
                                {classesEnabled ? (
                                    <div className={`col-span-${columnLayout.classes} text-right`}>
                                        <div className="text-sm font-semibold">
                                            {r.upcoming_classes ?? 0}{" "}
                                            <span className="text-xs text-foreground-muted font-normal uppercase tracking-wide">
                                                anotadas
                                            </span>
                                        </div>
                                        <div className="text-xs text-foreground-secondary">
                                            {r.completed_classes ?? 0} realizadas
                                        </div>
                                    </div>
                                ) : null}
                                {showMembershipColumn ? (
                                    <div className={`col-span-${columnLayout.membership} text-right`}>
                                        {renderMembershipPill(r)}
                                    </div>
                                ) : null}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
