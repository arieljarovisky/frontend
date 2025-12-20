import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../../api/client";
import { toast } from "sonner";
import { Megaphone, Target, Send, Eye } from "lucide-react";

export default function CRMPage() {
  const { tenantSlug } = useParams();
  const [segments, setSegments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loadingSegs, setLoadingSegs] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [message, setMessage] = useState("Hola {nombre}, te esperamos esta semana. ¿Querés reservar un turno?");
  const [preview, setPreview] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingSegs(true);
      try {
        const data = await apiClient.crmListSegments();
        setSegments(data || []);
      } catch (e) {
        toast.error("Error cargando segmentos");
      } finally {
        setLoadingSegs(false);
      }
    };
    load();
  }, []);

  async function loadRecipients(code) {
    setLoadingList(true);
    try {
      const result = await apiClient.crmGetSegment(code);
      setRecipients(result?.data || []);
    } catch (e) {
      toast.error("Error cargando clientes del segmento");
    } finally {
      setLoadingList(false);
    }
  }

  async function doPreview() {
    if (!selected) return;
    try {
      const resp = await apiClient.crmSendCampaign({
        segmentCode: selected.code,
        message,
        preview: true,
        max: 5,
      });
      setPreview(resp?.preview || []);
      toast.success(`Vista previa generada (${resp?.totalCandidates || 0} candidatos)`);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Error generando vista previa");
    }
  }

  async function doSend() {
    if (!selected) return;
    setSending(true);
    try {
      const resp = await apiClient.crmSendCampaign({
        segmentCode: selected.code,
        message,
        preview: false,
        max: 50,
      });
      toast.success(`Campaña enviada: ${resp?.sent || 0} de ${resp?.total || 0}`);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Error enviando campaña");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Megaphone className="w-6 h-6" />
          CRM
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card card--space-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-header flex items-center gap-2">
                <Target className="w-5 h-5" />
                Segmentos
              </h2>
            </div>
            {loadingSegs ? (
              <div className="text-foreground-muted">Cargando segmentos…</div>
            ) : (
              <div className="space-y-2">
                {segments.map((seg) => (
                  <button
                    key={seg.code}
                    onClick={() => {
                      setSelected(seg);
                      loadRecipients(seg.code);
                      setPreview([]);
                    }}
                    className={`w-full text-left p-3 rounded-lg border ${selected?.code === seg.code ? "border-primary-500 bg-primary-500/5" : "border-border hover:bg-background-secondary"}`}
                  >
                    <div className="font-semibold">{seg.label}</div>
                    <div className="text-sm text-foreground-muted">{seg.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card card--space-lg">
            <h2 className="section-header">Destinatarios</h2>
            {loadingList ? (
              <div className="text-foreground-muted">Cargando clientes…</div>
            ) : recipients.length === 0 ? (
              <div className="text-foreground-muted">Seleccione un segmento para ver los clientes.</div>
            ) : (
              <div className="divide-y divide-border">
                {recipients.slice(0, 50).map((r) => (
                  <div key={r.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.name || "Sin nombre"}</div>
                      <div className="text-xs text-foreground-muted">{r.phone}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card card--space-lg">
            <h2 className="section-header">Campaña</h2>
            <div className="space-y-3">
              <label className="text-sm text-foreground-secondary">Mensaje</label>
              <textarea
                className="input"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Usa {nombre} para personalizar el mensaje"
              />
              <div className="flex items-center gap-2">
                <button onClick={doPreview} className="btn-ghost">
                  <Eye className="w-4 h-4" />
                  Vista previa
                </button>
                <button onClick={doSend} disabled={!selected || sending} className="btn-primary">
                  <Send className="w-4 h-4" />
                  Enviar campaña
                </button>
              </div>
            </div>
          </div>

          {preview.length > 0 && (
            <div className="card card--space-lg">
              <h2 className="section-header">Vista previa</h2>
              <div className="space-y-2">
                {preview.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border">
                    <div className="text-xs text-foreground-muted">{p.to}</div>
                    <div className="font-medium">{p.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
