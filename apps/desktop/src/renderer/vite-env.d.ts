/// <reference types="vite/client" />

import type { ConfigurationDesktopApi } from "@ushark/types";
import type { DiscoveryDesktopApi } from "@ushark/types/discovery";
import type { DownloadDesktopApi } from "@ushark/types/downloads";
import type { MovieCatalogDesktopApi } from "@ushark/types/movies";
import type { LibraryDraftDesktopApi } from "@ushark/types/libraries";
import type { LibraryPackageDesktopApi } from "@ushark/types/library-package";
import type { LibraryTrustDesktopApi } from "@ushark/types/library-trust";
import type { LibraryPublishDesktopApi } from "@ushark/types/library-publish";
import type { SubscriptionDesktopApi } from "@ushark/types/subscriptions";
import type { LibraryForkDesktopApi } from "@ushark/types/library-fork";
import type { TvSessionDesktopApi } from "@ushark/types/tv";
import type { FallbackDesktopApi } from "@ushark/types/fallback";
import type { DiagnosticDesktopApi } from "@ushark/types/diagnostics";
import type { RecoveryDesktopApi } from "@ushark/types/recovery";
import type { AppUpdateDesktopApi } from "@ushark/types/app-update";
import type { NextEpisodeDesktopApi } from "@ushark/types/next-episode";
import type { PlaybackDesktopApi } from "@ushark/types/player";
import type { SeriesCatalogDesktopApi } from "@ushark/types/series";
import type { ProgressiveStreamDesktopApi } from "@ushark/types/stream";
import type { SourceSelectionDesktopApi } from "@ushark/types/selection";
import type { StorageDesktopApi } from "@ushark/types/storage";
import type { TorrentInspectionDesktopApi } from "@ushark/types/torrent";

declare global {
  interface Window {
    ushark?: {
      configuration: ConfigurationDesktopApi;
      discovery: DiscoveryDesktopApi;
      downloads: DownloadDesktopApi;
      movieCatalog: MovieCatalogDesktopApi;
      libraryDrafts: LibraryDraftDesktopApi;
      libraryPackage: LibraryPackageDesktopApi;
      libraryTrust: LibraryTrustDesktopApi;
      libraryPublish: LibraryPublishDesktopApi;
      subscriptions: SubscriptionDesktopApi;
      libraryFork: LibraryForkDesktopApi;
      tvSession: TvSessionDesktopApi;
      fallback: FallbackDesktopApi;
      diagnostics: DiagnosticDesktopApi;
      recovery: RecoveryDesktopApi;
      appUpdate: AppUpdateDesktopApi;
      nextEpisode: NextEpisodeDesktopApi;
      playback: PlaybackDesktopApi;
      seriesCatalog: SeriesCatalogDesktopApi;
      stream: ProgressiveStreamDesktopApi;
      sourceSelection: SourceSelectionDesktopApi;
      storage: StorageDesktopApi;
      torrentInspection: TorrentInspectionDesktopApi;
    };
  }
}
