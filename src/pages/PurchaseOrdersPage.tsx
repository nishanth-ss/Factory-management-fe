import { useEffect, useState } from "react";
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
import { z } from "zod";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { usePurchaseOrders, useCreatePurchaseOrder, useUpdatePurchaseOrder } from "@/hooks/usePurchaseOrder";
import { useDebounce } from "@/hooks/useDebounce";
import FormattedDate from "@/lib/formatDate";
import { getRoleIdFromAuth } from "@/lib/utils";
import { useGetIndentById, useIndents } from "@/hooks/useIndent";

const insertPurchaseOrderSchema = z.object({
  po_no: z.string().min(1, "PO Number is required"),
  vendor_id: z.string().uuid("Invalid vendor ID"),
  indent_id: z.string().min(1, "Indent Number is required"),
  status: z.enum(["draft", "submitted", "approved", "partially_received", "closed"]).optional(),
  total_value: z.number().min(0, "Total value cannot be negative").optional(),
  expected_delivery: z.string().optional(), // ISO date string from form
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

// Columns for items kept outside; order columns will be defined inside component where handlers are accessible

const purchaseOrderItemColumns = [
  { key: "po_no", header: "PO Number", sortable: true },
  { key: "material_code", header: "Material Code", sortable: true },
  { key: "material_name", header: "Material Name", sortable: true },
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
    key: "received_qty",
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
  }
];

export default function PurchaseOrdersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "items">("orders");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const state = useSelector((state: RootState) => state.manufacturing);
  const vendorResponse = state?.vendorResponse?.data;
  const rawMaterialResponse = state?.rawMaterialResponse?.data;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const { data: purchaseOrdersResponse } = usePurchaseOrders({ page, limit: rowsPerPage, search: debouncedSearch });
  const purchaseOrders = Array.isArray(purchaseOrdersResponse?.data) ? purchaseOrdersResponse?.data : [];
  const totalRecords = purchaseOrdersResponse?.total ?? 0;

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
        po_no: generatePONumber(),
        vendor_id: "",
        indent_id: "",
        total_value: 0,
        expected_delivery: "",
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

  const {data: indentData} : any = useGetIndentById(form.watch("purchaseOrder.indent_id"));

  useEffect(() => {
    if (indentData?.data?.items) {
      const mapped = indentData.data.items.map((item: any) => ({
        rawMaterialId: item.raw_material_id,
        uom: item.uom,
        qty: item.qty,
        rate: item.rate,
        tempId: crypto.randomUUID(),
      }));
  
      form.setValue("items", mapped, { shouldDirty: true, shouldValidate: true });
      // optional: recalc total after items update
      setTimeout(() => {
        form.reset({
          ...form.getValues(), // keeps purchaseOrder fields (incl. indent_id)
          items: mapped,
        });
        
      }, 0);
    }
  }, [indentData]);

  // Calculate total value automatically
  const calculateTotal = () => {
    const total = watchedItems.reduce((sum, item) => {
      const qty = Number(item.qty || 0);
      const rate = Number(item.rate || 0);
      return sum + (qty * rate);
    }, 0);
    form.setValue("purchaseOrder.total_value", total);
    return total;
  };

  const createMutation = useCreatePurchaseOrder();
  const statusUpdateMutation = useUpdatePurchaseOrder();
  const roleId = getRoleIdFromAuth();
  const { data: indentApiResponse } = useIndents();
  const indents = indentApiResponse?.data?.indents;

  const onSubmit = (data: any) => {
    // Shape payload according to PurchaseOrder type used by useCreatePurchaseOrder
    const cleanedItems = (data.items as any[]).map(({ tempId, ...item }) => ({
      raw_material_id: item.rawMaterialId,
      qty: Number(item.qty || 0),
      uom: item.uom || "",
      rate: Number(item.rate || 0),
    }));

    const payload = {
      po_no: data.purchaseOrder.po_no,
      vendor_id: data.purchaseOrder.vendor_id,
      expected_delivery: data.purchaseOrder.expected_delivery || "",
      indent_id: data.purchaseOrder.indent_id,
      items: cleanedItems,
    };

    createMutation.mutate(payload as any, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        form.reset({
          purchaseOrder: {
            po_no: generatePONumber(),
            vendor_id: "",
            total_value: 0,
            expected_delivery: "",
          },
          items: [{
            rawMaterialId: "",
            qty: 0,
            uom: "",
            rate: 0,
            tempId: crypto.randomUUID(),
          }]
        });
        setIsCreateDialogOpen(false);
      }
    });
  };

  // Enrich purchase orders with vendor names
  const enrichedOrders = purchaseOrders.map((po: any) => {
    const vendor = vendorResponse?.find((v: any) => v.id === po.vendorId);
    return {
      ...po,
      vendorName: vendor?.name || 'Unknown Vendor'
    };
  });

  const handleUpdateStatus = (rowData: any) => {
    setSelectedPO(rowData);
    setNewStatus(rowData.status);
    setIsEditDialogOpen(true);
  };

  const purchaseOrderColumns = [
    { key: "po_no", header: "PO Number", sortable: true },
    { key: "indent_no", header: "Indent Number", sortable: true },
    { key: "vendor_name", header: "Vendor", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (status: string) => <StatusBadge status={status as any} size="sm" />
    },
    {
      key: "total_value",
      header: "Total Value",
      sortable: true,
      render: (value: any) => formatINR(String(value ?? 0))
    },
    { key: "expected_delivery", header: "Expected Delivery", sortable: true, render: (date: string) => <FormattedDate date={date} /> },
    {
      key: "created_at",
      header: "Created Date",
      sortable: true,
      render: (date: string) => <FormattedDate date={date} />
    },
    {
      key: "actions",
      header: "Actions",
      render: (_value: any, row: any) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" data-testid={`button-view-${row.id}`}>
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid={`button-edit-${row.id}`}
            title="Update Status"
            onClick={() => handleUpdateStatus(row)}
            disabled={roleId !== 1}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )
    },
  ];

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
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Header Details */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <FormField
                        control={form.control}
                        name="purchaseOrder.po_no"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PO Number*</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Auto-generated"
                                data-testid="input-po-number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="purchaseOrder.vendor_id"
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
                                {vendorResponse?.map((vendor) => (
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
                        name="purchaseOrder.indent_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Indent Number</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-indent">
                                  <SelectValue placeholder="Select indent" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {indents?.map((indent: any) => (
                                  <SelectItem key={indent.id} value={String(indent.id)}>
                                    {indent.indent_no}
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
                        name="purchaseOrder.expected_delivery"
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
                              const selectedMaterial = rawMaterialResponse?.find((m: any) => m.id === watchedItems[index]?.rawMaterialId);
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
                                              const material = rawMaterialResponse?.find((m: any) => m.id === value);
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
                                              {rawMaterialResponse?.map((material: any) => (
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
                                              value={typeof field.value === "number" ? field.value : (field.value as any) || ""}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                field.onChange(val === "" ? 0 : parseFloat(val));
                                                setTimeout(calculateTotal, 0);
                                              }}
                                              onBlur={field.onBlur}
                                              name={field.name}
                                              ref={field.ref}
                                              data-testid={`input-qty-${index}`}
                                              onWheel={(e) => e.currentTarget.blur()}
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
                                              value={typeof field.value === "string" ? parseFloat(field.value) : (typeof field.value === "number" ? field.value : (field.value as any) || "")}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                field.onChange(val === "" ? 0 : parseFloat(val));
                                                setTimeout(calculateTotal, 0);
                                              }}

                                              name={field.name}
                                              ref={field.ref}
                                              data-testid={`input-rate-${index}`}
                                              onWheel={(e) => e.currentTarget.blur()}
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
          pagination={true}
          rowsPerPage={rowsPerPage}
          totalRecords={totalRecords}
          currentPage={page}
          onPageChange={(newPage) => {
            setPage(newPage);
          }}
          search={search}
          onSearch={(term) => {
            setSearch(term);
          }}
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

      {/* Edit Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Status - {selectedPO?.po_no}</DialogTitle>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Current Status: <StatusBadge status={selectedPO.status || "draft"} size="sm" />
                </p>
                <div>
                  <label htmlFor="status" className="text-sm font-medium">
                    New Status
                  </label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="partially_received">Partially Received</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={statusUpdateMutation.isPending}
                  data-testid="button-cancel-status"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => statusUpdateMutation.mutate({ id: selectedPO.id, status: newStatus },
                    {
                      onSuccess: () => {
                        setIsEditDialogOpen(false);
                      },
                    }
                  )}
                  disabled={statusUpdateMutation.isPending || newStatus === selectedPO.status}
                  data-testid="button-save-status"
                >
                  {statusUpdateMutation.isPending ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}