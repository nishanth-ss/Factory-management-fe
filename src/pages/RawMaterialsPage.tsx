import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export const insertRawMaterialSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  uom: z.string().min(1, "Unit of measurement is required"),
  category: z.string().optional(),
  batchable: z.boolean().default(true),
  reorderLevel: z.coerce.number().min(0, "Reorder level cannot be negative").default(0),
});

export type InsertRawMaterial = z.infer<typeof insertRawMaterialSchema>;

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
    key: "reorderLevel", 
    header: "Reorder Level", 
    sortable: true,
    render: (level: string, row: any) => `${parseFloat(level || "0")} ${row.uom}`
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
  const [activeTab, setActiveTab] = useState<"materials" | "batches">("materials");
  const { toast } = useToast();

  const { data: materials = [] } = useQuery<any[]>({
    queryKey: ["/api/raw-materials"],
  });

  const { data: batches = [] } = useQuery<any[]>({
    queryKey: ["/api/raw-material-batches"],
  });

  const form = useForm<any>({
    resolver: zodResolver(insertRawMaterialSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      uom: "",
      category: "",
      batchable: true,
      reorderLevel: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertRawMaterial) =>
      apiRequest("POST", "/api/raw-materials", data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      toast({
        title: "Material created successfully",
        description: "The new raw material has been added to your inventory.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating material",
        description: error?.message || "Failed to create raw material. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertRawMaterial) => {
    createMutation.mutate(data);
  };

  // Combine batch data with material names for display
  const enrichedBatches = batches.map((batch: any) => {
    const material = materials.find((m: any) => m.id === batch.rawMaterialId);
    return {
      ...batch,
      materialName: material?.name || 'Unknown Material',
      uom: material?.uom || ''
    };
  });

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
                  <DialogTitle>Add New Raw Material</DialogTitle>
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
                        name="reorderLevel"
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
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel-material"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending}
                        data-testid="button-save-material"
                      >
                        {createMutation.isPending ? "Creating..." : "Create Material"}
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