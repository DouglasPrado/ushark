import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, Clapperboard, Pause, Play } from "lucide-react";
import { Button } from "@ushark/ui";
import type { DownloadRequest } from "@ushark/types/downloads";
import type { DiscoveryItem } from "@ushark/types/discovery";
import type { PlaybackContent } from "@ushark/types/player";
import type {
  SelectionPreferences,
  SelectionPreview,
  SourceHealth,
} from "@ushark/types/selection";
import { SourceChoices } from "./SourceChoices";
import { TorrentHealthBadge } from "./MediaSignals";
import {
  DiscoveryArt,
  DiscoveryRail,
  discoveryTypeName,
  formatPlaybackTime,
} from "./DiscoveryRail";

const compactDuration = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}min` : ""}` : `${minutes}min`;
};

export const trailerDuration = (type?: DiscoveryItem["type"]) =>
  type === "episode" ? 45 : type === "series" ? 128 : 142;

export function contentRecommendations(
  items: DiscoveryItem[],
  selected: DiscoveryItem,
) {
  return items
    .filter((item) => item.id !== selected.id)
    .map((item) => ({
      item,
      score:
        (item.type === selected.type ? 100 : 0) +
        item.genres.filter((genre) => selected.genres.includes(genre)).length *
          20 +
        item.memberships.filter((membership) =>
          selected.memberships.some(
            (selectedMembership) => selectedMembership.id === membership.id,
          ),
        ).length *
          5 +
        (item.rating?.average ?? 0),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.item.title.localeCompare(right.item.title, "pt-BR"),
    )
    .slice(0, 6)
    .map(({ item }) => item);
}

interface ContentDetailsProps {
  item: DiscoveryItem;
  signal?: { quality?: string; health?: SourceHealth };
  recommendations: DiscoveryItem[];
  movieDetailPage: boolean;
  tvMode: boolean;
  selectionService: SelectionPreview;
  preferences: SelectionPreferences;
  suspended: boolean;
  onDownload: (request: DownloadRequest) => void;
  onPlay?: (content: PlaybackContent) => void;
  trailerOpen: boolean;
  trailerPlaying: boolean;
  trailerPosition: number;
  onToggleTrailer: () => void;
  onToggleTrailerPlayback: () => void;
  onMembership?: (id: string) => void;
  onRecommendation: (item: DiscoveryItem) => void;
  managementActions?: ReactNode;
  scenarioControls?: ReactNode;
  notice?: string;
  error?: string;
  backAccessibleName?: string;
}

export function ContentDetails({
  item,
  signal,
  recommendations,
  movieDetailPage,
  tvMode,
  selectionService,
  preferences,
  suspended,
  onDownload,
  onPlay,
  trailerOpen,
  trailerPlaying,
  trailerPosition,
  onToggleTrailer,
  onToggleTrailerPlayback,
  onMembership,
  onRecommendation,
  managementActions,
  scenarioControls,
  notice,
  error,
  backAccessibleName,
}: ContentDetailsProps) {
  const actionBlock = (
    <div className="discovery-detail-actions">
      <SourceChoices
        contentId={item.id}
        sources={item.sources.map((source) => ({
          id: source.id,
          name: source.quality,
          local: source.fileAvailable !== false,
          resolution: source.quality.includes("4K")
            ? 2160
            : parseInt(source.quality) || undefined,
          origin: item.memberships
            .map((membership) => membership.name)
            .join(" · "),
        }))}
        onDownload={(source) =>
          onDownload({
            content: {
              id: item.id,
              title: item.title,
              position: item.position,
              duration: item.duration,
            },
            source,
          })
        }
        service={selectionService}
        preferences={preferences}
        suspended={suspended}
        consumerMode={tvMode}
        backAction={
          <Dialog.Close asChild>
            <Button
              className="discovery-detail-back"
              variant="secondary"
              data-movie-back
              aria-label={backAccessibleName ?? "Voltar"}
              title={backAccessibleName ?? "Voltar"}
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </Button>
          </Dialog.Close>
        }
        extraAction={
          <Button
            variant="secondary"
            aria-pressed={trailerOpen}
            onClick={onToggleTrailer}
          >
            <Clapperboard size={18} />
            {trailerOpen ? "Fechar trailer" : "Trailer"}
          </Button>
        }
        trailingActions={managementActions}
        label={
          item.position > 0
            ? `Continuar de ${formatPlaybackTime(item.position)}`
            : "Assistir"
        }
        onPlay={(source) =>
          onPlay?.({
            id: item.id,
            title: item.title,
            position: item.position,
            duration: item.duration,
            available: true,
            progressive: !source.local,
            sourceId: source.id,
            sourceName: source.name,
            selector: source.selector,
          })
        }
      />
    </div>
  );

  const overviewBlock = (
    <section className="discovery-detail-overview">
      <h3>Sinopse</h3>
      <Dialog.Description className="movie-synopsis">
        {item.synopsis ?? "Detalhes disponíveis nesta biblioteca."}
      </Dialog.Description>
      {!!item.genres.length && (
        <div className="discovery-genre-badges" aria-label="Gêneros">
          {item.genres.map((genre) => (
            <span key={genre}>{genre}</span>
          ))}
        </div>
      )}
      {item.cast?.length ? (
        <p className="discovery-detail-cast">
          <strong>Elenco:</strong> {item.cast.join(", ")}
        </p>
      ) : null}
    </section>
  );

  const heroCopy = (
    <div className="discovery-detail-hero-copy">
      <span className="eyebrow">
        {item.seriesTitle ?? discoveryTypeName[item.type]}
      </span>
      <Dialog.Title asChild>
        {movieDetailPage ? <h1>{item.title}</h1> : <h2>{item.title}</h2>}
      </Dialog.Title>
      <div
        className="discovery-detail-badges"
        aria-label="Informações principais"
      >
        <span>{discoveryTypeName[item.type]}</span>
        {item.year && (
          <span>
            {item.year}
            {item.endYear ? `–${item.endYear}` : ""}
          </span>
        )}
        {item.duration > 0 && <span>{compactDuration(item.duration)}</span>}
        {!!item.seasonCount && (
          <span>
            {item.seasonCount}{" "}
            {item.seasonCount === 1 ? "temporada" : "temporadas"}
          </span>
        )}
        {item.rating && (
          <span className="discovery-rating-badge">
            IMDb {item.rating.average.toFixed(1)}
          </span>
        )}
        {signal?.quality && <span>{signal.quality}</span>}
        {signal?.health && (
          <TorrentHealthBadge
            health={signal.health}
            inline
            prefix={item.type === "series" ? "Média" : undefined}
          />
        )}
      </div>
      {movieDetailPage && actionBlock}
    </div>
  );

  const recommendationsBlock = (
    <DiscoveryRail
      title="Recomendados"
      titleId="discovery-recommendations-title"
      items={recommendations}
      selectionService={selectionService}
      onOpen={onRecommendation}
      headingAction={<span>Você também pode gostar</span>}
      maxItems={6}
      className="discovery-recommendations"
      accessibleLabel={(recommendation) =>
        `Abrir recomendação ${recommendation.title}`
      }
    />
  );

  return (
    <>
      <div
        className={`discovery-detail-hero${trailerOpen ? " is-trailer" : ""}`}
      >
        <DiscoveryArt item={item} landscape />
        {movieDetailPage ? (
          <div className="discovery-detail-hero-layout">
            {heroCopy}
            <div className="discovery-detail-hero-overview">
              {overviewBlock}
            </div>
          </div>
        ) : (
          heroCopy
        )}
        {trailerOpen && (
          <div
            className={`discovery-trailer${trailerPlaying ? " is-playing" : ""}`}
            aria-label={`Trailer de ${item.title}`}
          >
            <span className="discovery-trailer-label">TRAILER</span>
            <Button
              className="discovery-trailer-toggle"
              variant="secondary"
              aria-label={
                trailerPlaying ? "Pausar trailer" : "Reproduzir trailer"
              }
              title={trailerPlaying ? "Pausar trailer" : "Reproduzir trailer"}
              onClick={onToggleTrailerPlayback}
            >
              {trailerPlaying ? (
                <Pause aria-hidden="true" fill="currentColor" />
              ) : (
                <Play aria-hidden="true" fill="currentColor" />
              )}
            </Button>
            <div className="discovery-trailer-progress">
              <progress
                aria-label="Progresso do trailer"
                value={trailerPosition}
                max={trailerDuration(item.type)}
              />
              <span>
                {formatPlaybackTime(trailerPosition)} /{" "}
                {formatPlaybackTime(trailerDuration(item.type))}
              </span>
            </div>
          </div>
        )}
      </div>

      {!movieDetailPage && actionBlock}

      {!movieDetailPage && (
        <div className="discovery-detail-content">
          {overviewBlock}

          <aside className="discovery-detail-facts">
            <dl>
              {item.originalTitle && item.originalTitle !== item.title && (
                <div>
                  <dt>Título original</dt>
                  <dd>{item.originalTitle}</dd>
                </div>
              )}
              {item.rating && (
                <div>
                  <dt>Avaliação</dt>
                  <dd>
                    {item.rating.average.toFixed(1)} de 10 ·{" "}
                    {item.rating.votes.toLocaleString("pt-BR")} votos
                  </dd>
                </div>
              )}
              {!!item.episodeCount && (
                <div>
                  <dt>Episódios</dt>
                  <dd>
                    {item.episodeCount.toLocaleString("pt-BR")}{" "}
                    {item.episodeCount === 1 ? "episódio" : "episódios"}
                  </dd>
                </div>
              )}
              <div>
                <dt>Disponibilidade</dt>
                <dd>
                  {item.sources.length
                    ? `${item.sources.length} ${item.sources.length === 1 ? "fonte" : "fontes"} · ${item.sources.map((source) => source.quality).join(" / ")}`
                    : "Indisponível neste dispositivo"}
                </dd>
              </div>
              {item.externalIds?.imdb && (
                <div>
                  <dt>IMDb</dt>
                  <dd>{item.externalIds.imdb}</dd>
                </div>
              )}
            </dl>
            {!tvMode && item.memberships.length > 0 && (
              <div className="discovery-detail-memberships">
                <h3>Nas suas bibliotecas</h3>
                {item.memberships.map((membership) => (
                  <button
                    key={membership.id}
                    onClick={() => onMembership?.(membership.id)}
                    disabled={!onMembership}
                  >
                    {membership.name}
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}
      {error && (
        <p className="discovery-detail-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="discovery-detail-notice" role="status">
          {notice}
        </p>
      )}
      {movieDetailPage && recommendationsBlock}
      {scenarioControls}
      {!movieDetailPage && recommendationsBlock}
    </>
  );
}
