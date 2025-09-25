import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// TODO: remove mock functionality
const mockMaterials = [
  { id: "1", name: "Steel Sheet", code: "STL-001", uom: "KG" },
  { id: "2", name: "Aluminum Rod", code: "ALU-002", uom: "PCS" },
  { id: "3", name: "Copper Wire", code: "COP-003", uom: "MTR" },
];

const indentSchema = z.object({
  indentNo: z.string().min(1, "Indent number is required"),
  requiredBy: z.string().min(1, "Required by date is required"),
  priority: z.enum(["low", "medium", "high"]),
  notes: z.string().optional(),
  items: z.array(z.object({
    materialId: z.string().min(1, "Material is required"),
    qty: z.number().min(0.01, "Quantity must be greater than 0"),
    uom: z.string().min(1, "Unit is required"),
    notes: z.string().optional(),
  })).min(1, "At least one item is required"),
});

type IndentFormData = z.infer<typeof indentSchema>;

interface IndentFormProps {
  onSubmit?: (data: IndentFormData) => void;
  onDraft?: (data: IndentFormData) => void;
}

export default function IndentForm({ onSubmit, onDraft }: IndentFormProps) {
  const [items, setItems] = useState([{ id: 1, materialId: "", qty: 0, uom: "", notes: "" }]);

  const form = useForm<IndentFormData>({
    resolver: zodResolver(indentSchema),
    defaultValues: {
      indentNo: "",
      requiredBy: "",
      priority: "medium",
      notes: "",
      items: [{ materialId: "", qty: 0, uom: "", notes: "" }],
    },
  });

  const addItem = () => {
    const newItem = { id: Date.now(), materialId: "", qty: 0, uom: "", notes: "" };
    setItems([...items, newItem]);
    form.setValue("items", [...form.getValues("items"), { materialId: "", qty: 0, uom: "", notes: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      const formItems = form.getValues("items").filter((_, i) => i !== index);
      form.setValue("items", formItems);
    }
  };

  const handleSubmit = (data: IndentFormData) => {
    console.log("Indent submitted:", data);
    onSubmit?.(data);
  };

  const handleDraft = () => {
    const data = form.getValues();
    console.log("Indent saved as draft:", data);
    onDraft?.(data);
  };

  return (
    <Card data-testid="form-indent">
      <CardContent className="py-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="indentNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indent Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="IND-001" data-testid="input-indent-no" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="requiredBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required By</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-required-by" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Materials Required</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addItem}
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-md">
                  <FormField
                    control={form.control}
                    name={`items.${index}.materialId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid={`select-material-${index}`}>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockMaterials.map((material) => (
                              <SelectItem key={material.id} value={material.id}>
                                {material.name} ({material.code})
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
                    name={`items.${index}.qty`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0" 
                            step="0.01"
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid={`input-qty-${index}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.uom`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="KG" data-testid={`input-uom-${index}`} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional notes" data-testid={`input-notes-${index}`} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      data-testid={`button-remove-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Any additional requirements or notes..." data-testid="textarea-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleDraft}
                data-testid="button-save-draft"
              >
                Save as Draft
              </Button>
              <Button type="submit" data-testid="button-submit">
                Submit for Approval
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}