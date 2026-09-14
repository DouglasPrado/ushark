import type { SeriesRecord } from "@ushark/types/series";

const art = (id: string, kind: "poster" | "backdrop") =>
  `./series-art/imdb/${id}-${kind}.jpg`;

const episodes = (
  seriesId: string,
  titles: [string, string, string, string, string, string],
  resolution: "2160p" | "1080p",
) =>
  titles.map((title, index) => {
    const season = index < 3 ? 1 : 2;
    const number = (index % 3) + 1;
    const episodeCode = `S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
    return {
      id: `${seriesId}:${season}:${number}`,
      season,
      number,
      title,
      links: [
        {
          sourceId: `${seriesId}:source:season-${season}`,
          sourceName: `Temporada ${season} · fonte local de demonstração`,
          fileId: `${seriesId}:file:${episodeCode}`,
          filename: `${seriesId.split(":").at(-1)}.${episodeCode}.${resolution}.mkv`,
          resolution,
          fileAvailable: true,
          selector: "episode" as const,
          subtitle: "",
        },
      ],
    };
  });

/**
 * Static prototype snapshot based on IMDb public title datasets/pages.
 * Series identity and title metadata are real; season/episode rows and source
 * quality are intentionally small, local mock data so M03 stays frontend-first.
 */
export const imdbSeriesFixtures: SeriesRecord[] = [
  {
    id: "series:imdb:tt0903747",
    title: "Breaking Bad",
    originalTitle: "Breaking Bad",
    synopsis:
      "Um professor de química diagnosticado com câncer se transforma em fabricante e vendedor de metanfetamina para garantir o futuro da família.",
    startYear: 2008,
    endYear: 2013,
    genres: ["Crime", "Drama", "Suspense"],
    poster: art("tt0903747", "poster"),
    backdrop: art("tt0903747", "backdrop"),
    externalIds: { imdb: "tt0903747" },
    ratings: { imdb: { average: 9.5, votes: 2674582 } },
    episodes: episodes(
      "series:imdb:tt0903747",
      [
        "Piloto",
        "O acordo",
        "Consequências",
        "Sete dias",
        "O deserto",
        "Sem volta",
      ],
      "2160p",
    ),
  },
  {
    id: "series:imdb:tt0944947",
    title: "Game of Thrones",
    originalTitle: "Game of Thrones",
    synopsis:
      "Nove famílias nobres lutam pelo controle das terras de Westeros enquanto um antigo inimigo retorna depois de milhares de anos.",
    startYear: 2011,
    endYear: 2019,
    genres: ["Drama", "Fantasia"],
    poster: art("tt0944947", "poster"),
    backdrop: art("tt0944947", "backdrop"),
    externalIds: { imdb: "tt0944947" },
    ratings: { imdb: { average: 9.2, votes: 2660685 } },
    episodes: episodes(
      "series:imdb:tt0944947",
      [
        "O inverno se aproxima",
        "A estrada do rei",
        "Além da muralha",
        "O trono vazio",
        "Velhos deuses",
        "Fogo e sangue",
      ],
      "2160p",
    ),
  },
  {
    id: "series:imdb:tt0386676",
    title: "The Office",
    originalTitle: "The Office",
    synopsis:
      "Um falso documentário acompanha trabalhadores de escritório entre conflitos de ego, situações constrangedoras e comportamento inadequado.",
    startYear: 2005,
    endYear: 2013,
    genres: ["Comédia"],
    poster: art("tt0386676", "poster"),
    backdrop: art("tt0386676", "backdrop"),
    externalIds: { imdb: "tt0386676" },
    ratings: { imdb: { average: 9.0, votes: 849416 } },
    episodes: episodes(
      "series:imdb:tt0386676",
      [
        "Primeiro dia",
        "Diversidade",
        "A aliança",
        "Premiação",
        "O cliente",
        "Festa no escritório",
      ],
      "1080p",
    ),
  },
  {
    id: "series:imdb:tt5753856",
    title: "Dark",
    originalTitle: "Dark",
    synopsis:
      "Em uma cidade alemã, o desaparecimento de duas crianças expõe relações sobrenaturais entre quatro famílias.",
    startYear: 2017,
    endYear: 2020,
    genres: ["Crime", "Drama", "Mistério"],
    poster: art("tt5753856", "poster"),
    backdrop: art("tt5753856", "backdrop"),
    externalIds: { imdb: "tt5753856" },
    ratings: { imdb: { average: 8.7, votes: 561437 } },
    episodes: episodes(
      "series:imdb:tt5753856",
      [
        "O desaparecimento",
        "As cavernas",
        "Trinta e três anos",
        "O ciclo",
        "A matéria escura",
        "O próximo mundo",
      ],
      "2160p",
    ),
  },
  {
    id: "series:imdb:tt4574334",
    title: "Stranger Things",
    originalTitle: "Stranger Things",
    synopsis:
      "Após o desaparecimento de um menino, sua mãe, um chefe de polícia e seus amigos enfrentam forças aterrorizantes para trazê-lo de volta.",
    startYear: 2016,
    endYear: 2025,
    genres: ["Drama", "Fantasia", "Terror"],
    poster: art("tt4574334", "poster"),
    backdrop: art("tt4574334", "backdrop"),
    externalIds: { imdb: "tt4574334" },
    ratings: { imdb: { average: 8.6, votes: 1737778 } },
    episodes: episodes(
      "series:imdb:tt4574334",
      [
        "O desaparecimento",
        "A porta",
        "O outro lado",
        "Um novo sinal",
        "Os túneis",
        "O fechamento",
      ],
      "2160p",
    ),
  },
  {
    id: "series:imdb:tt11280740",
    title: "Ruptura",
    originalTitle: "Severance",
    synopsis:
      "A Lumen Industries leva o equilíbrio entre trabalho e vida pessoal a um novo e perturbador nível.",
    startYear: 2022,
    genres: ["Drama", "Mistério", "Ficção científica"],
    poster: art("tt11280740", "poster"),
    backdrop: art("tt11280740", "backdrop"),
    externalIds: { imdb: "tt11280740" },
    ratings: { imdb: { average: 8.6, votes: 405662 } },
    episodes: episodes(
      "series:imdb:tt11280740",
      [
        "O primeiro dia",
        "A sala de descanso",
        "Fora do mapa",
        "O retorno",
        "Linha vermelha",
        "Quem somos",
      ],
      "2160p",
    ),
  },
  {
    id: "series:imdb:tt14452776",
    title: "O Urso",
    originalTitle: "The Bear",
    synopsis:
      "Um jovem chef da alta gastronomia retorna a Chicago para administrar a lanchonete de sua família.",
    startYear: 2022,
    endYear: 2026,
    genres: ["Comédia", "Drama"],
    poster: art("tt14452776", "poster"),
    backdrop: art("tt14452776", "backdrop"),
    externalIds: { imdb: "tt14452776" },
    ratings: { imdb: { average: 8.5, votes: 325147 } },
    episodes: episodes(
      "series:imdb:tt14452776",
      [
        "De volta à cozinha",
        "Serviço intenso",
        "À mesa",
        "Reforma",
        "Preparação",
        "Amigos e família",
      ],
      "1080p",
    ),
  },
  {
    id: "series:imdb:tt3581920",
    title: "The Last of Us",
    originalTitle: "The Last of Us",
    synopsis:
      "Joel e Ellie atravessam uma América pós-pandemia, conectados pela dureza do mundo e por uma esperança improvável.",
    startYear: 2023,
    genres: ["Ação", "Aventura", "Drama"],
    poster: art("tt3581920", "poster"),
    backdrop: art("tt3581920", "backdrop"),
    externalIds: { imdb: "tt3581920" },
    ratings: { imdb: { average: 8.4, votes: 749796 } },
    episodes: episodes(
      "series:imdb:tt3581920",
      [
        "Quando tudo muda",
        "Pela estrada",
        "Luz no escuro",
        "Cinco anos depois",
        "Sem volta",
        "Vale Jackson",
      ],
      "2160p",
    ),
  },
];
