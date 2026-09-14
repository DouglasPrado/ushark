import type { MovieMetadata } from "@ushark/types/movies";

const imdbArt = (imdbId: string, kind: "poster" | "backdrop") =>
  `./movie-art/imdb/${imdbId}-${kind}.jpg`;

/**
 * Curated development snapshot built from IMDb's title.basics and
 * title.ratings datasets.
 *
 * Sources: https://datasets.imdbws.com/title.basics.tsv.gz
 *          https://datasets.imdbws.com/title.ratings.tsv.gz
 * Dataset run: 2026-09-12
 * Accessed: 2026-09-13
 *
 * The official non-commercial datasets supply the IMDb id, primary/original
 * titles, year, runtime, genres, rating and vote count. Portuguese display
 * titles and the short synopses below are local presentation copy. Poster and
 * backdrop snapshots are local copies of images displayed on each IMDb title
 * page; see apps/desktop/public/movie-art/imdb/README.md for provenance and
 * the prototype-only licensing boundary.
 *
 * Information courtesy of IMDb (https://www.imdb.com). Used with permission.
 */
export const imdbMovieFixtures = [
  {
    id: "movie:local:imdb-tt0816692",
    title: "Interestelar",
    originalTitle: "Interstellar",
    year: 2014,
    synopsis:
      "Exploradores atravessam o espaço em busca de um novo lar para a humanidade enquanto o tempo transforma tudo o que deixaram para trás.",
    duration: 169,
    genres: ["Aventura", "Drama", "Ficção científica"],
    cast: [],
    poster: imdbArt("tt0816692", "poster"),
    backdrop: imdbArt("tt0816692", "backdrop"),
    externalIds: { imdb: "tt0816692" },
    ratings: {
      imdb: { average: 8.7, votes: 2605028, snapshotDate: "2026-09-13" },
    },
  },
  {
    id: "movie:local:imdb-tt15239678",
    title: "Duna: Parte Dois",
    originalTitle: "Dune: Part Two",
    year: 2024,
    synopsis:
      "Paul Atreides se une aos Fremen e precisa escolher entre um amor, uma guerra e o futuro que enxerga se aproximando.",
    duration: 166,
    genres: ["Ação", "Aventura", "Drama"],
    cast: [],
    poster: imdbArt("tt15239678", "poster"),
    backdrop: imdbArt("tt15239678", "backdrop"),
    externalIds: { imdb: "tt15239678" },
    ratings: {
      imdb: { average: 8.4, votes: 792368, snapshotDate: "2026-09-13" },
    },
  },
  {
    id: "movie:local:imdb-tt15398776",
    title: "Oppenheimer",
    originalTitle: "Oppenheimer",
    year: 2023,
    synopsis:
      "O físico J. Robert Oppenheimer lidera um projeto que altera a história e passa a enfrentar as consequências científicas e políticas de sua criação.",
    duration: 180,
    genres: ["Biografia", "Drama", "História"],
    cast: [],
    poster: imdbArt("tt15398776", "poster"),
    backdrop: imdbArt("tt15398776", "backdrop"),
    externalIds: { imdb: "tt15398776" },
    ratings: {
      imdb: { average: 8.2, votes: 1096626, snapshotDate: "2026-09-13" },
    },
  },
  {
    id: "movie:local:imdb-tt6751668",
    title: "Parasita",
    originalTitle: "Gisaengchung",
    year: 2019,
    synopsis:
      "Uma família encontra uma oportunidade inesperada dentro de uma casa abastada, mas cada novo vínculo torna o equilíbrio mais frágil.",
    duration: 132,
    genres: ["Drama", "Suspense"],
    cast: [],
    poster: imdbArt("tt6751668", "poster"),
    backdrop: imdbArt("tt6751668", "backdrop"),
    externalIds: { imdb: "tt6751668" },
    ratings: {
      imdb: { average: 8.5, votes: 1194868, snapshotDate: "2026-09-13" },
    },
  },
  {
    id: "movie:local:imdb-tt0468569",
    title: "Batman: O Cavaleiro das Trevas",
    originalTitle: "The Dark Knight",
    year: 2008,
    synopsis:
      "Batman enfrenta um adversário que transforma Gotham em um teste de limites, escolhas e consequências.",
    duration: 152,
    genres: ["Crime", "Suspense"],
    cast: [],
    poster: imdbArt("tt0468569", "poster"),
    backdrop: imdbArt("tt0468569", "backdrop"),
    externalIds: { imdb: "tt0468569" },
    ratings: {
      imdb: { average: 9.1, votes: 3225193, snapshotDate: "2026-09-13" },
    },
  },
  {
    id: "movie:local:imdb-tt6710474",
    title: "Tudo em Todo Lugar ao Mesmo Tempo",
    originalTitle: "Everything Everywhere All at Once",
    year: 2022,
    synopsis:
      "Uma proprietária de lavanderia atravessa possibilidades improváveis para proteger sua família e reencontrar sentido no cotidiano.",
    duration: 139,
    genres: ["Ação", "Aventura", "Comédia"],
    cast: [],
    poster: imdbArt("tt6710474", "poster"),
    backdrop: imdbArt("tt6710474", "backdrop"),
    externalIds: { imdb: "tt6710474" },
    ratings: {
      imdb: { average: 7.7, votes: 661007, snapshotDate: "2026-09-13" },
    },
  },
  {
    id: "movie:local:imdb-tt0245429",
    title: "A Viagem de Chihiro",
    originalTitle: "Sen to Chihiro no kamikakushi",
    year: 2001,
    synopsis:
      "Chihiro entra em um mundo de espíritos e precisa encontrar coragem para salvar os pais e voltar para casa.",
    duration: 124,
    genres: ["Aventura", "Animação", "Família"],
    cast: [],
    poster: imdbArt("tt0245429", "poster"),
    backdrop: imdbArt("tt0245429", "backdrop"),
    externalIds: { imdb: "tt0245429" },
    ratings: {
      imdb: { average: 8.6, votes: 984364, snapshotDate: "2026-09-13" },
    },
  },
  {
    id: "movie:local:imdb-tt0068646",
    title: "O Poderoso Chefão",
    originalTitle: "The Godfather",
    year: 1972,
    synopsis:
      "A sucessão dentro de uma família poderosa arrasta um herdeiro relutante para decisões que mudam seu destino.",
    duration: 175,
    genres: ["Crime", "Drama"],
    cast: [],
    poster: imdbArt("tt0068646", "poster"),
    backdrop: imdbArt("tt0068646", "backdrop"),
    externalIds: { imdb: "tt0068646" },
    ratings: {
      imdb: { average: 9.2, votes: 2255117, snapshotDate: "2026-09-13" },
    },
  },
] satisfies MovieMetadata[];
