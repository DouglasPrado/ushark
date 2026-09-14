# Validação M18

Typecheck/lint/build PASS. Playwright 5 comportamentais PASS: entrada direta em modo TV, restrição de gestão em Filmes, pausa/reconnect, falha/cancel/retry/fullscreen, continuar e B de gamepad sintético. A regressão dirigida das superfícies afetadas passou em 50/50. O Electron empacotado comprovou que `--tv` ativa fullscreen e a política de UI somente de consumo no renderer. Capturas `tv-home-1080.png`, `tv-movies-1080.png`, `disconnected.png` e `tv-player-1080/1440/2160.png`; Home, Filmes e Player foram inspecionados.

Simulações em memória no Chromium/macOS. `--tv` foi exercitado no Electron macOS, mas Sunshine/Moonlight, Windows/TV/LAN/controle físicos, áudio, encode, helpers e encerramento real de processos continuam pendentes. Nenhuma prova de backend, persistência, criptografia ou runtime de mídia real.

Após o refinamento transversal de navegação, a regressão **127/127** manteve verdes os cinco fluxos M18 e o Electron `--tv`. A evidência nova cobre apenas controle remoto/gamepad sintéticos: navegação espacial, repetição, confirmação única, voltar e restauração de foco. Não substitui o gate físico já registrado.
