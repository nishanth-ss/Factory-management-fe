import { useState } from "react";
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
import { usePurchaseOrders, useCreatePurchaseOrder, useUpdatePurchaseOrder } from "@/hooks/usePurchaseOrder";
import { useDebounce } from "@/hooks/useDebounce";
import FormattedDate from "@/lib/formatDate";
import { getRoleIdFromAuth } from "@/lib/utils";
import { useVendors } from "@/hooks/useVendor";
import { useRawMaterials } from "@/hooks/useRawMaterial";

const insertPurchaseOrderSchema = z.object({
  po_no: z.string().min(1, "PO Number is required"),
  vendor_id: z.string().uuid("Invalid vendor ID"),
  status: z.enum(["draft", "submitted", "approved", "partially_received", "closed"]).optional(),
  total_value: z.number().min(0, "Total value cannot be negative").optional(),
  expected_delivery: z.string().optional(), // ISO date string from form
  remarks: z.string().optional(),
});

// Schema for purchase order item
const insertPurchaseOrderItemSchema = z.object({
  rawMaterialId: z.string().min(1, "Material is required"),
  qty: z.number().positive("Quantity must be greater than 0"),
  rate: z.number().min(0, "Rate cannot be negative"),
  tempId: z.string().optional(), // Temporary field for frontend management
});

// ------------------- COMBINED FORM SCHEMA -------------------

const createPurchaseOrderFormSchema = z.object({
  purchaseOrder: insertPurchaseOrderSchema.omit({ status: true }), // client sets status separately if needed
  items: z.array(insertPurchaseOrderItemSchema).min(1, "At least one item is required"),
  status: z.enum(["draft", "submitted", "approved", "partially_received", "closed"]).optional(),
});

export type CreatePurchaseOrderFormData = z.infer<typeof createPurchaseOrderFormSchema>;

export default function PurchaseOrdersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const { data: vendors } = useVendors()
  const vendorResponse = vendors?.data;
  const { data: rawMaterials } = useRawMaterials({})
  const rawMaterialResponse = rawMaterials?.data;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<any | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const { data: purchaseOrdersResponse } = usePurchaseOrders({ page, limit: rowsPerPage, search: debouncedSearch });
  const purchaseOrders = Array.isArray(purchaseOrdersResponse?.data) ? purchaseOrdersResponse?.data : [];
  const totalRecords = purchaseOrdersResponse?.total ?? 0;
  const createMutation = useCreatePurchaseOrder();
  const statusUpdateMutation = useUpdatePurchaseOrder();
  const roleId = getRoleIdFromAuth();

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
        total_value: 0,
        expected_delivery: "",
        remarks: "",
      },
      items: [{
        rawMaterialId: "",
        qty: 0,
        rate: 0,
        tempId: crypto.randomUUID(),
      }],
      status: "draft",
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
    form.setValue("purchaseOrder.total_value", total);
    return total;
  };

  const onSubmit = (data: any) => {
    // Shape payload according to PurchaseOrder type used by useCreatePurchaseOrder
    const cleanedItems = (data.items as any[]).map(({ tempId, ...item }) => ({
      raw_material_id: item.rawMaterialId,
      qty: Number(item.qty || 0),
      rate: Number(item.rate || 0),
    }));

    const payload = {
      po_no: data.purchaseOrder.po_no,
      vendor_id: data.purchaseOrder.vendor_id,
      batch_no: data.purchaseOrder.batch_no,
      expected_delivery: data.purchaseOrder.expected_delivery || "",
      items: cleanedItems,
      status: data.status,
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
    { key: "purchase_order_id", header: "PO Number", sortable: true },
    { key: "vendor_name", header: "Vendor", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (status: string) => <StatusBadge status={status as any} size="sm" />
    },
    {
      key: "total_amount",
      header: "Total Value",
      sortable: true,
      render: (value: any) => formatINR(String(value ?? 0))
    },
    { key: "expected_delivery", header: "Expected Delivery", sortable: true, render: (date: string) => <FormattedDate date={date} formatString="dd-MM-yyyy" /> },
    {
      key: "created_at",
      header: "Created Date",
      sortable: true,
      render: (date: string) => <FormattedDate date={date}  />
    },
    {
      key: "actions",
      header: "Actions",
      render: (_value: any, row: any) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" data-testid={`button-view-${row.id}`} onClick={() => { setSelectedProduction(row), setIsViewDialogOpen(true) }}>
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
                        name="purchaseOrder.expected_delivery"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
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

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4">
                      <FormField
                        control={form.control}
                        name="purchaseOrder.remarks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Remarks</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                data-testid="input-remarks"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                                  { id: "submitted", name: "Submitted" },
                                  { id: "approved", name: "Approved" },
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
                              <TableHead>Rate*</TableHead>
                              <TableHead>Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fields.map((field, index) => {
                              const qty = Number(watchedItems[index]?.qty || 0);
                              const rate = Number(watchedItems[index]?.rate || 0);
                              const amount = qty * rate;

                              return (
                                <TableRow key={field.tempId} data-testid={`row-item-${index}`} style={{ alignItems: "center" }}>
                                  <TableCell>
                                    <FormField
                                      control={form.control}
                                      name={`items.${index}.rawMaterialId`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <Select
                                            onValueChange={(value) => {
                                              field.onChange(value);
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
                                              value={field.value === 0 || field.value === undefined ? "" : field.value}
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
                                      name={`items.${index}.rate`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                              value={field.value === 0 || field.value === undefined ? "" : field.value}
                                              // value={typeof field.value === "string" ? parseFloat(field.value) : (typeof field.value === "number" ? field.value : (field.value as any) || "")}
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
        </div>
      </div>

      {
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
      }

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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>View Purchase Order - {selectedProduction?.po_no}</DialogTitle>
          </DialogHeader>
          {selectedProduction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p>Indent Number: {selectedProduction.indent_no}</p>
                <p>Vendor: {selectedProduction.vendor_name}</p>
                <p>Created At: {new Date(selectedProduction.created_at).toLocaleDateString()}</p>
                <div>
                  {selectedProduction.items.map((item: any, index: number) => (
                    <div key={item.id}>
                      <p className="font-bold pt-2">Purchase Order Item {index + 1}</p>
                      <p>Material: {item.raw_material_name} - {item.raw_material_code}</p>
                      <p>Quantity: {item.qty} {item.uom}</p>
                      <p>Price: {item.rate}</p>
                      <p>Received: {item.received_qty || 0}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Current Status: <StatusBadge status={selectedProduction.status || "draft"} size="sm" />
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}