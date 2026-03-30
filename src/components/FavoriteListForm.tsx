import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Playlist } from "@/types";

const REQUIRED_MESSAGE = "Dê um nome para a lista antes de continuar.";
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string }) => void;
  initial?: Playlist | null;
}

const FavoriteListForm = ({ open, onOpenChange, onSubmit, initial }: Props) => {
  const [name, setName] = useState(initial?.name || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Lista" : "Nova Lista de Favoritos"}</DialogTitle>
          <DialogDescription>
            Informe um nome para a lista que vai agrupar suas séries favoritas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            O nome da lista é obrigatório.
          </div>
          <div className="space-y-2">
            <Label htmlFor="fname">Nome da Lista *</Label>
            <Input
              id="fname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              onInvalid={(e) => e.currentTarget.setCustomValidity(REQUIRED_MESSAGE)}
              onInput={(e) => e.currentTarget.setCustomValidity("")}
            />
          </div>
          <Button type="submit" className="w-full">{initial ? "Salvar" : "Criar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FavoriteListForm;
