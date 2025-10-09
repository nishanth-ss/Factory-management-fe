import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateIndent, useUpdateIndent } from "@/hooks/useIndent";
import { getRoleIdFromAuth } from "@/lib/utils";
import { useRawMaterialBatches } from "@/hooks/useRawMaterialBatch";
import type { IndentType } from "@/types/indent";
import { useEffect } from "react";

const indentSchema = z.object({
  indent_no: z.string().min(1, "Indent number is required"),
  batch_no: z.string().min(1, "Batch number is required"),
  required_by: z.string().min(1, "Required by date is required"),
  priority: z.enum(["low", "medium", "high"]),
  notes: z.string().optional(),
  status: z.enum(["draft", "pending", "submitted", "approved", "rejected", "in-progress", "in_process", "completed", "planned", "qc", "released", "partially_received", "closed"]),
});

type IndentFormData = z.infer<typeof indentSchema>;

export default function IndentForm({ setIsCreateDialogOpen, selectedIndent }: { setIsCreateDialogOpen: (value: boolean) => void, selectedIndent?: IndentType }) {
  const createIndent = useCreateIndent();
  const updateIndent = useUpdateIndent();
  const { data: batches } = useRawMaterialBatches({ page: 1, limit: 1000, search: "" });
  const batchesData = batches?.data || [];

  const form = useForm<IndentFormData>({
    resolver: zodResolver(indentSchema),
    defaultValues: {
      indent_no: "",
      batch_no: "",
      required_by: "",
      priority: "medium",
      notes: "",
      status: "draft",
    },
  });

  useEffect(() => {
    if (!selectedIndent) {
      form.reset({
        indent_no: "",
        batch_no: "",
        required_by: "",
        priority: "medium",
        notes: "",
        status: "draft",
      });
      return;
    }

    // Single reset to avoid overwriting values set by setValue
    form.reset({
      indent_no: selectedIndent.indent_no ?? "",
      batch_no: selectedIndent.batch_no ?? "",
      required_by: selectedIndent.required_by
        ? new Date(selectedIndent.required_by).toISOString().split("T")[0]
        : "",
      priority: (selectedIndent.priority ? String(selectedIndent.priority).toLowerCase() : "medium") as any,
      notes: selectedIndent.notes ?? "",
      status: (selectedIndent.status ? String(selectedIndent.status).toLowerCase() : "draft") as any,
    });
  }, [selectedIndent, form]);

  // Ensure batch_no shows selected value once options are loaded (no full reset)
  useEffect(() => {
    if (!selectedIndent) return;
    const current = form.getValues("batch_no");
    if ((!current || current === "") && (selectedIndent.batch_no ?? "") !== "" && (batchesData?.length ?? 0) > 0) {
      form.setValue("batch_no", selectedIndent.batch_no as any, { shouldDirty: false, shouldValidate: false });
    }
  }, [batchesData, selectedIndent]);

  const handleSubmit = (data: IndentFormData) => {
    if (selectedIndent) {
      updateIndent.mutate({ id: selectedIndent.id ?? "", data: { ...data} }, {
        onSuccess: () => {
          form.reset();
          setIsCreateDialogOpen(false);
        },
      });
    } else {
      createIndent.mutate({...data, status: "approved" }, {
        onSuccess: () => {
          form.reset();
          setIsCreateDialogOpen(false);
        },
      });
    }
  };

  const handleDraft = (data: IndentFormData) => {
    createIndent.mutate({ ...data, status: "draft" }, {
      onSuccess: () => {
        form.reset();
        setIsCreateDialogOpen(false);
      },
    });
  };

  return (
    <Card data-testid="form-indent">
      <CardContent className="py-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="indent_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block pb-1">Indent Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="IND-001" data-testid="input-indent-no" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="batch_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Number</FormLabel>
                    <Select key={`batch-${field.value ?? ""}`} value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batchesData?.map((batch: any) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.batch_no}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="required_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block pb-1">Required By</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-required-by" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block pb-1">Priority</FormLabel>
                    <Select key={`priority-${field.value ?? ""}`} onValueChange={field.onChange} value={field.value ?? "medium"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />


              {/* Status */}
              {getRoleIdFromAuth() === 1 && <FormField
                control={form.control}
                name={`status`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select key={`status-${field.value}`} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[
                          { id: "draft", name: "Draft" },
                          { id: "pending", name: "Pending" },
                          { id: "submitted", name: "Submitted" },
                          { id: "approved", name: "Approved" },
                          { id: "rejected", name: "Rejected" },
                          { id: "in-progress", name: "In Progress" },
                          { id: "in_process", name: "In Process" },
                          { id: "completed", name: "Completed" },
                          { id: "planned", name: "Planned" },
                          { id: "qc", name: "QC" },
                          { id: "released", name: "Released" },
                          { id: "partially_received", name: "Partially Received" },
                          { id: "closed", name: "Closed" },
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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block pb-1">Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Any additional requirements or notes..." data-testid="textarea-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDraft(form.getValues())}
                data-testid="button-save-draft"
              >
                Save as Draft
              </Button>
             {getRoleIdFromAuth() === 1 && <Button type="submit" data-testid="button-submit">
                Submit for Approval
              </Button>}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}