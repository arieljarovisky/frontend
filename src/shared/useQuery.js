// src/shared/useQuery.js
import { useEffect, useState, useCallback, useRef } from "react";

/**
 * useQuery(fn, deps?)
 * - fn: (signal) => Promise<any>
 * - deps: dependencias para re-ejecutar
 */
export function useQuery(fn, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const fnRef = useRef(fn);
    const mountedRef = useRef(true);
    const abortControllerRef = useRef(null);
    const isExecutingRef = useRef(false);

    // Actualizar ref cuando cambia la función
    useEffect(() => {
        fnRef.current = fn;
    }, [fn]);

    const executeQuery = useCallback(async (signal, skipLoading = false) => {
        // Evitar ejecuciones duplicadas
        if (isExecutingRef.current && !skipLoading) {
            return;
        }
        
        isExecutingRef.current = true;
        
        if (!skipLoading) {
            setLoading(true);
        }
        setError("");

        try {
            const result = await fnRef.current(signal);
            if (mountedRef.current && !signal.aborted) {
                setData(result);
            }
        } catch (e) {
            if (signal.aborted || !mountedRef.current) {
                isExecutingRef.current = false;
                return;
            }
            setError(e?.message || "Error");
        } finally {
            if (mountedRef.current && !signal.aborted) {
                setLoading(false);
            }
            isExecutingRef.current = false;
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        
        // Cancelar petición anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        const ac = new AbortController();
        abortControllerRef.current = ac;
        
        executeQuery(ac.signal);

        return () => {
            mountedRef.current = false;
            if (abortControllerRef.current === ac) {
                ac.abort();
                abortControllerRef.current = null;
            }
            isExecutingRef.current = false;
        };
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps

    const refetch = useCallback(() => {
        // Cancelar petición anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        const ac = new AbortController();
        abortControllerRef.current = ac;
        executeQuery(ac.signal, false);
        return () => ac.abort();
    }, [executeQuery]);

    return { data, loading, error, refetch };
}
