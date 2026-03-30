import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchAssets, createAsset, updateAsset, deleteAsset } from "@/services/api";
import { TvShow, Season, Episode } from "@/types";
import SeasonForm from "@/components/SeasonForm";
import EpisodeForm from "@/components/EpisodeForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, Loader2, Film } from "lucide-react";
import { toast } from "sonner";

const TvShowDetail = () => {
  const { key } = useParams<{ key: string }>();
  const queryClient = useQueryClient();
  const decodedKey = decodeURIComponent(key || "");

  const [seasonFormOpen, setSeasonFormOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [deleteSeason, setDeleteSeason] = useState<Season | null>(null);

  const [episodeFormOpen, setEpisodeFormOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [deleteEpisode, setDeleteEpisode] = useState<Episode | null>(null);
  const [activeSeasonKey, setActiveSeasonKey] = useState<string>("");

  const { data: shows = [] } = useQuery({
    queryKey: ["tvShows"],
    queryFn: () => searchAssets<TvShow>("tvShows"),
  });
  const show = shows.find((s) => s["@key"] === decodedKey);
  const showName = show?.name || "Série sem nome";

  const { data: allSeasons = [], isLoading: loadingSeasons } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => searchAssets<Season>("seasons"),
  });
  const seasons = allSeasons.filter((s) => s.tvShow?.["@key"] === decodedKey);

  const { data: allEpisodes = [] } = useQuery({
    queryKey: ["episodes"],
    queryFn: () => searchAssets<Episode>("episodes"),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["seasons"] });
    queryClient.invalidateQueries({ queryKey: ["episodes"] });
  };

  const createSeasonMut = useMutation({
    mutationFn: (data: { seasonNumber: number; yearReleased: number }) =>
      createAsset([{ "@assetType": "seasons", tvShow: { "@assetType": "tvShows", "@key": decodedKey }, ...data }]),
    onSuccess: () => {
      invalidate();
      setEditingSeason(null);
      setSeasonFormOpen(false);
      toast.success("Temporada criada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateSeasonMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateAsset({ "@assetType": "seasons", ...data }),
    onSuccess: () => {
      invalidate();
      setEditingSeason(null);
      setSeasonFormOpen(false);
      toast.success("Temporada atualizada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteSeasonMut = useMutation({
    mutationFn: (s: Season) => deleteAsset({ "@assetType": "seasons", "@key": s["@key"] }),
    onSuccess: () => { invalidate(); toast.success("Temporada excluída!"); },
    onError: (e) => toast.error(e.message),
  });

  const createEpisodeMut = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      createAsset([{ "@assetType": "episodes", season: { "@assetType": "seasons", "@key": activeSeasonKey }, ...data }]),
    onSuccess: () => {
      invalidate();
      setEditingEpisode(null);
      setEpisodeFormOpen(false);
      toast.success("Episódio criado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateEpisodeMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateAsset({ "@assetType": "episodes", ...data }),
    onSuccess: () => {
      invalidate();
      setEditingEpisode(null);
      setEpisodeFormOpen(false);
      toast.success("Episódio atualizado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteEpisodeMut = useMutation({
    mutationFn: (ep: Episode) => deleteAsset({ "@assetType": "episodes", "@key": ep["@key"] }),
    onSuccess: () => { invalidate(); toast.success("Episódio excluído!"); },
    onError: (e) => toast.error(e.message),
  });

  if (!show) {
    return (
      <div className="container py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <p className="text-muted-foreground">Série não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar às Séries
      </Link>

      <div className="mb-8 flex items-start gap-6">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-lg bg-accent">
          <Film className="h-12 w-12 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{showName}</h1>
          {show.genre && <span className="mt-1 inline-block rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary">{show.genre}</span>}
          {show.yearReleased && <p className="mt-1 text-sm text-muted-foreground">Lançamento: {show.yearReleased}</p>}
          {show.description && <p className="mt-2 text-muted-foreground max-w-2xl">{show.description}</p>}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Temporadas</h2>
        <Button size="sm" onClick={() => { setEditingSeason(null); setSeasonFormOpen(true); }} className="gap-1">
          <Plus className="h-4 w-4" /> Temporada
        </Button>
      </div>

      {loadingSeasons ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : seasons.length === 0 ? (
        <p className="text-muted-foreground py-6">Nenhuma temporada cadastrada.</p>
      ) : (
        <div className="space-y-3">
          {seasons
            .sort((a, b) => a.seasonNumber - b.seasonNumber)
            .map((season) => {
              const eps = allEpisodes
                .filter((e) => e.season?.["@key"] === season["@key"])
                .sort((a, b) => a.episodeNumber - b.episodeNumber);
              return (
                <Collapsible key={season["@key"]}>
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary transition-colors">
                          <ChevronDown className="h-4 w-4" />
                          <CardTitle className="text-base">Temporada {season.seasonNumber}</CardTitle>
                          <span className="text-xs text-muted-foreground">({eps.length} ep.)</span>
                        </CollapsibleTrigger>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setActiveSeasonKey(season["@key"]); setEditingEpisode(null); setEpisodeFormOpen(true); }}>
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingSeason(season); setSeasonFormOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteSeason(season)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-3 px-4">
                        {eps.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhum episódio.</p>
                        ) : (
                          <div className="space-y-2">
                            {eps.map((ep) => (
                              <div key={ep["@key"]} className="flex items-center justify-between rounded-md bg-accent/50 px-3 py-2">
                                <div>
                                  <span className="text-sm font-medium">E{ep.episodeNumber} — {ep.name || "Episódio sem nome"}</span>
                                  {ep.dateAired && <span className="ml-2 text-xs text-muted-foreground">{ep.dateAired}</span>}
                                </div>
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setActiveSeasonKey(season["@key"]); setEditingEpisode(ep); setEpisodeFormOpen(true); }}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteEpisode(ep)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
        </div>
      )}

      <SeasonForm
        open={seasonFormOpen}
        onOpenChange={setSeasonFormOpen}
        initial={editingSeason}
        key={editingSeason?.["@key"] || "new-s"}
        onSubmit={(data) => {
          if (editingSeason) {
            updateSeasonMut.mutate({ "@key": editingSeason["@key"], ...data });
          } else {
            createSeasonMut.mutate(data);
          }
        }}
      />

      <EpisodeForm
        open={episodeFormOpen}
        onOpenChange={setEpisodeFormOpen}
        initial={editingEpisode}
        key={editingEpisode?.["@key"] || "new-e"}
        onSubmit={(data) => {
          if (editingEpisode) {
            updateEpisodeMut.mutate({ "@key": editingEpisode["@key"], ...data });
          } else {
            createEpisodeMut.mutate(data);
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteSeason}
        onOpenChange={(v) => !v && setDeleteSeason(null)}
        title="Excluir Temporada"
        description={`Excluir Temporada ${deleteSeason?.seasonNumber}?`}
        onConfirm={() => { if (deleteSeason) { deleteSeasonMut.mutate(deleteSeason); setDeleteSeason(null); } }}
      />

      <ConfirmDialog
        open={!!deleteEpisode}
        onOpenChange={(v) => !v && setDeleteEpisode(null)}
        title="Excluir Episódio"
        description={`Excluir "${deleteEpisode?.name || "Episódio sem nome"}"?`}
        onConfirm={() => { if (deleteEpisode) { deleteEpisodeMut.mutate(deleteEpisode); setDeleteEpisode(null); } }}
      />
    </div>
  );
};

export default TvShowDetail;
