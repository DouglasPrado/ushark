# Checkpoint funcional — M01

Status: READY_FOR_REVIEW. Aprovação humana: PENDING.

S05 foi implementada e validada localmente em Electron macOS: configuração e biblioteca vazia persistem em SQLite, o onboarding não reaparece após fechar/reabrir, nome/cache/preferência e pasta escolhida sobrevivem ao restart, reset é seletivo e falhas preservam o snapshot anterior. Navegador continua usando o adapter mockado.

O usuário autorizou explicitamente “execute M01 S03–S08”. Essa autorização permite continuar S06–S08 sem uma parada intermediária, mas não equivale a aprovação funcional nem comprova Windows/TV/controle físicos.

Depois de S05: Criar biblioteca vazia, salvar preferências, fechar/reabrir offline, alterar configuração e restaurar defaults; testar pasta inválida/falha de gravação preservando estado anterior e navegação.

Registrar demonstração, ambiente, evidências, feedback e aprovação explícita. A aprovação do mapa não aprova este checkpoint.

Evidências: [contrato](evidence/CONFIGURATION_CONTRACT.md), `tests/configuration-store.spec.ts`, `tests/configuration-ipc.spec.ts`, `tests/desktop.electron.spec.ts` e [S05](stories/S05-integration.md).
