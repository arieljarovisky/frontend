// src/shared/useQuery.js
import { useEffect, useState } from "react";

/**
 * useQuery(fn, deps?)
 * - fn: (signal) => Promise<any>
 * - deps: dependencias para re-ejecutar
 */
export function useQuery(fn, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const ac = new AbortController();
        let mounted = true;

        setLoading(true);
        setError("");

        Promise.resolve()
            .then(() => fn(ac.signal))
            .then((d) => mounted && setData(d))
            .catch((e) => {
                if (ac.signal.aborted) return; // ignorar cancelación
                mounted && setError(e?.message || "Error");
            })
            .finally(() => mounted && setLoading(false));

        return () => {
            mounted = false;
            ac.abort();
        };
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, loading, error };
}
