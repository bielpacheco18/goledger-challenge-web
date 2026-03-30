import { TvShow } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Tv } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  show: TvShow;
  onEdit: (show: TvShow) => void;
  onDelete: (show: TvShow) => void;
}

const TvShowCard = ({ show, onEdit, onDelete }: Props) => {
  const showName = show.name || "Série sem nome";

  return (
    <Card className="group overflow-hidden transition-all hover:ring-2 hover:ring-primary/50">
      <Link to={`/shows/${encodeURIComponent(show["@key"])}`}>
        <div className="flex h-48 items-center justify-center bg-accent">
          <Tv className="h-16 w-16 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
      </Link>
      <CardContent className="p-4">
        <Link to={`/shows/${encodeURIComponent(show["@key"])}`}>
          <h3 className="font-bold text-lg leading-tight hover:text-primary transition-colors truncate">
            {showName}
          </h3>
        </Link>
        {show.genre && (
          <span className="mt-1 inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
            {show.genre}
          </span>
        )}
        {show.yearReleased && (
          <p className="mt-1 text-xs text-muted-foreground">{show.yearReleased}</p>
        )}
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(show)} className="h-8 px-2">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(show)} className="h-8 px-2 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TvShowCard;
