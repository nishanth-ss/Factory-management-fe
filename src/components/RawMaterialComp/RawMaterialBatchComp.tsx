import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useProducts } from "@/hooks/useProduct";
import { useEffect } from "react";
import { useCreateBatch, useUpdateBatch } from "@/hooks/useRawMaterialBatch";

// ---------------- Schema ----------------
const batchSchema =
  z.object({
    batch_no: z.string().min(1, "Batch number is required"),
    product_id: z.string().min(1, "Product is required"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    status: z.string().min(1, "Status is required"),
    notes: z.string().optional(),
  })

type BatchFormData = z.infer<typeof batchSchema>;
type BatchFormDataWithId = BatchFormData & { id?: string };

export function RawMaterialBatchesDialog({
  open,
  onOpenChange,
  selectedBatch,
  setSelectedBatch,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSave?: (data: BatchFormData) => void;
  selectedBatch?: BatchFormDataWithId;
  setSelectedBatch?: (batch: any) => void;
}) {
  const form = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      batch_no: "",
      product_id: "",
      start_date: "",
      end_date: "",
      status: "planned",
      notes: "",
    },
  });

  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();

  useEffect(() => {
    if (Object.keys(selectedBatch || {}).length > 0) {
        // Reset form when dialog opens — either with selectedProduct or empty values
        form.reset({
            batch_no: selectedBatch?.batch_no,
            product_id: selectedBatch?.product_id,
            start_date: selectedBatch?.start_date ? new Date(selectedBatch?.start_date).toISOString().split("T")[0] : "",
            end_date: selectedBatch?.end_date ? new Date(selectedBatch?.end_date).toISOString().split("T")[0] : "",
            status: selectedBatch?.status,
            notes: selectedBatch?.notes,
        });
    } else {
        // Creating new
        form.reset({
            batch_no: "",
            product_id: "",
            start_date: "",
            end_date: "",
            status: "planned",
            notes: "",
        });
    }
}, [selectedBatch, form]);

  const { data: products } = useProducts({});
  const productsData = products?.result || [];

  const handleSubmit = (data: BatchFormData) => {
    if (selectedBatch?.id ?? "") {
      updateBatch.mutate({ id: selectedBatch?.id ?? "", data: data }, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          setSelectedBatch && setSelectedBatch({batch_no: "", product_id: "", start_date: "", end_date: "", status: "planned", notes: ""});
        },
      });
    } else {
      createBatch.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          setSelectedBatch && setSelectedBatch({batch_no: "", product_id: "", start_date: "", end_date: "", status: "planned", notes: ""});
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { 
      onOpenChange(isOpen); 
      if (!isOpen) { 
        setSelectedBatch && setSelectedBatch({ batch_no: "", product_id: "", start_date: "", end_date: "", status: "planned", notes: ""}); 
      }
    }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Raw Material Batches</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div
              className="grid grid-cols-1 md:grid-cols-4 gap-4 border rounded-md p-4"
            >
              {/* Batch No */}
              <FormField
                control={form.control}
                name={`batch_no`}
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

              {/* Product */}
              <FormField
                control={form.control}
                name={`product_id`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productsData.map((m: any) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.product_name} ({m.product_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

                {/* Start Date */}
                <FormField
                control={form.control}
                name={`start_date`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name={`end_date`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">

              {/* notes */}
              <FormField
                control={form.control}
                name={`notes`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

                  {/* Status */}
                  {form.watch('product_id') && <FormField
                control={form.control}
                name={`status`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[
                            {id: "planned", name: "Planned"},
                            {id: "in_progress", name: "In Progress"},
                            {id: "completed", name: "Completed"},
                            {id: "QC", name: "QC"},
                        ].map((m: any) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {onOpenChange(false), setSelectedBatch && setSelectedBatch({batch_no: "", product_id: "", start_date: "", end_date: "", status: "", notes: ""})}}>
                Cancel
              </Button>
              <Button type="submit">{selectedBatch?.batch_no ? "Update Batch" : "Save Batch"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
