import { useId, type ReactNode } from "react";

const catalogCategories = [
  { title: "Ação e aventura", genres: ["Ação", "Aventura"] },
  { title: "Drama", genres: ["Drama"] },
  { title: "Comédia", genres: ["Comédia"] },
  { title: "Crime e suspense", genres: ["Crime", "Suspense"] },
  {
    title: "Ficção científica e fantasia",
    genres: ["Ficção científica", "Fantasia"],
  },
  { title: "Mistério e terror", genres: ["Mistério", "Terror"] },
  { title: "Família e animação", genres: ["Família", "Animação"] },
  { title: "Biografias e história", genres: ["Biografia", "História"] },
] as const;

export function groupCatalogItems<T>(
  items: T[],
  getGenres: (item: T) => string[],
) {
  const groups = catalogCategories
    .map((category) => ({
      title: category.title,
      items: items.filter((item) =>
        getGenres(item).some((genre) =>
          (category.genres as readonly string[]).includes(genre),
        ),
      ),
    }))
    .filter((category) => category.items.length > 0);
  const categorized = new Set(groups.flatMap((category) => category.items));
  const others = items.filter((item) => !categorized.has(item));

  return others.length
    ? [...groups, { title: "Outros", items: others }]
    : groups;
}

export function CatalogRail({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const titleId = useId();

  return (
    <section className="catalog-rail" aria-labelledby={titleId}>
      <div className="catalog-rail-heading">
        <h2 id={titleId}>{title}</h2>
      </div>
      <div className="catalog-rail-row" data-nav-axis="horizontal">
        {children}
      </div>
    </section>
  );
}
