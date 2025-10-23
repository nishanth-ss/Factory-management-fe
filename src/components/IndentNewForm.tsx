"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Plus, Trash2, ChevronDown } from "lucide-react";
import { useRawMaterials } from "@/hooks/useRawMaterial";
import { useCreateNewIndent } from "@/hooks/useIndent";

const itemSchema = z.object({
    material: z.string().min(1, "Material is required"),
    article_name: z.string().min(1, "Article name is required"),
    weight: z.number().min(0),
    uom: z.string().min(1),
    rate: z.number(),
    value: z.number(),
});

const formSchema = z.object({
    indent_no: z.string().min(1),
    unit_name: z.string().min(1),
    qty: z.number().min(1),
    date: z.string().min(1),
    items: z.array(itemSchema),
    skilled: z.object({
        persons: z.number().min(0),
        rate: z.number(),
        value: z.number(),
    }),
    semiskilled: z.object({
        persons: z.number().min(0),
        rate: z.number(),
        value: z.number(),
    }),
    profitPercent: z.number(),
    wearTearPercent: z.number(),
    gstPercent: z.number(),
    rd: z.number(),
    remarks: z.string().optional(),
    status: z.enum(["draft", "pending", "submitted", "approved", "rejected", "in-progress", "in_process", "completed", "planned", "qc", "released", "partially_received", "closed"]),
});

type FormData = z.infer<typeof formSchema>;

export default function IndentFormDialog() {
    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            indent_no: "",
            unit_name: "",
            qty: 1,
            date: new Date().toISOString().split("T")[0],
            items: [
                { material: "", article_name: "", weight: 0, uom: "", rate: 0, value: 0 },
            ],
            skilled: { persons: 0, rate: 0, value: 0 },
            semiskilled: { persons: 0, rate: 0, value: 0 },
            profitPercent: 0,
            wearTearPercent: 0,
            gstPercent: 0,
            rd: 0,
            remarks: "",
            status: "draft",
        },
    });
    console.log(errors);

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const createIndent = useCreateNewIndent();
    const { data: rawMaterials } = useRawMaterials({});
    const rawMaterialsData = rawMaterials?.data || [];

    const items = useWatch({ control, name: "items" });
    const skilled = useWatch({ control, name: "skilled" });
    const semiskilled = useWatch({ control, name: "semiskilled" });
    const profitPercent = useWatch({ control, name: "profitPercent" });
    const wearTearPercent = useWatch({ control, name: "wearTearPercent" });
    const gstPercent = useWatch({ control, name: "gstPercent" });
    const qty = useWatch({ control, name: "qty" });

    // Derived calculations
    const totalMaterialValue = items?.reduce((acc, cur) => acc + (cur.value || 0), 0);
    const totalWages = (skilled?.value || 0) + (semiskilled?.value || 0);
    const baseTotal = totalMaterialValue + totalWages;

    const profitValue = (baseTotal * profitPercent) / 100;
    const wearTearValue = (baseTotal * wearTearPercent) / 100;

    const totalBeforeRound = baseTotal + profitValue + wearTearValue;
    const rd = watch("rd") || 0; // user-input round-off
    const totalProductionCost = totalBeforeRound + rd;

    const gstValue = (totalProductionCost * gstPercent) / 100;
    const finalCost = totalProductionCost + gstValue;
    const ratePerQty = qty ? finalCost / qty : 0;

    const onSubmit = (data: FormData) => {
        const payload = {
            indent_no: data.indent_no,
            indent_date: data.date,
            status: data.status,
            remarks: data.remarks,

            items: data.items.map((item) => {
                const matched = rawMaterialsData.find((m) => m.name === item.material);
                return {
                    raw_material_id: matched?.id || null,
                    article_name: item.article_name,
                    weight: item.weight,
                    unit: item.uom,
                    rate: item.rate,
                    value: item.value,
                };
            }),

            calculation: {
                total_value: totalProductionCost,
                profit_percentage: data.profitPercent,
                profit_amount: profitValue,
                tax_percentage: data.gstPercent,
                tax_amount: gstValue,
                round_off: rd,
                final_amount: finalCost,
            },
        };

        createIndent.mutate(payload, {
            onSuccess: () => reset(),
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>Add Indent</Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[95%] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Indent with Costing</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-2">
                    {/* Basic Info */}
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <Label>Indent No</Label>
                            <Input {...register("indent_no")} />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label>Unit Name</Label>
                            <Input {...register("unit_name")} />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                {...register("qty", { valueAsNumber: true })}
                                onFocus={(e) => e.target.value === "0" && e.target.select()}
                                onWheel={(e) => e.currentTarget.blur()}
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label>Date</Label>
                            <Input type="date" {...register("date")} />
                        </div>
                    </div>

                    {/* Material Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Material Details</h3>
                            <Button
                                type="button"
                                onClick={() =>
                                    append({
                                        material: "",
                                        article_name: "",
                                        weight: 0,
                                        uom: "",
                                        rate: 0,
                                        value: 0,
                                    })
                                }
                                size="sm"
                                variant="outline"
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Item
                            </Button>
                        </div>

                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_0.5fr] items-center gap-3 border p-3 rounded-lg"
                            >
                                {/* Material */}
                                <div>
                                    <Label>Material</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between"
                                            >
                                                {watch(`items.${index}.material`) || "Select material"}
                                                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0 w-[250px]">
                                            <Command>
                                                <CommandInput placeholder="Search material..." />
                                                <CommandEmpty>No material found.</CommandEmpty>
                                                <CommandGroup>
                                                    {rawMaterialsData.map((mat) => (
                                                        <CommandItem
                                                            key={mat.id}
                                                            onSelect={() =>
                                                                setValue(`items.${index}.material`, mat.name)
                                                            }
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    watch(`items.${index}.material`) === mat.name
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            {mat.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div>
                                    <Label>Article Name</Label>
                                    <Input {...register(`items.${index}.article_name`)} />
                                </div>

                                <div>
                                    <Label>Weight</Label>
                                    <Input
                                        type="number"
                                        {...register(`items.${index}.weight`, { valueAsNumber: true })}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        onFocus={(e) => e.target.value === "0" && e.target.select()}
                                        onChange={(e) => {
                                            const weight = parseFloat(e.target.value) || 0;
                                            const rate = watch(`items.${index}.rate`) || 0;
                                            setValue(`items.${index}.value`, rate * weight);
                                        }}
                                    />
                                </div>

                                <div>
                                    <Label>UOM</Label>
                                    <Select
                                        onValueChange={(val) => setValue(`items.${index}.uom`, val)}
                                        defaultValue={field.uom}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kgs">Kgs</SelectItem>
                                            <SelectItem value="ltr">Ltr</SelectItem>
                                            <SelectItem value="nos">Nos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Rate (₹)</Label>
                                    <Input
                                        type="number"
                                        {...register(`items.${index}.rate`, { valueAsNumber: true })}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        onFocus={(e) => e.target.value === "0" && e.target.select()}
                                        onChange={(e) => {
                                            const rate = parseFloat(e.target.value) || 0;
                                            const weight = watch(`items.${index}.weight`) || 0;
                                            setValue(`items.${index}.value`, rate * weight);
                                        }}
                                    />
                                </div>

                                <div>
                                    <Label>Value (₹)</Label>
                                    <Input
                                        type="number"
                                        readOnly
                                        {...register(`items.${index}.value`, { valueAsNumber: true })}
                                        onWheel={(e) => e.currentTarget.blur()}
                                    />
                                </div>

                                <div className="flex justify-center">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        className="border border-red-500"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Wages */}
                    <div className="border-t pt-4 space-y-3">
                        <h3 className="font-semibold text-lg">Wages</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label>Skilled - No. of Persons</Label>
                                <Input
                                    type="number"
                                    {...register("skilled.persons", { valueAsNumber: true })}
                                    onFocus={(e) => e.target.value === "0" && e.target.select()}
                                    onChange={(e) => {
                                        const persons = parseFloat(e.target.value) || 0;
                                        const rate = watch("skilled.rate") || 0;
                                        setValue("skilled.value", persons * rate);
                                    }}
                                />
                            </div>
                            <div>
                                <Label>Skilled - Rate (₹)</Label>
                                <Input
                                    type="number"
                                    {...register("skilled.rate", { valueAsNumber: true })}
                                    onFocus={(e) => e.target.value === "0" && e.target.select()}
                                    onChange={(e) => {
                                        const rate = parseFloat(e.target.value) || 0;
                                        const persons = watch("skilled.persons") || 0;
                                        setValue("skilled.value", persons * rate);
                                    }}
                                />
                            </div>
                            <div>
                                <Label>Skilled - Value (₹)</Label>
                                <Input type="number" readOnly value={skilled?.value || 0} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label>Semi-skilled - No. of Persons</Label>
                                <Input
                                    type="number"
                                    {...register("semiskilled.persons", { valueAsNumber: true })}
                                    onFocus={(e) => e.target.value === "0" && e.target.select()}
                                    onChange={(e) => {
                                        const persons = parseFloat(e.target.value) || 0;
                                        const rate = watch("semiskilled.rate") || 0;
                                        setValue("semiskilled.value", persons * rate);
                                    }}
                                />
                            </div>
                            <div>
                                <Label>Semi-skilled - Rate (₹)</Label>
                                <Input
                                    type="number"
                                    {...register("semiskilled.rate", { valueAsNumber: true })}
                                    onFocus={(e) => e.target.value === "0" && e.target.select()}
                                    onChange={(e) => {
                                        const rate = parseFloat(e.target.value) || 0;
                                        const persons = watch("semiskilled.persons") || 0;
                                        setValue("semiskilled.value", persons * rate);
                                    }}
                                />
                            </div>
                            <div>
                                <Label>Semi-skilled - Value (₹)</Label>
                                <Input type="number" readOnly value={semiskilled?.value || 0} />
                            </div>
                        </div>
                    </div>

                    {/* Cost Summary */}
                    <div className="border-t pt-4 space-y-3">
                        <h3 className="font-semibold text-lg">Cost Summary</h3>

                        <div className="grid grid-cols-6 gap-3">
                            <div>
                                <Label>Profit (%)</Label>
                                <Input
                                    type="number"
                                    {...register("profitPercent", { valueAsNumber: true })}
                                    onFocus={(e) => e.target.value === "0" && e.target.select()}
                                    onWheel={(e) => e.currentTarget.blur()}
                                />
                            </div>
                            <div>
                                <Label>Wear & Tear (%)</Label>
                                <Input
                                    type="number"
                                    {...register("wearTearPercent", { valueAsNumber: true })}
                                    onFocus={(e) => e.target.value === "0" && e.target.select()}
                                    onWheel={(e) => e.currentTarget.blur()}
                                />
                            </div>
                            <div>
                                <Label>R/D (₹)</Label>
                                <Input
                                    type="number"
                                    {...register("rd", { valueAsNumber: true })}
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                            <div>
                                <Label>GST (%)</Label>
                                <Input
                                    type="number"
                                    {...register("gstPercent", { valueAsNumber: true })}
                                    onFocus={(e) => e.target.value === "0" && e.target.select()}
                                    onWheel={(e) => e.currentTarget.blur()}
                                />
                            </div>
                            <div>
                                <Label>Total Value (₹)</Label>
                                <Input type="number" readOnly value={totalProductionCost.toFixed(2)} />
                            </div>
                            <div>
                                <Label>Rate per Qty (₹)</Label>
                                <Input type="number" value={ratePerQty.toFixed(2)} />
                            </div>
                        </div>
                    </div>

                    <div className="border-t-[1px] pt-4">
                        <div className="flex justify-end gap-4">
                            <div className="w-[600px]">
                                <Label>Remarks</Label>
                                <Input type="text" {...register("remarks")} />
                            </div>
                            <div className="w-[300px]">
                                <Label>Status</Label>
                                <Select {...register("status")}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit">Submit</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
