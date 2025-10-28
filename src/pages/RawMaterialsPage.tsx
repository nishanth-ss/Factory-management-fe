import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/DataTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Eye, Edit, Trash2, History } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateRawMaterial,
  useRawMaterials,
  useUpdateRawMaterial,
} from "@/hooks/useRawMaterial";
import { useDebounce } from "@/hooks/useDebounce";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { useCreateUnit, useUnits, useUpdateUnit } from "@/hooks/useUnit";
import { navigate } from "wouter/use-browser-location";

// ===============================
// 🔹 Validation Schemas
// ===============================
export const insertRawMaterialSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  uom: z.string().min(1, "Unit of measurement is required"),
  category: z.string().optional(),
  batchable: z.boolean().default(true),
  reorder_level: z.coerce
    .number()
    .min(0, "Reorder level cannot be negative")
    .default(0),
});

export type InsertRawMaterial = z.infer<typeof insertRawMaterialSchema>;

const unitSchema = z.object({
  unit_name: z.string().refine((val) => val.trim() !== "", "Unit name is required"),
  department_name: z.string().refine((val) => val.trim() !== "", "Department name is required"),
  purpose: z.string().refine((val) => val.trim() !== "", "Purpose is required"),
  shop_name: z.string().refine((val) => val.trim() !== "", "Shop name is required"),
  product_name: z.string().refine((val) => val.trim() !== "", "Product name is required"),
  items: z
    .array(
      z.object({
        raw_material_id: z.string().min(1, "Select a material")
      })
    )
    .min(1, "At least one item is required"),
});

type UnitFormValues = z.infer<typeof unitSchema> & { id?: string, created_at?: string };

// ===============================
// 🔹 Constants
// ===============================
const materialCategories = [
  "Raw Materials",
  "Chemicals",
  "Packaging",
  "Components",
  "Consumables",
  "Utilities",
];

const unitOptions = [
  "Nos",
  "Kgs",
  "g",
  "ltr",
  "ml",
  "pcs",
  "mtr",
  "cm",
  "mm",
  "sqft",
  "sqmtr",
  "roll",
  "box",
  "pack",
  "bottle",
];

// ===============================
// 🔹 Component
// ===============================
export default function RawMaterialsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"raw-materials" | "units">(
    "raw-materials"
  );
  const [selectedIndent, setSelectedIndent] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitFormValues | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const rowsPerPage = 10;

  const [unitPage, setUnitPage] = useState(1);
  const [unitSearch, setUnitSearch] = useState("");
  const unitRowsPerPage = 5;

  const debouncedSearch = useDebounce(search, 350);
  const createMutation = useCreateRawMaterial();
  const updateMutation = useUpdateRawMaterial();
  const [isViewUnitDialogOpen, setIsViewUnitDialogOpen] = useState(false);
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const { rawMaterialResponse } = useSelector(
    (state: RootState) => state.manufacturing
  );

  const materials = rawMaterialResponse?.data || [];
  const rawMaterialOptions = materials.map((m: any) => ({
    id: m.id,
    name: m.name,
    code: m.code,
  }));

  const { refetch } = useRawMaterials({
    page,
    limit: rowsPerPage,
    search: debouncedSearch,
  });

  const { refetch: refetchUnit, data: unit } = useUnits({
    page: unitPage,
    limit: unitRowsPerPage,
    search: unitSearch,
  });
  const unitData = unit?.data?.data || [];
  const unitTotalRecords = unit?.data?.paginationData?.totalRecords || 0;

  useEffect(() => {
    refetchUnit();
  }, [refetchUnit, unitPage]);

  // ===============================
  // 🔹 Raw Material Form
  // ===============================
  const form = useForm<InsertRawMaterial>({
    resolver: zodResolver(insertRawMaterialSchema as any),
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

  // ===============================
  // 🔹 Unit Form
  // ===============================
  const unitForm = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema as any),
    defaultValues: {
      unit_name: "",
      department_name: "",
      purpose: "",
      shop_name: "",
      product_name: "",
      items: [{ raw_material_id: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: unitForm.control,
    name: "items",
  });

  useEffect(() => {
    refetch();
  }, [refetch, page]);

  useEffect(() => {
    if (selectedIndent) form.reset(selectedIndent);
  }, [selectedIndent, form]);

  useEffect(() => {
    if (selectedUnit) unitForm.reset(selectedUnit);
    else unitForm.reset();
  }, [selectedUnit, unitForm]);

  useEffect(() => {
    if (!isCreateDialogOpen) {
      form.reset();
      setSelectedIndent(null);
    }
  }, [isCreateDialogOpen, form]);

  const handleClose = () => {
    setSelectedIndent(null);       // clear raw material selection
    setSelectedUnit(null);         // clear unit selection
    unitForm.reset({               // reset unit form to default values
      unit_name: "",
      department_name: "",
      purpose: "",
      shop_name: "",
      product_name: "",
      items: [{ raw_material_id: ""}],
    });
    form.reset({
      code: "",
      name: "",
      description: "",
      uom: "",
      category: "",
      batchable: true,
      reorder_level: 0,
    });
    setIsCreateDialogOpen(false);  // close modal
  };

  const onSubmit = (data: InsertRawMaterial) => {
    if (selectedIndent) {
      updateMutation.mutate(
        { id: selectedIndent.id, data: data as any },
        {
          onSuccess: () => {
            handleClose();
          },
        }
      );
    } else {
      createMutation.mutate(data as any, {
        onSuccess: () => {
          handleClose();
        },
      });
    }
  };

  const handleSubmitUnit = (data: UnitFormValues) => {
    if (selectedUnit) {
      updateUnit.mutate(
        { id: selectedUnit.id || "", data: data as any },
        {
          onSuccess: () => {
            handleClose();
          },
        }
      );
    } else {
      createUnit.mutate(data as any, {
        onSuccess: () => {
          handleClose();
          unitForm.reset();
        },
      });
    }
  };

  // ===============================
  // 🔹 DataTable Columns
  // ===============================
  const materialColumns = [
    { key: "code", header: "Material Code", sortable: true },
    { key: "name", header: "Material Name", sortable: true },
    { key: "description", header: "Description", sortable: true },
    { key: "category", header: "Category", sortable: true },
    { key: "total_qty", header: "Total Quantity", sortable: true },
    { key: "uom", header: "UOM", sortable: true },
    {
      key: "reorder_level",
      header: "Reorder Level",
      sortable: true,
      render: (level: string, row: any) =>
        `${parseFloat(level || "0")} ${row.uom}`,
    },
    {
      key: "history",
      header: "History",
      render: (_value: any, row: any) => (
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigate(`/materials/${row.id}`);
            }}
          >
            <History className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_value: any, row: any) => (
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedIndent(row);
              setIsViewDialogOpen(true);
            }}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedIndent(row);
              setIsCreateDialogOpen(true);
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  const unitColumns = [
    { key: "unit_name", header: "Unit Name", sortable: true },
    { key: "department_name", header: "Department", sortable: true },
    { key: "purpose", header: "Purpose", sortable: true },
    { key: "shop_name", header: "Shop Name", sortable: true },
    { key: "product_name", header: "Product Name", sortable: true },
    {
      key: "items",
      header: "Items",
      render: (items: any[]) => (
        <div className="space-y-1">
          {items?.map((item, i) => (
            <div key={i} className="text-xs text-gray-700">
              <strong>{item.raw_material_name}</strong>
              {/* <strong>{item.raw_material_name}</strong> — {item.weight} {item.unit} @ {item.rate} */}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      sortable: true,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_value: any, row: any) => (
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedUnit(row);
              setIsViewUnitDialogOpen(true);
            }}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedUnit(row);
              setIsCreateDialogOpen(true);
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  // ===============================
  // 🔹 Render
  // ===============================
  return (
    <div className="space-y-6" data-testid="page-raw-materials">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {activeTab === "raw-materials" ? "Raw Materials" : "Units"}
          </h1>
          <p className="text-muted-foreground">
            {activeTab === "raw-materials"
              ? "Manage raw materials and inventory batches"
              : "Manage units"}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Switch Tabs */}
          <div className="flex border rounded-lg p-1">
            <Button
              variant={activeTab === "raw-materials" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("raw-materials")}
              data-testid="tab-materials"
            >
              Raw Materials
            </Button>
            <Button
              variant={activeTab === "units" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("units")}
              data-testid="tab-batches"
            >
              Units
            </Button>
          </div>

          {/* Create Dialog */}
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                // Modal is closing
                handleClose(); // resets form and state
              } else {
                setIsCreateDialogOpen(true); // optional, when opening programmatically
              }
            }}
          >            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {activeTab === "raw-materials" ? "Add Material" : "Add Unit"}
              </Button>
            </DialogTrigger>

            {activeTab === "raw-materials" ? (
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedIndent
                      ? "Edit Raw Material"
                      : "Add New Raw Material"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    {/* Material Form */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Material Code*</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., RM001" {...field} />
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
                              <Input placeholder="e.g., Cotton Fabric" {...field} />
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
                              placeholder="Detailed description..."
                              {...field}
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
                            <FormLabel>UOM*</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select UOM" />
                                </SelectTrigger>
                                <SelectContent className="max-h-52 overflow-y-auto">
                                  {unitOptions.map((u) => (
                                    <SelectItem key={u} value={u}>
                                      {u}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
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
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {materialCategories.map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c}
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
                                {...field}
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
                            <div>
                              <FormLabel>Batch Tracking</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Enable batch tracking
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" type="button" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {selectedIndent ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            ) : (
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" >
                <DialogHeader>
                  <DialogTitle>
                    {selectedUnit ? "Edit Unit" : "Add New Unit"}
                  </DialogTitle>
                </DialogHeader>

                <Form {...unitForm}>
                  <form
                    onSubmit={unitForm.handleSubmit(handleSubmitUnit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={unitForm.control}
                        name="unit_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Unit A" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={unitForm.control}
                        name="department_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Production" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={unitForm.control}
                        name="shop_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shop Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Shop A" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={unitForm.control}
                        name="product_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="product name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={unitForm.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purpose <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Purpose" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Items */}
                    <div className="border rounded-xl p-4 space-y-4 mt-2">
                      <h3 className="font-medium text-lg">Items</h3>
                      {fields.map((item, index) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-[1fr_0.2fr] items-end gap-3"
                        >
                          <FormField
                            control={unitForm.control}
                            name={`items.${index}.raw_material_id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Raw Material*</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Material" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {rawMaterialOptions.map((m) => (
                                      <SelectItem key={m.id} value={m.id}>
                                        {m.name} - {m.code}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="border border-red-500 mb-2"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          append({
                            raw_material_id: "",
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Item
                      </Button>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" type="button" onClick={() => { handleClose(), unitForm.reset(), setSelectedUnit(null) }}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {selectedUnit ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            )}
          </Dialog>
        </div>
      </div>

      {/* View Material Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              View Material - {selectedIndent?.code || "N/A"}
            </DialogTitle>
          </DialogHeader>
          {selectedIndent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Name:</strong> {selectedIndent.name}
                  </p>
                  <p>
                    <strong>Category:</strong> {selectedIndent.category}
                  </p>
                  <p>
                    <strong>UOM:</strong> {selectedIndent.uom}
                  </p>
                  <p>
                    <strong>Reorder Level:</strong>{" "}
                    {selectedIndent.reorder_level}
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {selectedIndent.created_at
                      ? new Date(selectedIndent.created_at).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Unit Dialog */}
      <Dialog open={isViewUnitDialogOpen} onOpenChange={setIsViewUnitDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              View Unit - {selectedUnit?.unit_name || "N/A"}
            </DialogTitle>
          </DialogHeader>
          {selectedUnit && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Name:</strong> {selectedUnit.unit_name}
                  </p>
                  <p>
                    <strong>Department:</strong> {selectedUnit.department_name}
                  </p>
                  <p>
                    <strong>Purpose:</strong>{" "}
                    {selectedUnit.purpose}
                  </p>
                  <p>
                    <strong>Shop Name:</strong>{" "}
                    {selectedUnit.shop_name}
                  </p>
                  <p>
                    <strong>Product Name:</strong>{" "}
                    {selectedUnit.product_name}
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {selectedUnit?.created_at
                      ? new Date(selectedUnit.created_at).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {selectedUnit.items && selectedUnit.items.length > 0 && (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Material Code</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Material Name</th>
                          {/* <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Weight</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Unit</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Rate</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Value</th> */}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedUnit.items.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm text-gray-800">{item.code}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{item.raw_material_name}</td>
                          {/* <td className="px-4 py-2 text-sm text-gray-800">{item.weight}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{item.unit}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{item.rate}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{item.value}</td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tables */}
      {activeTab === "raw-materials" ? <DataTable
        title="Raw Materials Master"
        columns={materialColumns}
        data={materials}
        searchable
        exportable
        pagination
        rowsPerPage={rowsPerPage}
        totalRecords={rawMaterialResponse?.total || 0}
        currentPage={page}
        onPageChange={(newPage) => setPage(newPage)}
        search={search}
        onSearch={(term) => {
          setSearch(term);
          setPage(1);
        }}
      /> : <DataTable
        title="Units Master"
        columns={unitColumns}
        data={unitData || []}
        searchable
        exportable
        pagination
        rowsPerPage={rowsPerPage}
        totalRecords={unitTotalRecords || 0}
        currentPage={unitPage}
        onPageChange={(newPage) => setUnitPage(newPage)}
        search={unitSearch}
        onSearch={(term) => {
          setUnitSearch(term);
          setUnitPage(1);
        }}
      />}
    </div>
  );
}
