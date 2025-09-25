import {  useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Package } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

  // Proper schema for the form with material planning
  const materialPlanSchema = z.object({
    materialId: z.string().min(1, "Material is required"),
    plannedConsumption: z.number().positive("Consumption must be positive"),
    notes: z.string().optional(),
  });  

const productionBatchFormSchema = z
  .object({
    batchNo: z.string().min(1, "Batch number is required"),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    articleSku: z.string().min(1, "Article SKU is required"),
    plannedQty: z.number().positive("Planned quantity must be positive"),
    materials: z.array(materialPlanSchema).optional(),
  })
  .refine(
    (data) => !data.endDate || !data.startDate || data.endDate >= data.startDate,
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

type ProductionBatchFormData = z.infer<typeof productionBatchFormSchema>;

interface ProductionBatchFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Mock materials data (TODO: Replace with API call)
const mockMaterials = [
  { id: "1", name: "Steel Sheet", code: "STL-001", uom: "KG" },
  { id: "2", name: "Aluminum Rod", code: "ALU-002", uom: "MTR" },
  { id: "3", name: "Copper Wire", code: "COP-003", uom: "MTR" },
];

export default function ProductionBatchForm({ onSuccess, onCancel }: ProductionBatchFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // TODO: Replace with actual API call
  const { data: availableMaterials = [] } = useQuery({
    queryKey: ["/api/raw-materials"],
    queryFn: () => mockMaterials,
  });

  const form = useForm<ProductionBatchFormData>({
    resolver: zodResolver(productionBatchFormSchema),
    defaultValues: {
      batchNo: "",
      articleSku: "",
      plannedQty: 0,
      materials: [],
    },
  });

  // Use field array for materials
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "materials",
  });

  // Generate batch number automatically
  const generateBatchNo = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `PB-${year}${month}${day}-${hours}${minutes}${seconds}`;
  };

  // Auto-generate batch number on mount
  useEffect(() => {
    form.setValue('batchNo', generateBatchNo());
  }, [form]);

  const createBatchMutation = useMutation({
    mutationFn: async (data: ProductionBatchFormData) => {
      // TODO: Replace with actual API call
      console.log('Creating production batch:', data);
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Production batch created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/production-batches"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to create production batch",
        variant: "destructive"
      });
    },
  });

  const addMaterial = () => {
    append({ materialId: "", plannedConsumption: 0, notes: "" });
  };

  const onSubmit = (data: ProductionBatchFormData) => {
    createBatchMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Batch Number */}
          <FormField
            control={form.control}
            name="batchNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch Number</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input {...field} data-testid="input-batch-no" />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => field.onChange(generateBatchNo())}
                      data-testid="button-generate-batch-no"
                    >
                      Generate
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Article SKU */}
          <FormField
            control={form.control}
            name="articleSku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Article SKU</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="WIDGET-A" data-testid="input-article-sku" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Planned Quantity */}
          <FormField
            control={form.control}
            name="plannedQty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Planned Quantity</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    placeholder="1000" 
                    data-testid="input-planned-qty" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status (auto-set to planned) */}
          <FormItem>
            <FormLabel>Status</FormLabel>
            <div className="flex items-center h-9">
              <Badge variant="secondary" className="bg-status-draft text-white">
                Planned
              </Badge>
            </div>
          </FormItem>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="button-start-date"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a start date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected End Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="button-end-date"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick an end date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Material Consumption Planning */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Material Consumption Planning
              </CardTitle>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addMaterial}
                data-testid="button-add-material"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No materials planned. Click "Add Material" to start planning consumption.
              </p>
            ) : (
              fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`materials.${index}.materialId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid={`select-material-${index}`}>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableMaterials.map((mat) => (
                                <SelectItem key={mat.id} value={mat.id}>
                                  {mat.name} ({mat.code})
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
                    name={`materials.${index}.plannedConsumption`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planned Consumption</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
                            {...field}
                            value={field.value?.toString() || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid={`input-consumption-${index}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`materials.${index}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Notes..."
                            {...field}
                            value={field.value || ''}
                            data-testid={`input-notes-${index}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                      data-testid={`button-remove-material-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createBatchMutation.isPending}
            data-testid="button-create"
          >
            {createBatchMutation.isPending ? "Creating..." : "Create Batch"}
          </Button>
        </div>
      </form>
    </Form>
  );
}