import { useId, useState, type ReactNode } from "react";
import { ImageOff } from "lucide-react";
import { MediaCard } from "@ushark/ui";
import type { DiscoveryItem } from "@ushark/types/discovery";
import type { SelectionPreview } from "@ushark/types/selection";
import {
  averageTorrentHealth,
  bestQuality,
  formatQuality,
  TorrentHealthBadge,
} from "./MediaSignals";

export function DiscoveryArt({
  item,
  hide = false,
  landscape = false,
}: {
  item: DiscoveryItem;
  hide?: boolean;
  landscape?: boolean;
}) {
  const [failed, setFailed] = useState("");
  const image = landscape ? (item.backdrop ?? item.poster) : item.poster;
  return (
    <div className="discovery-art">
      {image && failed !== image && !hide ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          width="300"
          height="450"
          onError={() => setFailed(image)}
        />
      ) : (
        <span>
          <ImageOff size={36} />
          <small>Poster indisponível</small>
        </span>
      )}
    </div>
  );
}

export const formatPlaybackTime = (seconds: number) =>
  `${Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0")}:${Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;

export const discoveryTypeName = {
  movie: "Filme",
  series: "Série",
  episode: "Episódio",
};

export function discoverySourceSignal(
  item: Pick<DiscoveryItem, "sources" | "type">,
  selectionService: SelectionPreview,
) {
  const quality = bestQuality(item.sources.map((source) => source.quality));
  const uniqueSources = Array.from(
    new Map(item.sources.map((source) => [source.id, source])).values(),
  );
  const source =
    uniqueSources.find(
      (candidate) => formatQuality(candidate.quality) === quality,
    ) ?? uniqueSources[0];
  const healthFor = (candidate: (typeof uniqueSources)[number]) =>
    selectionService.getHealthSummary({
      id: candidate.id,
      name: candidate.quality,
      local: false,
      resolution: candidate.quality.includes("4K")
        ? 2160
        : parseInt(candidate.quality) || undefined,
    });
  return {
    quality,
    health:
      item.type !== "movie"
        ? averageTorrentHealth(
            uniqueSources.map(healthFor),
            "discovery-average",
          )
        : source
          ? healthFor(source)
          : undefined,
  };
}

export function DiscoveryCard({
  item,
  selectionService,
  rail = false,
  hideArt = false,
  accessibleLabel,
  onOpen,
}: {
  item: DiscoveryItem;
  selectionService: SelectionPreview;
  rail?: boolean;
  hideArt?: boolean;
  accessibleLabel?: string;
  onOpen: (item: DiscoveryItem) => void;
}) {
  const { quality, health } = discoverySourceSignal(item, selectionService);
  const generatedId = useId();
  const healthId = health ? `torrent-health-${generatedId}` : undefined;
  const image = rail ? (item.backdrop ?? item.poster) : item.poster;
  return (
    <MediaCard
      className={`discovery-card${rail ? " discovery-rail-card" : ""}`}
      orientation={rail ? "landscape" : "portrait"}
      image={image}
      hideImage={hideArt}
      fallback={
        <>
          <ImageOff size={36} />
          <small>Poster indisponível</small>
        </>
      }
      overlays={
        health ? (
          <TorrentHealthBadge
            id={healthId}
            health={health}
            prefix={item.type === "series" ? "Média" : undefined}
          />
        ) : undefined
      }
      title={item.title}
      progress={
        item.position > 0
          ? {
              label: `Progresso de ${item.title}`,
              value: item.position,
              max: item.duration || 1,
              caption: `Continuar de ${formatPlaybackTime(item.position)}`,
            }
          : undefined
      }
      mediaClassName="discovery-card-media"
      artClassName="discovery-art"
      copyClassName="discovery-card-copy"
      data-content-id={item.id}
      onClick={() => onOpen(item)}
      aria-label={accessibleLabel ?? `Abrir ${item.title}`}
      aria-describedby={healthId}
    >
      <small>
        {discoveryTypeName[item.type]}
        {item.year ? ` · ${item.year}` : ""}
        {quality ? ` · ${quality}` : ""}
      </small>
    </MediaCard>
  );
}

export function DiscoveryRail({
  title,
  titleId,
  items,
  selectionService,
  onOpen,
  headingAction,
  hideArt = false,
  maxItems = 10,
  className = "",
  accessibleLabel,
}: {
  title: string;
  titleId?: string;
  items: DiscoveryItem[];
  selectionService: SelectionPreview;
  onOpen: (item: DiscoveryItem) => void;
  headingAction?: ReactNode;
  hideArt?: boolean;
  maxItems?: number;
  className?: string;
  accessibleLabel?: (item: DiscoveryItem) => string;
}) {
  if (!items.length) return null;
  return (
    <section
      className={`discovery-section${className ? ` ${className}` : ""}`}
      aria-labelledby={titleId}
    >
      <div className="discovery-section-heading">
        <h2 id={titleId}>{title}</h2>
        {headingAction}
      </div>
      <div className="discovery-row" data-nav-axis="horizontal">
        {items.slice(0, maxItems).map((item) => (
          <DiscoveryCard
            key={item.id}
            item={item}
            selectionService={selectionService}
            rail
            hideArt={hideArt}
            accessibleLabel={accessibleLabel?.(item)}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}
