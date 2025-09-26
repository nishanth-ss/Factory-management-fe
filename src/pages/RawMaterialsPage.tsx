import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Eye, Edit } from "lucide-react";
import { formatINR } from "@/lib/currency";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateRawMaterial, useRawMaterials, useUpdateRawMaterial } from "@/hooks/useRawMaterial";
import { useDebounce } from "@/hooks/useDebounce";
import type { RawMaterialType } from "@/types/rawMaterial";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

export const insertRawMaterialSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  uom: z.string().min(1, "Unit of measurement is required"),
  category: z.string().optional(),
  batchable: z.boolean().default(true),
  reorder_level: z.coerce.number().min(0, "Reorder level cannot be negative").default(0),
});

export type InsertRawMaterial = z.infer<typeof insertRawMaterialSchema>;

const batchColumns = [
  { key: "batchNo", header: "Batch No", sortable: true },
  { key: "materialName", header: "Material", sortable: true },
  {
    key: "qtyReceived",
    header: "Qty Received",
    sortable: true,
    render: (qty: string, row: any) => `${qty} ${row.uom || ''}`
  },
  {
    key: "qtyAvailable",
    header: "Qty Available",
    sortable: true,
    render: (qty: string, row: any) => `${qty} ${row.uom || ''}`
  },
  {
    key: "costPerUnit",
    header: "Cost Per Unit",
    sortable: true,
    render: (cost: string) => cost ? formatINR(cost) : '-'
  },
  { key: "mfgDate", header: "Mfg Date", sortable: true },
  { key: "expDate", header: "Exp Date", sortable: true },
  { key: "location", header: "Location", sortable: true },
  {
    key: "actions",
    header: "Actions",
    render: (_value: any, row: any) => (
      <div className="flex gap-1">
        <Button variant="outline" size="sm" data-testid={`button-view-batch-${row.id}`}>
          <Eye className="h-3 w-3" />
        </Button>
      </div>
    )
  },
];

const materialCategories = [
  "Raw Materials",
  "Chemicals",
  "Packaging",
  "Components",
  "Consumables",
  "Utilities"
];

const unitOptions = [
  "kg", "g", "ltr", "ml", "pcs", "mtr", "cm", "mm",
  "sqft", "sqmtr", "roll", "box", "pack", "bottle"
];

export default function RawMaterialsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"materials" | "batches">("materials");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const createMutation = useCreateRawMaterial();
  const updateMutation = useUpdateRawMaterial();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const { refetch } = useRawMaterials({ page: page, limit: rowsPerPage, search: debouncedSearch });
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { rawMaterialResponse } = useSelector((state: RootState) => state.manufacturing);
  const materials = rawMaterialResponse?.data || [];

  const { data: batches = [] } = useQuery<any[]>({
    queryKey: ["/api/raw-material-batches"],
  });

  const materialColumns = [
    { key: "code", header: "Material Code", sortable: true },
    { key: "name", header: "Material Name", sortable: true },
    { key: "description", header: "Description", sortable: true },
    { key: "category", header: "Category", sortable: true },
    {
      key: "uom",
      header: "UOM",
      sortable: true
    },
    {
      key: "reorder_level",
      header: "Reorder Level",
      sortable: true,
      render: (level: string, row: any) => `${parseFloat(level || "0")} ${row.uom}`
    },
    {
      key: "actions",
      header: "Actions",
      render: (_value: any, row: any) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" data-testid={`button-view-${row.id}`} onClick={() => { setIsViewDialogOpen(true), setSelectedIndent(row) }}>
            <Eye className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" data-testid={`button-edit-${row.id}`} onClick={() => { setIsCreateDialogOpen(true), setSelectedIndent(row) }}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )
    },
  ];

  const form = useForm<any>({
    resolver: zodResolver(insertRawMaterialSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      uom: "",
      category: "",
      batchable: true,
      reorder_level: 0,
    },
  });

  useEffect(() => {
    refetch();
  }, [refetch, page]);

  useEffect(() => {
    if (selectedIndent) {
      // Editing existing material
      form.reset(selectedIndent);
    } 
  }, [selectedIndent, form]);

  useEffect(() => {
    if (!isCreateDialogOpen) {
      form.reset();
      setSelectedIndent(null);
      form.setValue("batchable", true);
      form.setValue("reorder_level", 0);
      form.setValue("category", "");
      form.setValue("description", "");
      form.setValue("uom", "");
      form.setValue("name", "");
      form.setValue("code", "");
    }
  }, [isCreateDialogOpen]);

  const onSubmit = (data: RawMaterialType) => {
    if (selectedIndent) {
      updateMutation.mutate(
        { id: selectedIndent.id, data: form.getValues() }, // combine id + data
        {
          onSuccess: () => {
            setSelectedIndent(null);
            setIsCreateDialogOpen(false);
            form.reset();
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
          form.reset();
        },
      });
    }
  };

  // Combine batch data with material names for display
  const enrichedBatches = batches.map((batch: any) => {
    const material = materials?.find((m: any) => m.id === batch.rawMaterialId);
    return {
      ...batch,
      materialName: material?.name || 'Unknown Material',
      uom: material?.uom || ''
    };
  });

  const handleClose = () => {
    setSelectedIndent(null);
    setIsCreateDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-6" data-testid="page-raw-materials">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Raw Materials</h1>
          <p className="text-muted-foreground">Manage raw materials and inventory batches</p>
        </div>

        <div className="flex gap-2">
          <div className="flex border rounded-lg p-1">
            <Button
              variant={activeTab === "materials" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("materials")}
              data-testid="tab-materials"
            >
              Materials
            </Button>
            <Button
              variant={activeTab === "batches" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("batches")}
              data-testid="tab-batches"
            >
              Batches
            </Button>
          </div>

          {/* View Indent Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Material   - {selectedIndent?.code}</DialogTitle>
          </DialogHeader>
          {selectedIndent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Material Code:</strong> {selectedIndent.code}</p>
                    <p><strong>Material Name:</strong> {selectedIndent.name}</p>
                    <p><strong>Category:</strong> {selectedIndent.category}</p>
                    <p><strong>UOM:</strong> {selectedIndent.uom}</p>
                    <p><strong>Reorder Level:</strong> {selectedIndent.reorder_level}</p>
                    <p><strong>Created At:</strong> {selectedIndent.created_at ? new Date(selectedIndent.created_at).toLocaleString('en-IN') : 'Not submitted'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

          {activeTab === "materials" && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-material">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedIndent ? "Edit Raw Material" : "Add New Raw Material"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Material Code*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., RM001"
                                {...field}
                                data-testid="input-material-code"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Material Name*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Cotton Fabric"
                                {...field}
                                data-testid="input-material-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detailed description of the material..."
                              className="resize-none"
                              value={field.value || ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              data-testid="input-material-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="uom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit of Measurement*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-material-uom">
                                  <SelectValue placeholder="Select UOM" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {unitOptions.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
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
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-material-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {materialCategories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="reorder_level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reorder Level</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0"
                                value={field.value || ""}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                                data-testid="input-reorder-level"
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="batchable"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0 pt-4">
                            <div className="space-y-0.5">
                              <FormLabel>Batch Tracking</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Enable batch tracking for this material
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value ?? true}
                                onCheckedChange={field.onChange}
                                data-testid="switch-batchable"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        data-testid="button-cancel-material"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        data-testid="button-save-material"
                      >
                        {updateMutation.isPending ? "Updating..." : createMutation.isPending ? "Creating..." : selectedIndent ? "Update Material" : "Create Material"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {activeTab === "materials" && (
        <DataTable
          title="Raw Materials Master"
          columns={materialColumns}
          data={materials}
          searchable={true}
          exportable={true}
          pagination={true}
          rowsPerPage={rowsPerPage}
          totalRecords={rawMaterialResponse?.total || 0}
          currentPage={page}
          onPageChange={(newPage) => setPage(newPage)}
          search={search}
          onSearch={(term) => {
            setSearch(term);
            setPage(1);
          }}
        />
      )}

      {activeTab === "batches" && (
        <DataTable
          title="Raw Material Batches"
          columns={batchColumns}
          data={enrichedBatches}
          searchable={true}
          exportable={true}
        />
      )}
    </div>
  );
}