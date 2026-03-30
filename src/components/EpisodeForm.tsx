import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Episode } from "@/types";

const REQUIRED_MESSAGE = "Preencha este campo obrigatório antes de continuar.";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; episodeNumber: number; dateAired: string; description: string }) => void;
  initial?: Episode | null;
}

const EpisodeForm = ({ open, onOpenChange, onSubmit, initial }: Props) => {
  const [name, setName] = useState(initial?.name || "");
  const [episodeNumber, setEpisodeNumber] = useState(initial?.episodeNumber?.toString() || "");
  const [dateAired, setDateAired] = useState(initial?.dateAired || "");
  const [description, setDescription] = useState(initial?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, episodeNumber: parseInt(episodeNumber), dateAired, description });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Episódio" : "Novo Episódio"}</DialogTitle>
          <DialogDescription>
            Informe os dados do episódio e vincule-o à temporada selecionada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Nome e número do episódio são obrigatórios para concluir o cadastro.
          </div>
          <div className="space-y-2">
            <Label htmlFor="ename">Nome *</Label>
            <Input
              id="ename"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              onInvalid={(e) => e.currentTarget.setCustomValidity(REQUIRED_MESSAGE)}
              onInput={(e) => e.currentTarget.setCustomValidity("")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="enum">Número do Episódio *</Label>
            <Input
              id="enum"
              type="number"
              value={episodeNumber}
              onChange={(e) => setEpisodeNumber(e.target.value)}
              required
              min={1}
              onInvalid={(e) => e.currentTarget.setCustomValidity(REQUIRED_MESSAGE)}
              onInput={(e) => e.currentTarget.setCustomValidity("")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edate">Data de Exibição</Label>
            <Input id="edate" type="date" value={dateAired} onChange={(e) => setDateAired(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edesc">Descrição</Label>
            <Textarea id="edesc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button type="submit" className="w-full">{initial ? "Salvar" : "Criar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EpisodeForm;
