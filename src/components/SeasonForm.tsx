import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Season } from "@/types";

const REQUIRED_MESSAGE = "Preencha este campo obrigatório antes de continuar.";
const REQUIRED_YEAR_MESSAGE = "Informe o ano da temporada antes de continuar.";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { seasonNumber: number; yearReleased: number }) => void;
  initial?: Season | null;
}

const SeasonForm = ({ open, onOpenChange, onSubmit, initial }: Props) => {
  const [seasonNumber, setSeasonNumber] = useState(initial?.seasonNumber?.toString() || "");
  const [yearReleased, setYearReleased] = useState(initial?.yearReleased?.toString() || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ seasonNumber: parseInt(seasonNumber, 10), yearReleased: parseInt(yearReleased, 10) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Temporada" : "Nova Temporada"}</DialogTitle>
          <DialogDescription>
            Defina o número e o ano da temporada para organizar a série.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            O número e o ano da temporada são obrigatórios para salvar este registro.
          </div>
          <div className="space-y-2">
            <Label htmlFor="snum">Número da Temporada *</Label>
            <Input
              id="snum"
              type="number"
              value={seasonNumber}
              onChange={(e) => setSeasonNumber(e.target.value)}
              required
              min={1}
              onInvalid={(e) => e.currentTarget.setCustomValidity(REQUIRED_MESSAGE)}
              onInput={(e) => e.currentTarget.setCustomValidity("")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="syear">Ano *</Label>
            <Input
              id="syear"
              type="number"
              value={yearReleased}
              onChange={(e) => setYearReleased(e.target.value)}
              required
              min={1900}
              max={2100}
              onInvalid={(e) => e.currentTarget.setCustomValidity(REQUIRED_YEAR_MESSAGE)}
              onInput={(e) => e.currentTarget.setCustomValidity("")}
            />
          </div>
          <Button type="submit" className="w-full">{initial ? "Salvar" : "Criar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SeasonForm;
