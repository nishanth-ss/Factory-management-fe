import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ---------------- Schema ----------------
const batchSchema = z.object({
  batches: z
    .array(
      z.object({
        batch_no: z.string().min(1, "Batch number is required"),
        material: z.string().min(1, "Material is required"),
        qty_received: z.number().min(0.01, "Quantity must be greater than 0"),
        cost_per_unit: z.number().min(0, "Cost per unit must be >= 0"),
        mfg_date: z.string().min(1, "Manufacturing date is required"),
        exp_date: z.string().min(1, "Expiry date is required"),
        location: z.string().min(1, "Location is required"),
      })
    )
    .min(1, "At least one batch is required"),
});

type BatchFormData = z.infer<typeof batchSchema>;

export function RawMaterialBatchesDialog({
  open,
  onOpenChange,
  onSave,
  materials,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSave: (data: BatchFormData["batches"]) => void;
  materials: { id: string; name: string; code: string }[];
}) {
  const form = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      batches: [
        {
          batch_no: "",
          material: "",
          qty_received: 0,
          cost_per_unit: 0,
          mfg_date: "",
          exp_date: "",
          location: "",
        },
      ],
    },
  });

  const addBatch = () => {
    const batches = form.getValues("batches");
    form.setValue("batches", [
      ...batches,
      {
        batch_no: "",
        material: "",
        qty_received: 0,
        cost_per_unit: 0,
        mfg_date: "",
        exp_date: "",
        location: "",
      },
    ]);
  };

  const removeBatch = (index: number) => {
    const batches = form.getValues("batches");
    if (batches.length > 1) {
      form.setValue(
        "batches",
        batches.filter((_, i) => i !== index)
      );
    }
  };

  const handleSubmit = (data: BatchFormData) => {
    onSave(data.batches);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Raw Material Batches</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {form.watch("batches").map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 border rounded-md p-4"
              >
                {/* Batch No */}
                <FormField
                  control={form.control}
                  name={`batches.${index}.batch_no`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch No</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="BATCH-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Material */}
                <FormField
                  control={form.control}
                  name={`batches.${index}.material`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {materials.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} ({m.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Qty Received */}
                <FormField
                  control={form.control}
                  name={`batches.${index}.qty_received`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qty Received</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? "" : parseFloat(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cost Per Unit */}
                <FormField
                  control={form.control}
                  name={`batches.${index}.cost_per_unit`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Per Unit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? "" : parseFloat(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mfg Date */}
                <FormField
                  control={form.control}
                  name={`batches.${index}.mfg_date`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mfg Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Exp Date */}
                <FormField
                  control={form.control}
                  name={`batches.${index}.exp_date`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exp Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location */}
                <FormField
                  control={form.control}
                  name={`batches.${index}.location`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Warehouse A" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Remove Button */}
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeBatch(index)}
                    disabled={form.watch("batches").length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Add Batch */}
            <Button type="button" variant="outline" onClick={addBatch}>
              <Plus className="h-4 w-4 mr-2" /> Add Batch
            </Button>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Batches</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
