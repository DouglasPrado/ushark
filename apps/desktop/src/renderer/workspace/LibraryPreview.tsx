import type { LibraryContent, LibraryDraft } from "@ushark/types/libraries";
import "./libraries.css";
export function LibraryPreview({
  draft,
  catalog,
  progress,
  onContent,
}: {
  draft: LibraryDraft;
  catalog: LibraryContent[];
  progress: (id: string) => number;
  onContent: (id: string) => void;
}) {
  const members = new Map(draft.memberships.map((m) => [m.contentId, m]));
  const cards = (ids: string[]) =>
    ids
      .filter((id) => members.has(id))
      .map((id) => {
        const item = catalog.find((x) => x.id === id),
          member = members.get(id)!;
        return (
          <button
            className="library-content-card"
            key={id}
            onClick={() => onContent(id)}
          >
            {item?.poster ? (
              <img src={item.poster} alt="" />
            ) : (
              <div className="library-art-fallback">Sem imagem</div>
            )}
            <strong>
              {member.titleOverride || item?.title || "Conteúdo indisponível"}
            </strong>
          </button>
        );
      });
  return (
    <div
      className="library-preview"
      style={
        { "--library-accent": draft.accent } as import("react").CSSProperties
      }
    >
      <header
        className="library-banner"
        style={
          draft.banner
            ? {
                backgroundImage: `linear-gradient(90deg,#080d17dd,#080d1766),url(${draft.banner})`,
              }
            : undefined
        }
      >
        {draft.avatar && (
          <img
            className="library-avatar-image"
            src={draft.avatar}
            alt="Avatar da biblioteca"
          />
        )}
        {draft.logo && (
          <img
            className="library-logo-image"
            src={draft.logo}
            alt="Logo da biblioteca"
          />
        )}
        <div>
          <h1>{draft.name || "Biblioteca sem nome"}</h1>
          <p>{draft.description}</p>
          <small>
            {draft.author
              ? `Curadoria de ${draft.author}`
              : "Autor não informado"}
          </small>
        </div>
      </header>
      {!draft.sections.length && (
        <div className="workspace-empty">
          <h2>Esta prévia ainda não tem seções</h2>
          <p>Organize coleções e adicione uma seção no editor.</p>
        </div>
      )}
      {draft.sections.map((section) => {
        const collection = draft.collections.find(
          (c) => c.id === section.collectionId,
        );
        const ids =
          section.type === "continue"
            ? draft.memberships
                .filter((m) => progress(m.contentId) > 0)
                .map((m) => m.contentId)
            : (collection?.items ?? []);
        return (
          <section
            key={section.id}
            className={`library-section library-${section.type}`}
          >
            <h2>
              {section.title || collection?.name || "Continuar assistindo"}
            </h2>
            {ids.length ? (
              <div className="library-items">
                {cards(section.type === "hero" ? ids.slice(0, 1) : ids)}
              </div>
            ) : (
              <p>
                {section.type === "continue"
                  ? "Nenhum progresso pessoal nesta sessão."
                  : "Coleção vazia."}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
