import { useDeferredValue, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchAssets,
  searchFavoriteLists,
  createFavoriteList,
  updateFavoriteList,
  deleteFavoriteList,
} from "@/services/api";
import { Playlist, TvShow } from "@/types";
import FavoriteListForm from "@/components/FavoriteListForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Heart, X, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

const Favorites = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Playlist | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);
  const [addShowToList, setAddShowToList] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const { data: playlists = [], isLoading, isFetching, error } = useQuery({
    queryKey: ["favorites", deferredSearch],
    queryFn: () =>
      searchFavoriteLists<Playlist>({
        term: deferredSearch,
        fields: ["title", "name"],
      }),
  });

  const { data: shows = [] } = useQuery({
    queryKey: ["tvShows"],
    queryFn: () => searchAssets<TvShow>("tvShows"),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["favorites"] });

  const createMut = useMutation({
    mutationFn: (data: { name: string }) => createFavoriteList(data),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      setFormOpen(false);
      toast.success("Lista criada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateFavoriteList(data),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      setFormOpen(false);
      toast.success("Lista atualizada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (p: Playlist) => deleteFavoriteList({ "@key": p["@key"] }),
    onSuccess: () => { invalidate(); toast.success("Lista excluída!"); },
    onError: (e) => toast.error(e.message),
  });

  const addShowMut = useMutation({
    mutationFn: ({ playlist, showKey }: { playlist: Playlist; showKey: string }) => {
      const existing = playlist.tvShows || [];
      return updateFavoriteList({
        "@key": playlist["@key"],
        tvShows: [...existing, { "@assetType": "tvShows" as const, "@key": showKey }],
      });
    },
    onSuccess: () => { invalidate(); toast.success("Série adicionada!"); },
    onError: (e) => toast.error(e.message),
  });

  const removeShowMut = useMutation({
    mutationFn: ({ playlist, showKey }: { playlist: Playlist; showKey: string }) => {
      const updated = (playlist.tvShows || []).filter((s) => s["@key"] !== showKey);
      return updateFavoriteList({
        "@key": playlist["@key"],
        tvShows: updated,
      });
    },
    onSuccess: () => { invalidate(); toast.success("Série removida!"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Favoritos</h1>
          <p className="text-muted-foreground">Gerencie suas listas de séries favoritas</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Lista
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        {isFetching ? (
          <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          placeholder="Buscar lista por nome na API..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <p className="text-lg font-medium">Não foi possível carregar as listas</p>
          <p className="mt-2 text-sm">{error.message}</p>
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Heart className="h-12 w-12 mb-4" />
          <p className="text-lg">Nenhuma lista de favoritos</p>
          <p className="text-sm">Tente outro termo ou crie sua primeira lista clicando no botão acima</p>
        </div>
      ) : (
        <div className="space-y-6">
          {playlists.map((pl) => {
            const plShows = (pl.tvShows || [])
              .map((ref) => shows.find((s) => s["@key"] === ref["@key"]))
              .filter(Boolean) as TvShow[];
            const availableShows = shows.filter(
              (s) => !(pl.tvShows || []).some((ref) => ref["@key"] === s["@key"])
            );

            return (
              <Card key={pl["@key"]}>
                <CardHeader className="py-4 px-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" />
                      {pl.name}
                      <span className="text-sm font-normal text-muted-foreground">({plShows.length} séries)</span>
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setAddShowToList(addShowToList === pl["@key"] ? null : pl["@key"])}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(pl); setFormOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(pl)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4 px-5">
                  {addShowToList === pl["@key"] && availableShows.length > 0 && (
                    <div className="mb-4">
                      <Select onValueChange={(val) => { addShowMut.mutate({ playlist: pl, showKey: val }); setAddShowToList(null); }}>
                        <SelectTrigger className="max-w-xs">
                          <SelectValue placeholder="Selecione uma série para adicionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableShows.map((s) => (
                            <SelectItem key={s["@key"]} value={s["@key"]}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {plShows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma série nesta lista.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {plShows.map((s) => (
                        <span key={s["@key"]} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm">
                          {s.name}
                          <button onClick={() => removeShowMut.mutate({ playlist: pl, showKey: s["@key"] })} className="hover:text-destructive transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <FavoriteListForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        key={editing?.["@key"] || "new-f"}
        onSubmit={(data) => {
          if (editing) {
            updateMut.mutate({ "@key": editing["@key"], ...data });
          } else {
            createMut.mutate(data);
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Excluir Lista"
        description={`Excluir a lista "${deleteTarget?.name}"?`}
        onConfirm={() => { if (deleteTarget) { deleteMut.mutate(deleteTarget); setDeleteTarget(null); } }}
      />
    </div>
  );
};

export default Favorites;
