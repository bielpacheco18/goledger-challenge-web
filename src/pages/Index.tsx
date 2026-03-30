import { useDeferredValue, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchAssets, createAsset, updateAsset, deleteAsset } from "@/services/api";
import { TvShow } from "@/types";
import TvShowCard from "@/components/TvShowCard";
import TvShowForm from "@/components/TvShowForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<TvShow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TvShow | null>(null);
  const deferredSearch = useDeferredValue(search);

  const { data: shows = [], isLoading, isFetching, error } = useQuery({
    queryKey: ["tvShows", deferredSearch],
    queryFn: () =>
      searchAssets<TvShow>("tvShows", {
        term: deferredSearch,
        fields: ["title", "description", "releaseYear", "recommendedAge"],
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createAsset([{ "@assetType": "tvShows", ...data }]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tvShows"] });
      setEditingShow(null);
      setFormOpen(false);
      toast.success("Série criada!");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateAsset({ "@assetType": "tvShows", ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tvShows"] });
      setEditingShow(null);
      setFormOpen(false);
      toast.success("Série atualizada!");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (show: TvShow) => deleteAsset({ "@assetType": "tvShows", "@key": show["@key"] }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tvShows"] }); toast.success("Série excluída!"); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const handleSubmit = (data: {
    name: string;
    description: string;
    yearReleased: number | undefined;
    recommendedAge: number | undefined;
  }) => {
    if (editingShow) {
      updateMutation.mutate({ "@key": editingShow["@key"], ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Séries de TV</h1>
          <p className="text-muted-foreground">Gerencie seu catálogo de séries</p>
        </div>
        <Button onClick={() => { setEditingShow(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar Série
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        {isFetching ? (
          <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          placeholder="Buscar na API por nome, gênero ou descrição..."
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
          <p className="text-lg font-medium">Não foi possível carregar as séries</p>
          <p className="mt-2 text-sm">{error.message}</p>
        </div>
      ) : shows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg">Nenhuma série encontrada</p>
          <p className="text-sm">Tente outro termo ou adicione sua primeira série clicando no botão acima</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {shows.map((show) => (
            <TvShowCard
              key={show["@key"]}
              show={show}
              onEdit={(s) => { setEditingShow(s); setFormOpen(true); }}
              onDelete={(s) => setDeleteTarget(s)}
            />
          ))}
        </div>
      )}

      <TvShowForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initial={editingShow}
        key={editingShow?.["@key"] || "new"}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Excluir Série"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name || "Série sem nome"}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => { if (deleteTarget) { deleteMutation.mutate(deleteTarget); setDeleteTarget(null); } }}
      />
    </div>
  );
};

export default Index;
