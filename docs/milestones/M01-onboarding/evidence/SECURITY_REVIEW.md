# Revisão de segurança e hardening — M01/S07

Data: 2026-09-14. Escopo: shell Electron, preload, IPC/configuração, persistência e ciclo onboarding/settings/Home.

## Resultado local

- Renderer: `sandbox=true`, `contextIsolation=true`, `nodeIntegration=false`, `webSecurity=true`; DevTools não abre no modo de release testado.
- Navegação: `window.open` negado, `will-navigate` e `webview` bloqueados, permissões negadas por default.
- CSP: `default-src 'self'`, scripts locais, `object-src 'none'`, `base-uri 'none'` e `form-action 'none'`; nenhum request externo foi observado no render/onboarding offline do Electron empacotado localmente.
- Preload: expõe somente `configuration.read`, `save`, `resetPlayback` e `chooseDirectory`, todos no protocolo v1; não expõe Node, `fs`, SQL, shell ou `ipcRenderer` genérico.
- IPC: allowlist fixa, chamadas somente do `webContents`/frame principal da janela, protocolo e payload validados, opções desconhecidas rejeitadas e erros sem stack/SQL.
- Persistência: queries preparadas, schema/migration v1, versão futura rejeitada sem overwrite, payload canonicalizado, biblioteca/cache absolutas e não sobrepostas, raiz rejeitada, write probe e rollback. Arquivos SQLite/WAL/SHM recebem modo `0600` em POSIX.
- Recovery: diretório inválido e falha de escrita não substituem o snapshot anterior; configuração malformada volta a defaults com aviso, enquanto schema futuro falha fechado.
- UX: foco/modal/retorno, controle remoto/gamepad sintético, offline, layouts e budget local foram revalidados sem mudança visual arbitrária.

Validação após os ajustes: typecheck, lint afetado, build e 27/27 testes M01 passaram. O aviso de chunk do Vite permanece dívida conhecida e não é causado por esta integração.

## Limites e riscos residuais

- Windows x64, TV, controle físico, hotplug real, overscan, legibilidade à distância e Sunshine/Moonlight continuam sem evidência física.
- O checkpoint funcional humano continua PENDING; autorização de execução até S08 não é aceite funcional.
- O banco SQLite de M01 guarda somente configuração/biblioteca vazia. Backup/restore completo, catálogo, providers, MPV, torrentd e demais domínios permanecem em seus milestones.
- CI/PR review/merge não foram executados nesta story. O checkout possui alterações de catálogo/evidências anteriores e independentes, preservadas sem reescrita.
