# M10 S03 — contrato de domínio

`packages/types/src/storage.ts` define protocolo v1, snapshot com uso físico,
policy, revision e operações idempotentes/revalidadas de limpeza, retenção,
reparo e política. A UX mantém o boundary `StoragePreview` substituível.

A ordem de eviction, leases, limites e commit entre volumes está em
[`M10-D09-storage-eviction.md`](../../../decisions/M10-D09-storage-eviction.md).
Bytes estimados nunca são reportados como liberados; paths não atravessam o
renderer.
