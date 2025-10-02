import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrder";
import type { PurchaseOrder } from "@/types/purchaseType";
import { useCreateGrn } from "@/hooks/useGrn";
import type { GrnCreatePayload } from "@/types/grn";
import { formatINR } from "@/lib/currency";

const createGrnFormSchema = z.object({
  grn: z.object({
    grn_no: z.string().min(1, "GRN Number is required"),
    purchase_order_id: z.string().min(1, "Purchase Order is required"),
    gate_pass_number: z.string().min(1, "Gate Pass Number is required"),
    notes: z.string().optional(),
    received_by: z.string().optional(),
  }),
});

export type CreateGrnFormData = z.infer<typeof createGrnFormSchema>;

// ---------------------- Types ----------------------
interface GRNFormProps {
  onSubmit: () => void;
  setIsCreateDialogOpen: (open: boolean) => void;
}

// ---------------------- Helper ----------------------
const generateGRNNumber = () => {
  const today = new Date();
  const dateStr =
    today.getFullYear().toString().slice(-2) +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");
  const randomSuffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `GRN${dateStr}${randomSuffix}`;
};

// ---------------------- Component ----------------------
export default function GRNForm({ onSubmit, setIsCreateDialogOpen }: GRNFormProps) {
  const [selectedPOId, setSelectedPOId] = useState<string>("");
  const createGrnMutation = useCreateGrn();

  const { data: poResponse } = usePurchaseOrders();
  const approvedPOsData: PurchaseOrder[] = poResponse?.data ?? [];
  const vendorResponse = useSelector((state: RootState) => state.manufacturing.vendorResponse?.data);

  const form = useForm<CreateGrnFormData>({
    resolver: zodResolver(createGrnFormSchema),
    defaultValues: {
      grn: {
        grn_no: generateGRNNumber(),
        purchase_order_id: "",
        gate_pass_number: "",
        notes: "",
        received_by: "",
      },
    },
  });

  const handleSubmit = (data: CreateGrnFormData) => {
    if (!selectedPO) return; // safety guard; submit button is disabled until PO selected
    const payload: GrnCreatePayload = {
      ...data.grn,
      po_no: selectedPO.po_no,
    };
    createGrnMutation.mutate(payload,{
      onSuccess: () => {
        setIsCreateDialogOpen(false);
      }
    });
  };

  const selectedPO = approvedPOsData.find((po) => po.id === selectedPOId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* GRN Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="grn.grn_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GRN Number*</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="grn.purchase_order_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Order*</FormLabel>
                <Select
                  value={selectedPOId}
                  onValueChange={(value) => {
                    setSelectedPOId(value);
                    field.onChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PO" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {approvedPOsData.map((po) => {
                      const vendorName = vendorResponse?.find((v: any) => v.id === (po as any).vendor_id)?.name || "Vendor";
                      return (
                        <SelectItem key={po.id} value={po.id as string}>
                          {po.po_no} - {vendorName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="grn.gate_pass_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gate Pass Number*</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-1">
            <FormLabel>Status</FormLabel>
            <div className="pt-2">
              <Badge variant="secondary">{selectedPO?.status}</Badge>
            </div>
          </div>
        </div>

        {/* PO Details */}
        {selectedPO && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Purchase Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">PO Number:</span>
                  <p className="font-medium">{selectedPO.po_no}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vendor:</span>
                  <p className="font-medium">{vendorResponse?.find((v: any) => v.id === (selectedPO as any).vendor_id)?.name || "Vendor"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Value:</span>
                  <p className="font-medium">{formatINR(selectedPO.total_value)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected Delivery:</span>
                  <p className="font-medium">{selectedPO.expected_delivery}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name="grn.notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Additional notes..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onSubmit}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createGrnMutation.isPending || !selectedPOId}
          >
            {createGrnMutation.isPending ? "Creating..." : "Create GRN"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
