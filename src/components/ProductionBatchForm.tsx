import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Package, Wallet } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useRawMaterialBatches } from "@/hooks/useRawMaterialBatch";
import { useCreateProduction, useUpdateProduction } from "@/hooks/useProduction";
import type { ProductionType } from "@/types/productionTypes";
import { useProducts } from "@/hooks/useProduct";
import { useRawMaterials } from "@/hooks/useRawMaterial";

// Proper schema for the form with material planning
const materialPlanSchema = z.object({
  raw_material_id: z.string().min(1, "Material is required"),
  qty_consumed: z.number().positive("Consumption must be positive"),
  rate: z.number().positive("Rate must be positive"),
});

const operationExpenseSchema = z.object({
  expense_category: z
    .string()
    .min(1, "Expense category is required"), // Labour, Electricity, Water Bill, etc.
  rate: z
    .number()
    .positive("Rate must be greater than 0"),
  qty: z.number().optional(),
  description: z.string().optional(),
});

const productionBatchFormSchema = z
  .object({
    batch_no: z.string().min(1, "Batch number is required"),
    product_id: z.string().min(1, "Product is required"),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
    article_sku: z.string().min(1, "Article SKU is required"),
    planned_qty: z.number().positive("Planned quantity must be positive"),
    materials: z.array(materialPlanSchema).optional(),
    operationExpenses: z.array(operationExpenseSchema).optional(),
  })
  .refine(
    (data) => !data.end_date || !data.start_date || data.end_date >= data.start_date,
    {
      message: "End date must be after start date",
      path: ["end_date"],
    }
  );

type ProductionBatchFormData = z.infer<typeof productionBatchFormSchema>;

interface ProductionBatchFormProps {
  onCancel?: () => void;
  selectedProduction?: any;
}

export default function ProductionBatchForm({ onCancel, selectedProduction }: ProductionBatchFormProps) {
  // const { data: batches } = useRawMaterialBatches({ page: 1, limit: "all", search: "" });
  // const batchesData = batches?.data ?? [];
  const createProductionMutation = useCreateProduction();
  const { data: batches, isLoading: batchesLoading } = useRawMaterialBatches({ page: 1, limit: 1000, search: "" });
  const productionBatchData = batches?.data ?? [];
  const updateProductionMutation = useUpdateProduction();

  const { data: products, isLoading: productsLoading } = useProducts({ page: 1, limit: 1000, search: "" });
  const productsData = products?.result ?? [];

  const form = useForm<ProductionBatchFormData>({
    resolver: zodResolver(productionBatchFormSchema),
    defaultValues: {
      batch_no: "",
      product_id: "",
      article_sku: "",
      planned_qty: 0,
      materials: [],
      operationExpenses: [],
    },
  });  

  useEffect(() => {
    if (selectedProduction?.id && !batchesLoading && !productsLoading && productionBatchData.length && productsData.length) {
      form.reset({
        batch_no: selectedProduction.batch_id || "",
        product_id: selectedProduction.product_id || "",
        article_sku: selectedProduction.article_sku || "",
        planned_qty: Number(selectedProduction.planned_qty) || 0,
        start_date: selectedProduction.batch_start_date ? new Date(selectedProduction.batch_start_date) : undefined,
        end_date: selectedProduction.batch_end_date ? new Date(selectedProduction.batch_end_date) : undefined,
        materials: selectedProduction.batch_consumptions || [],
        operationExpenses: selectedProduction.batch_expenses || [],
      });
    } else {
      form.reset({
        batch_no: generateBatchNo(),
        product_id: "",
        article_sku: "",
        planned_qty: 0,
        materials: [],
        operationExpenses: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduction?.id, batchesLoading, productsLoading, productionBatchData.length, productsData.length]);
  


  const { data: materials } = useRawMaterials({ page: 1, limit: "all", search: "" });
  const materialsData = materials?.data ?? [];

  // Use field array for materials
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "materials",
  });

  // Use field array for operation expenses
  const {
    fields: expenseFields,
    append: appendExpense,
    remove: removeExpense,
  } = useFieldArray({
    control: form.control,
    name: "operationExpenses",
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
    if (!selectedProduction) {
      form.setValue("batch_no", generateBatchNo());
    }
  }, [selectedProduction, form]);

  const addMaterial = () => {
    append({ raw_material_id: "", qty_consumed: 0, rate: 0 });
  };

  const onSubmit = (data: ProductionBatchFormData) => {
    const payload: ProductionType = {
      batch_no: data.batch_no,
      product_id: data.product_id,
      article_sku: data.article_sku,
      planned_qty: data.planned_qty,
      start_date: data.start_date ? data.start_date.toISOString() : "",
      end_date: data.end_date ? data.end_date.toISOString() : "",
      batch_consumptions: data.materials?.map((m) => ({
        raw_material_id: m.raw_material_id,
        qty_consumed: m.qty_consumed,
        rate: m.rate,
      })) ?? [] as any,
      operation_expenses: data.operationExpenses?.map((e) => ({
        expense_category: e.expense_category,
        qty: e.qty,
        rate: e.rate,
        description: e.description,
      })) ?? [] as any,
    };

    if (selectedProduction) {
      updateProductionMutation.mutate({ id: selectedProduction.id, data: payload }, {
        onSuccess: () => {
          onCancel?.();
        },
      });
    } else {
      createProductionMutation.mutate(payload, {
        onSuccess: () => {
          onCancel?.();
        },
      });
    }
  };

  const addExpense = () => {
    appendExpense({ expense_category: "", rate: 0, qty: 0, description: "" });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Batch Number */}
          <FormField
            control={form.control}
            name="batch_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch Number</FormLabel>
                <FormControl>
                  <Select
                    value={selectedProduction?.batch_id || field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch number" />
                    </SelectTrigger>
                    <SelectContent>
                      {productionBatchData?.map((batch: any) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batch_no}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Product */}
          <FormField
            control={form.control}
            name={`product_id`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product</FormLabel>
                <FormControl>
                  <Select
                    value={selectedProduction?.product_id || field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productsData?.map((product: any) => (
                        <SelectItem key={product.id} value={String(product.id)}>
                          {product.product_name} - {product.product_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Article SKU */}
          <FormField
            control={form.control}
            name="article_sku"
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
            name="planned_qty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Planned Quantity</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="1000"
                    data-testid="input-planned-qty"
                    value={field.value === 0 || field.value === undefined ? "" : field.value}
                    onWheel={(e) => e.currentTarget.blur()}
                    // value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)} // 👈 convert to number
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status (auto-set to planned) */}
          {/* <FormItem>
            <FormLabel>Status</FormLabel>
            <div className="flex items-center h-9">
              <Badge variant="secondary" className="bg-status-draft text-gray-500">
                Planned
              </Badge>
            </div>
          </FormItem> */}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
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
            name="end_date"
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

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2"> <Wallet className="h-5 w-5" />Other Expenses</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExpense}
                data-testid="button-add-expense"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {expenseFields.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No operation expenses added. Click "Add Expense" to add one.
              </p>
            ) : (
              expenseFields.map((expField, index) => (
                <div key={expField.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_50px] gap-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`operationExpenses.${index}.expense_category`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expense Type</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Labour / Electricity / Water ..." data-testid={`input-expense-type-${index}`} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`operationExpenses.${index}.qty`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === 0 || field.value === undefined ? "" : field.value}
                            // value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            onWheel={(e) => e.currentTarget.blur()}
                            placeholder="0"
                            data-testid={`input-expense-qty-${index}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`operationExpenses.${index}.rate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === 0 || field.value === undefined ? "" : field.value}
                            // value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            onWheel={(e) => e.currentTarget.blur()}
                            placeholder="0"
                            data-testid={`input-expense-rate-${index}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`operationExpenses.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter description" />
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
                      onClick={() => removeExpense(index)}
                      data-testid={`button-remove-expense-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

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
                    name={`materials.${index}.raw_material_id`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid={`select-material-${index}`}>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {materialsData.map((mat) => (
                                <SelectItem key={mat.id} value={mat.id || ""}>
                                  {mat.name}- {mat.code}
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
                    name={`materials.${index}.qty_consumed`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planned Consumption</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
                            {...field}
                            value={field.value === 0 || field.value === undefined ? "" : field.value}
                            // value={field.value?.toString() || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid={`input-consumption-${index}`}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`materials.${index}.rate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Rate"
                            {...field}
                            value={field.value === 0 || field.value === undefined ? "" : field.value}
                            // value={field.value?.toString() || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid={`input-rate-${index}`}
                            onWheel={(e) => e.currentTarget.blur()}
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
          {!selectedProduction?.id ? <Button
            type="submit"
            disabled={createProductionMutation.isPending}
            data-testid="button-create"
          >
            {createProductionMutation.isPending ? "Creating..." : "Create Batch"}
          </Button> : <Button
            type="submit"
            disabled={updateProductionMutation.isPending}
            data-testid="button-create"
          >
            {updateProductionMutation.isPending ? "Updating..." : "Update Batch"}
          </Button>}
        </div>
      </form>
    </Form>
  );
}