# M18 S04–S05 — integração

Electron inicia fullscreen em `--tv`, mantém shell consumer-only, observa
gamepads do browser e coordena o shutdown dos serviços MPV/stream com timeout.
Reconexão sem sinal TV é bloqueada. 2/2 casos IPC passaram e typecheck passou.

Limite obrigatório: este host macOS não comprova captura Sunshine, Moonlight,
áudio/vídeo, encode, foco Windows, hotplug nem controle físico. Esses itens
permanecem no checkpoint humano/físico e M18 não está DONE.
