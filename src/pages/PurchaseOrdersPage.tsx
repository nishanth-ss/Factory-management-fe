import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/currency";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const insertPurchaseOrderSchema = z.object({
  poNo: z.string().min(1, "PO Number is required"),
  vendorId: z.string().uuid("Invalid vendor ID"),
  status: z.enum(["draft", "submitted", "approved", "partially_received", "closed"]).optional(),
  totalValue: z.number().min(0, "Total value cannot be negative").optional(),
  expectedDelivery: z.string().optional(), // ISO date string from form
});

// Schema for purchase order item
const insertPurchaseOrderItemSchema = z.object({
  rawMaterialId: z.string().min(1, "Material is required"),
  qty: z.number().positive("Quantity must be greater than 0"),
  rate: z.number().min(0, "Rate cannot be negative"),
  uom: z.string().optional(),
  tempId: z.string().optional(), // Temporary field for frontend management
});

// ------------------- COMBINED FORM SCHEMA -------------------

const createPurchaseOrderFormSchema = z.object({
  purchaseOrder: insertPurchaseOrderSchema.omit({ status: true }), // client sets status separately if needed
  items: z.array(insertPurchaseOrderItemSchema).min(1, "At least one item is required"),
});

export type CreatePurchaseOrderFormData = z.infer<typeof createPurchaseOrderFormSchema>;

const purchaseOrderColumns = [
  { key: "poNo", header: "PO Number", sortable: true },
  { key: "vendorName", header: "Vendor", sortable: true },
  { 
    key: "status", 
    header: "Status", 
    sortable: true,
    render: (status: string) => <StatusBadge status={status as any} size="sm" />
  },
  { 
    key: "totalValue", 
    header: "Total Value", 
    sortable: true,
    render: (value: any) => formatINR(String(value ?? 0))
  },
  { key: "expectedDelivery", header: "Expected Delivery", sortable: true },
  { 
    key: "createdAt", 
    header: "Created Date", 
    sortable: true,
    render: (date: string) => new Date(date).toLocaleDateString('en-IN')
  },
  {
    key: "actions",
    header: "Actions",
    render: (_value: any, row: any) => (
      <div className="flex gap-1">
        <Button variant="outline" size="sm" data-testid={`button-view-${row.id}`}>
          <Eye className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="sm" data-testid={`button-edit-${row.id}`}>
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    )
  },
];

const purchaseOrderItemColumns = [
  { key: "poNo", header: "PO Number", sortable: true },
  { key: "materialCode", header: "Material Code", sortable: true },
  { key: "materialName", header: "Material Name", sortable: true },
  { 
    key: "qty", 
    header: "Ordered Qty", 
    sortable: true,
    render: (qty: any, row: any) => `${qty} ${row.uom || ''}`
  },
  { 
    key: "rate", 
    header: "Rate", 
    sortable: true,
    render: (rate: any) => rate != null ? formatINR(String(rate)) : '-'
  },
  { 
    key: "receivedQty", 
    header: "Received Qty", 
    sortable: true,
    render: (qty: number, row: any) => `${qty} ${row.uom || ''}`
  },
  { 
    key: "value", 
    header: "Line Value", 
    sortable: true,
    render: (_value: any, row: any) => {
      const qty = Number(row.qty ?? 0);
      const rate = Number(row.rate ?? 0);
      return formatINR(String(qty * rate));
    }
  },
];

export default function PurchaseOrdersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "items">("orders");
  const { toast } = useToast();

  const { data: purchaseOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/purchase-orders"],
  });

  const { data: vendors = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: materials = [] } = useQuery<any[]>({
    queryKey: ["/api/raw-materials"],
  });

  // Generate unique PO number
  const generatePONumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `PO${year}${month}${seq}`;
  };

  const form = useForm<CreatePurchaseOrderFormData>({
    resolver: zodResolver(createPurchaseOrderFormSchema),
    defaultValues: {
      purchaseOrder: {
        poNo: generatePONumber(),
        vendorId: "",
        totalValue: 0,
        expectedDelivery: "",
      },
      items: [{
        rawMaterialId: "",
        qty: 0,
        uom: "",
        rate: 0,
        tempId: crypto.randomUUID(),
      }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchedItems = form.watch("items");

  // Calculate total value automatically
  const calculateTotal = () => {
    const total = watchedItems.reduce((sum, item) => {
      const qty = Number(item.qty || 0);
      const rate = Number(item.rate || 0);
      return sum + (qty * rate);
    }, 0);
    form.setValue("purchaseOrder.totalValue", total);
    return total;
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreatePurchaseOrderFormData) => {
      console.log("Submitting PO data:", data);
      
      // Get users to find a valid user ID
      const usersResponse = await apiRequest("GET", "/api/users").then(res => res.json());
      console.log("Users response:", usersResponse);
      
      if (!usersResponse || usersResponse.length === 0) {
        throw new Error("No users found in the system");
      }
      
      const firstUserId = usersResponse[0].id;
      console.log("Using user ID:", firstUserId);
      
      const cleanedItems = data.items.map(({ tempId, ...item }) => item);
      // Add createdBy field with dynamic user ID
      const purchaseOrderData = {
        ...data.purchaseOrder,
        createdBy: firstUserId
      };
      
      const payload = {
        purchaseOrder: purchaseOrderData,
        items: cleanedItems
      };
      
      console.log("Final payload:", payload);
      return apiRequest("POST", "/api/purchase-orders", payload).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: "Purchase Order created successfully",
        description: "The purchase order has been created and can now be processed.",
      });
      setIsCreateDialogOpen(false);
      form.reset({
        purchaseOrder: {
          poNo: generatePONumber(),
          vendorId: "",
          totalValue: 0,
          expectedDelivery: "",
        },
        items: [{
          rawMaterialId: "",
          qty: 0,
          uom: "",
          rate: 0,
          tempId: crypto.randomUUID(),
        }]
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating purchase order",
        description: error?.message || "Failed to create purchase order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatePurchaseOrderFormData) => {
    console.log("Form submitted!", data);
    createMutation.mutate(data);
  };

  const onError = (errors: any) => {
    console.log("Form validation errors:", errors);
    toast({
      title: "Form validation failed",
      description: "Please check all required fields and try again.",
      variant: "destructive",
    });
  };

  // Enrich purchase orders with vendor names
  const enrichedOrders = purchaseOrders.map((po: any) => {
    const vendor = vendors.find((v: any) => v.id === po.vendorId);
    return {
      ...po,
      vendorName: vendor?.name || 'Unknown Vendor'
    };
  });

  // Get all purchase order items with enriched data
  const allPOItems: any[] = [];
  purchaseOrders.forEach((_po: any) => {
    // Note: In real implementation, you'd fetch PO items from separate endpoint
    // For now, showing structure for when items are available
  });

  return (
    <div className="space-y-6" data-testid="page-purchase-orders">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage purchase orders and procurement</p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex border rounded-lg p-1">
            <Button
              variant={activeTab === "orders" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("orders")}
              data-testid="tab-orders"
            >
              Purchase Orders
            </Button>
            <Button
              variant={activeTab === "items" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("items")}
              data-testid="tab-items"
            >
              Order Items
            </Button>
          </div>
          
          {activeTab === "orders" && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-purchase-order">
                  <Plus className="h-4 w-4 mr-2" />
                  Create PO
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Purchase Order</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                    {/* Header Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                      <FormField
                        control={form.control}
                        name="purchaseOrder.poNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PO Number*</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="Auto-generated"
                                readOnly
                                data-testid="input-po-number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="purchaseOrder.vendorId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vendor*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-vendor">
                                  <SelectValue placeholder="Select vendor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {vendors.map((vendor) => (
                                  <SelectItem key={vendor.id} value={vendor.id}>
                                    {vendor.name}
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
                        name="purchaseOrder.expectedDelivery"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected Delivery</FormLabel>
                            <FormControl>
                              <Input 
                                type="date"
                                value={field.value || ""}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                                data-testid="input-expected-delivery"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Line Items */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Order Items</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append({
                            rawMaterialId: "",
                            qty: 0,
                            uom: "",
                            rate: 0,
                            tempId: crypto.randomUUID(),
                          })}
                          data-testid="button-add-item"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>

                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Material*</TableHead>
                              <TableHead>Quantity*</TableHead>
                              <TableHead>UOM</TableHead>
                              <TableHead>Rate*</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fields.map((field, index) => {
                              const selectedMaterial = materials.find(m => m.id === watchedItems[index]?.rawMaterialId);
                              const qty = Number(watchedItems[index]?.qty || 0);
                              const rate = Number(watchedItems[index]?.rate || 0);
                              const amount = qty * rate;
                              
                              return (
                                <TableRow key={field.tempId}>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`items.${index}.rawMaterialId`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <Select 
                                            onValueChange={(value) => {
                                              field.onChange(value);
                                              const material = materials.find(m => m.id === value);
                                              if (material) {
                                                form.setValue(`items.${index}.uom`, material.uom);
                                              }
                                            }} 
                                            defaultValue={field.value || ""}
                                          >
                                            <FormControl>
                                              <SelectTrigger data-testid={`select-material-${index}`}>
                                                <SelectValue placeholder="Select material" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              {materials.map((material) => (
                                                <SelectItem key={material.id} value={material.id}>
                                                  {material.code} - {material.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </TableCell>
                                  
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`items.${index}.qty`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input 
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              placeholder="0"
                                              value={field.value ?? ""}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                field.onChange(val === "" ? 0 : parseFloat(val));
                                                setTimeout(calculateTotal, 0);
                                              }}
                                              onBlur={field.onBlur}
                                              name={field.name}
                                              ref={field.ref}
                                              data-testid={`input-qty-${index}`}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </TableCell>
                                  
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`items.${index}.uom`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input 
                                              value={selectedMaterial?.uom || field.value || ""}
                                              onChange={field.onChange}
                                              onBlur={field.onBlur}
                                              name={field.name}
                                              ref={field.ref}
                                              placeholder="Unit"
                                              readOnly={!!selectedMaterial}
                                              data-testid={`input-uom-${index}`}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </TableCell>
                                  
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`items.${index}.rate`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input 
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                              value={field.value || ""}
                                              onChange={(e) => {
                                                field.onChange(e.target.value);
                                                setTimeout(calculateTotal, 0);
                                              }}
                                              onBlur={field.onBlur}
                                              name={field.name}
                                              ref={field.ref}
                                              data-testid={`input-rate-${index}`}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </TableCell>
                                  
                                  <TableCell>
                                    <div className="font-medium" data-testid={`text-amount-${index}`}>
                                      {formatINR(amount.toString())}
                                    </div>
                                  </TableCell>
                                  
                                  <TableCell>
                                    {fields.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          remove(index);
                                          setTimeout(calculateTotal, 0);
                                        }}
                                        data-testid={`button-remove-item-${index}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2 p-4 border rounded-lg">
                        <div className="flex justify-between">
                          <span>Total Items:</span>
                          <span data-testid="text-total-items">{fields.length}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total Value:</span>
                          <span data-testid="text-total-value">
                            {formatINR(calculateTotal().toString())}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel-po"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending}
                        data-testid="button-save-po"
                      >
                        {createMutation.isPending ? "Creating..." : "Create Purchase Order"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {activeTab === "orders" && (
        <DataTable 
          title="Purchase Orders"
          columns={purchaseOrderColumns}
          data={enrichedOrders}
          searchable={true}
          exportable={true}
        />
      )}

      {activeTab === "items" && (
        <DataTable 
          title="Purchase Order Items"
          columns={purchaseOrderItemColumns}
          data={allPOItems}
          searchable={true}
          exportable={true}
        />
      )}
    </div>
  );
}