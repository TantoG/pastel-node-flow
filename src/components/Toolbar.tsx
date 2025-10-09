import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Undo2, Redo2, Send } from 'lucide-react';

interface ToolbarProps {
  testMode: boolean;
  onToggleTestMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSubmit: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const Toolbar = ({
  testMode,
  onToggleTestMode,
  onUndo,
  onRedo,
  onSubmit,
  canUndo,
  canRedo,
}: ToolbarProps) => {
  return (
    <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggleTestMode}
          className="gap-2"
        >
          {testMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {testMode ? 'Modo Estudiante' : 'Modo Test'}
        </Button>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="gap-2"
        >
          <Undo2 className="w-4 h-4" />
          Deshacer
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="gap-2"
        >
          <Redo2 className="w-4 h-4" />
          Rehacer
        </Button>
      </div>

      <div className="flex-1" />

      <Button
        onClick={onSubmit}
        size="sm"
        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Send className="w-4 h-4" />
        Entregar
      </Button>

      <div className="text-xs text-muted-foreground">
        Pan: Alt+Arrastrar | Zoom: Rueda del ratón
      </div>
    </div>
  );
};
