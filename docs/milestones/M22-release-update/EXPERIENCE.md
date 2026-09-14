# Experiência frontend M22

Configurações → Sobre e atualização → versão/canal → verificar candidato → revisar notas e metadados demonstrativos → confirmar → download/verificação/backup M21/aplicação simulados → abrir biblioteca preservada. About distingue versão simulada do build local; plataforma alvo Windows x64 não é hardware validado. Schema DB/IPC/manifest/API e pinning real permanecem não verificados, sem dados inventados.

Canary/Beta/Stable são feeds simulados; trocar canal muda metadado sem alterar checksum DEMO do mesmo candidato. Não há promoção de release nem autorização Stable na UI. SBOM/checksum/provenance explicam disponibilidade: somente fixture de checksum, nenhuma assinatura/attestation real. Installer simulado permite ver instalado/ausente e reinstalar; desinstalação simulada confirmada preserva biblioteca/cache/progresso/fila, sem remover app/arquivos reais.

Estados: já atualizado, disponível, downloading/verifying/applying, assinatura/hash inválidos, incompatibilidade Windows x64, falha download/migração/offline; cancelar preserva versão e dados anteriores. Antes de aplicar cria backup da sessão. Falha oferece abrir recuperação M21; link retorna ao catálogo. NFR118/131/RX053–055/058: efeitos UX aqui, documentação/coverage e evidências na auditoria final; CI/release/signing/installer real/Stable/artefatos externos e budgets/hardware S03–S08 adiados.
