import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DynamicDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: React.ReactNode;
    value: string;
    setValue: (value: string) => void;
    extraField?: React.ReactNode;
    onCancel?: () => void;
    onSubmit?: () => void;
    isPending?: boolean;
    statusConfig?: any;
    submitLabel?: string;
    cancelLabel?: string;
}

const StatusDialog: React.FC<DynamicDialogProps> = ({
    open,
    onOpenChange,
    title,
    description,
    value,
    setValue,
    extraField,
    onCancel,
    onSubmit,
    isPending = false,
    statusConfig,
    submitLabel = "Save",
    cancelLabel = "Cancel",
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {description && <div className="text-sm text-muted-foreground">{description}</div>}
                    {extraField}
                    <Select
                        value={value}
                        onValueChange={(value) => setValue(value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {
                                statusConfig ? statusConfig.map((status: any) => (
                                    <SelectItem key={status.value} value={status.value}>
                                        {status.label}
                                    </SelectItem>
                                )) : <>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </>
                            }

                        </SelectContent>
                    </Select>

                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={onCancel ? onCancel : () => onOpenChange(false)}
                            disabled={isPending}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            onClick={onSubmit}
                            disabled={isPending}
                        >
                            {isPending ? "Saving..." : submitLabel}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default StatusDialog;
