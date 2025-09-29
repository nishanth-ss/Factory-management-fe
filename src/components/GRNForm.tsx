import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatINR } from "@/lib/currency";
import { z } from "zod";

// ---------------------- Zod Schema ----------------------
const grnItemSchema = z.object({
  purchaseOrderItemId: z.string(),
  qty: z.number().min(0.001, "Quantity must be greater than 0"),
  costPerUnit: z.number().min(0, "Cost cannot be negative").optional(),
  batchNo: z.string().optional(),
  mfgDate: z.string().optional(),
  expDate: z.string().optional(),
  location: z.string().optional(),
  tempId: z.string().optional(),
  materialName: z.string().optional(),
  materialCode: z.string().optional(),
  uom: z.string().optional(),
  orderedQty: z.number().optional(),
  remainingQty: z.number().optional(),
  rate: z.number().optional(),
});

const createGrnFormSchema = z.object({
  grn: z.object({
    grnNo: z.string().min(1, "GRN Number is required"),
    purchaseOrderId: z.string().min(1, "Purchase Order is required"),
    notes: z.string().optional(),
    receivedBy: z.string().optional(),
  }),
  items: z.array(grnItemSchema).min(1, "At least one item is required"),
});

export type CreateGrnFormData = z.infer<typeof createGrnFormSchema>;

// ---------------------- Types ----------------------
interface GRNFormProps {
  onSubmit: () => void;
}

interface PurchaseOrder {
  id: string;
  poNo: string;
  vendorId: string;
  status: string;
  totalValue: string;
  expectedDelivery: string;
  vendor: {
    id: string;
    name: string;
  };
  items: Array<{
    id: string;
    rawMaterialId: string;
    qty: string;
    uom: string;
    rate: string;
    receivedQty: string;
    rawMaterial: {
      id: string;
      code: string;
      name: string;
      uom: string;
    };
  }>;
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
export default function GRNForm({ onSubmit }: GRNFormProps) {
  const { toast } = useToast();
  const [selectedPOId, setSelectedPOId] = useState<string>("");

  // Fetch approved POs
  const { data: approvedPOs = [] } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/purchase-orders"],
    select: (data) =>
      data.filter(
        (po) => po.status === "approved" || po.status === "partially_received"
      ),
  });

  interface User {
    id: string;
    name: string;
    email?: string;
  }
  // Fetch users
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });

  const form = useForm<CreateGrnFormData>({
    resolver: zodResolver(createGrnFormSchema),
    defaultValues: {
      grn: {
        grnNo: generateGRNNumber(),
        purchaseOrderId: "",
        notes: "",
      },
      items: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Populate items on PO selection
  useEffect(() => {
    if (selectedPOId) {
      const selectedPO = approvedPOs.find((po) => po.id === selectedPOId);
      if (selectedPO && selectedPO.items) {
        const formItems = selectedPO.items
          .filter(
            (item) => parseFloat(item.receivedQty || "0") < parseFloat(item.qty)
          )
          .map((item) => ({
            purchaseOrderItemId: item.id,
            qty: 0,
            costPerUnit: parseFloat(item.rate) || 0,
            batchNo: "",
            mfgDate: "",
            expDate: "",
            location: "",
            tempId: Math.random().toString(36).substr(2, 9),
            materialName: item.rawMaterial.name,
            materialCode: item.rawMaterial.code,
            uom: item.rawMaterial.uom,
            orderedQty: parseFloat(item.qty),
            remainingQty:
              parseFloat(item.qty) - parseFloat(item.receivedQty || "0"),
            rate: parseFloat(item.rate) || 0,
          }));
        replace(formItems);
        form.setValue("grn.purchaseOrderId", selectedPOId);
      }
    }
  }, [selectedPOId, approvedPOs, replace, form]);

  // Create GRN mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateGrnFormData) => {
      const firstUserId = users?.[0]?.id;
      if (!firstUserId) throw new Error("No users found");

      const cleanedItems = data.items.map(
        ({ tempId, materialName, materialCode, uom, orderedQty, remainingQty, rate, ...item }) => item
      );

      const payload = {
        grn: { ...data.grn, receivedBy: firstUserId },
        items: cleanedItems,
      };

      return apiRequest("POST", "/api/grns", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: "GRN created successfully",
        description: "Goods receipt note created and inventory updated.",
      });
      onSubmit();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating GRN",
        description: error.message || "Failed to create GRN.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateGrnFormData) => {
    createMutation.mutate(data);
  };

  const selectedPO = approvedPOs.find((po) => po.id === selectedPOId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* GRN Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="grn.grnNo"
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
            name="grn.purchaseOrderId"
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
                    {approvedPOs.map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.poNo} - {po.vendor.name} ({formatINR(po.totalValue)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-1">
            <FormLabel>Status</FormLabel>
            <div className="pt-2">
              <Badge variant="secondary">Receiving</Badge>
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
                  <p className="font-medium">{selectedPO.poNo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vendor:</span>
                  <p className="font-medium">{selectedPO.vendor.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Value:</span>
                  <p className="font-medium">{formatINR(selectedPO.totalValue)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected Delivery:</span>
                  <p className="font-medium">{selectedPO.expectedDelivery}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* GRN Items */}
        {fields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Items to Receive</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 border rounded-md"
                >
                  <div className="lg:col-span-2">
                    <p className="font-medium text-sm">{field.materialCode}</p>
                    <p className="text-xs text-muted-foreground">
                      {field.materialName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Remaining: {field.remainingQty} {field.uom}
                    </p>
                  </div>

                  <div className="lg:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.qty`}
                      render={({ field: qtyField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Received Qty*</FormLabel>
                          <FormControl>
                            <Input {...qtyField} type="number" step="0.001" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.costPerUnit`}
                      render={({ field: costField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Cost per Unit</FormLabel>
                          <FormControl>
                            <Input {...costField} type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.batchNo`}
                      render={({ field: batchField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Batch No*</FormLabel>
                          <FormControl>
                            <Input {...batchField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <FormField
                      control={form.control}
                      name={`items.${index}.mfgDate`}
                      render={({ field: mfgField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Mfg Date</FormLabel>
                          <FormControl>
                            <Input {...mfgField} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <FormField
                      control={form.control}
                      name={`items.${index}.expDate`}
                      render={({ field: expField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Exp Date</FormLabel>
                          <FormControl>
                            <Input {...expField} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
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
            disabled={createMutation.isPending || fields.length === 0 || !selectedPOId}
          >
            {createMutation.isPending ? "Creating..." : "Create GRN"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
