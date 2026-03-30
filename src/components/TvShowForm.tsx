import { useState } from "react";
import { TvShow } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const REQUIRED_MESSAGE = "Preencha este campo obrigatório antes de continuar.";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description: string;
    yearReleased: number | undefined;
    recommendedAge: number | undefined;
  }) => void;
  initial?: TvShow | null;
}

const TvShowForm = ({ open, onOpenChange, onSubmit, initial }: Props) => {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [yearReleased, setYearReleased] = useState(initial?.yearReleased?.toString() || "");
  const [recommendedAge, setRecommendedAge] = useState(initial?.recommendedAge?.toString() || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      yearReleased: yearReleased ? parseInt(yearReleased) : undefined,
      recommendedAge: recommendedAge ? parseInt(recommendedAge) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Série" : "Nova Série"}</DialogTitle>
          <DialogDescription>
            Preencha os dados principais da série para criar ou atualizar o registro.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Campos marcados com <strong>*</strong> são obrigatórios para a API aceitar o cadastro.
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              onInvalid={(e) => e.currentTarget.setCustomValidity(REQUIRED_MESSAGE)}
              onInput={(e) => e.currentTarget.setCustomValidity("")}
            />
            <p className="text-xs text-muted-foreground">Informe o nome principal exibido no catálogo.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Ano de Lançamento</Label>
            <Input id="year" type="number" value={yearReleased} onChange={(e) => setYearReleased(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recommendedAge">Idade Recomendada *</Label>
            <Input
              id="recommendedAge"
              type="number"
              value={recommendedAge}
              onChange={(e) => setRecommendedAge(e.target.value)}
              required
              min={0}
              onInvalid={(e) => e.currentTarget.setCustomValidity("Informe a idade recomendada para esta série.")}
              onInput={(e) => e.currentTarget.setCustomValidity("")}
            />
            <p className="text-xs text-muted-foreground">Exemplo: 10, 12, 14, 16 ou 18.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Descrição *</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              onInvalid={(e) => e.currentTarget.setCustomValidity("Escreva uma descrição para a série.")}
              onInput={(e) => e.currentTarget.setCustomValidity("")}
            />
            <p className="text-xs text-muted-foreground">Resumo curto usado para identificar a série no cadastro.</p>
          </div>
          <Button type="submit" className="w-full">{initial ? "Salvar" : "Criar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TvShowForm;
