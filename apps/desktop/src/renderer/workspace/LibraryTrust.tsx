import { useEffect, useRef, useState } from "react";
import { Button } from "@ushark/ui";
import type {
  LibraryTrustPreview,
  TrustScenario,
  TrustResult,
} from "@ushark/types/library-trust";
import type { LibraryPackageSnapshot } from "@ushark/types/library-package";
export function LibraryTrust({
  snapshot,
  service,
  onAllowed,
}: {
  snapshot: LibraryPackageSnapshot;
  service: LibraryTrustPreview;
  onAllowed: (allowed: boolean) => void;
}) {
  const [scenario, setScenario] = useState<TrustScenario>("package"),
    [result, setResult] = useState<TrustResult | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0),
    [consent, setConsent] = useState(false);
  const controller = useRef<AbortController | null>(null),
    callback = useRef(onAllowed);
  callback.current = onAllowed;
  useEffect(() => {
    const c = new AbortController();
    controller.current = c;
    setBusy(true);
    setResult(null);
    setError("");
    setConsent(false);
    callback.current(false);
    service
      .verify(snapshot, scenario, c.signal)
      .then((r) => {
        if (!c.signal.aborted) {
          setResult(r);
          setBusy(false);
          callback.current(r.status === "unsigned" || r.status === "known");
        }
      })
      .catch((e: Error) => {
        if (!c.signal.aborted) {
          setError(e.message);
          setBusy(false);
        }
      });
    return () => {
      c.abort();
      callback.current(false);
    };
  }, [snapshot, service, scenario, retry]);
  async function accept() {
    if (busy || !result) return;
    const c = new AbortController();
    controller.current = c;
    setBusy(true);
    setError("");
    try {
      await service.accept(snapshot.draft.id, result.key, scenario, c.signal);
      if (!c.signal.aborted) {
        setResult({
          ...result,
          status: "known",
          message: "Identidade aceita nesta sessão (simulação).",
        });
        callback.current(true);
      }
    } catch (e) {
      if (!c.signal.aborted) setError((e as Error).message);
    } finally {
      if (!c.signal.aborted) setBusy(false);
    }
  }
  return (
    <section className="trust-panel">
      <h3>Autoria e confiança</h3>
      <p>
        Simulação: autenticidade não comprova direitos sobre a mídia. Nenhuma
        chave privada é criada.
      </p>
      {busy && <p role="status">Verificando autoria…</p>}
      {result && (
        <>
          <p
            role={
              ["invalid", "hash", "changed"].includes(result.status)
                ? "alert"
                : "status"
            }
          >
            {result.message}
          </p>
          {result.key && <p>Chave pública demonstrativa: {result.key}</p>}
          {result.status === "changed" && (
            <>
              <p>Chave anterior: {result.previous}</p>
              <label>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                Conferi a mudança de identidade
              </label>
            </>
          )}
          {["first", "changed"].includes(result.status) && (
            <Button
              disabled={busy || (result.status === "changed" && !consent)}
              onClick={() => void accept()}
            >
              {result.status === "changed"
                ? "Aceitar nova identidade"
                : "Aceitar identidade nesta sessão"}
            </Button>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
      {error && (
        <Button variant="secondary" onClick={() => setRetry((r) => r + 1)}>
          Tentar verificar novamente
        </Button>
      )}
      {busy && (
        <Button
          variant="secondary"
          onClick={() => {
            controller.current?.abort();
            setBusy(false);
            setError("Verificação cancelada. Nenhuma identidade aceita.");
          }}
        >
          Cancelar verificação
        </Button>
      )}
      <details>
        <summary>Cenários de autoria</summary>
        <label>
          Estado da autoria
          <select
            value={scenario}
            disabled={busy}
            onChange={(e) => {
              callback.current(false);
              setScenario(e.target.value as TrustScenario);
            }}
          >
            {Object.entries({
              package: "Do pacote",
              valid: "Assinatura válida",
              invalid: "Assinatura inválida",
              hash: "Hash divergente",
              changed: "Chave alterada",
              storage: "Storage indisponível",
              error: "Erro de verificação",
              offline: "Offline",
            }).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </details>
    </section>
  );
}
