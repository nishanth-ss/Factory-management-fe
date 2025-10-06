import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ReactNode } from "react";

interface ViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleClose?: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;   // optional override for width
  maxHeight?: string;  // optional override for height
}

export function ViewDialog({
  open,
  onOpenChange,
  handleClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-4xl",
  maxHeight = "max-h-[90vh]",
}: ViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={handleClose ? handleClose : onOpenChange}>
      <DialogContent className={`${maxWidth} ${maxHeight} overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>
            {title} {subtitle && <span className="text-muted-foreground">- {subtitle}</span>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
