# M13 S03 — contrato de domínio

`.tslib` v1 é JSON UTF-8 declarativo e canônico, com schema `1.0`, SHA-256,
snapshot imutável por `draftId@version`, preview antes do commit e idempotência
no commit. O limite é 2 MiB, profundidade 24, 5.000 conteúdos, 256 assets e
20.000 bytes por string. Assets aceitos: HTTPS, IPFS e arte empacotada em
`/movie-art/<arquivo seguro>`. Major incompatível, traversal, path externo,
HTML/CSS/script e assinatura sem verificador são rejeitados antes de persistir.

Decisões D04/D08/D14/D21/D22: [pacote v1](../../../decisions/M13-D04-D08-D14-D21-D22-package-v1.md).
