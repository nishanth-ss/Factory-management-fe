"use client";

import { useEffect } from "react";
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

import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Plus, Trash2, ChevronDown } from "lucide-react";
import { useRawMaterials } from "@/hooks/useRawMaterial";
import { useCreateNewIndent } from "@/hooks/useIndent";
import { useState } from "react";
import { useUnits } from "@/hooks/useUnit";
import { useDebounce } from "@/hooks/useDebounce";

const itemSchema = z.object({
    material: z.string().refine((val) => val.trim() !== "", "Material is required"),
    article_name: z.string().refine((val) => val.trim() !== "", "Article name is required"),
    weight: z.number().refine((val) => val > 0, "Weight must be greater than 0"),
    uom: z.string().refine((val) => val.trim() !== "", "UOM is required"),
    rate: z.number().refine((val) => val > 0, "Rate must be greater than 0"),
    value: z.number().refine((val) => val > 0, "Value must be greater than 0"),
});

const formSchema = z.object({
    indent_no: z.string().refine((val) => val.trim() !== "", "Indent No is required"),
    unit_name: z.string().refine((val) => val.trim() !== "", "Unit Name is required"),
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
    rd: z.number().optional(),
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

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const createIndent = useCreateNewIndent();
    const { data: rawMaterials } = useRawMaterials({});
    const rawMaterialsData = rawMaterials?.data || [];
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUnit, setSelectedUnit] = useState<any>(null);
    const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const { data: unitData, refetch } = useUnits(
        { page: 1, limit: 10, search: debouncedSearchTerm },
        { enabled: false }// only fetch when searchTerm exists
    );
    const units = unitData?.data?.data || [];
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    useEffect(() => {
        if (debouncedSearchTerm) {
            refetch();
        }
    }, [debouncedSearchTerm, refetch]);


    // Input handler
    const handleSearch = (value: string) => {
        setSearchTerm(value);
    };

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
                            <Label>Indent No <span className="text-red-500">*</span></Label>
                            <Input {...register("indent_no")} />
                            {errors.indent_no && (
                                <p className="text-red-500">{errors.indent_no.message}</p>
                            )}
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label>Unit Name <span className="text-red-500">*</span></Label>
                            <Controller
                                name="unit_name"
                                control={control}
                                render={({ field }) => (
                                    <div className="relative">
                                        <Input
                                            placeholder="Type to search..."
                                            value={field.value || ""}
                                            onFocus={() => setUnitDropdownOpen(true)} // open dropdown on focus
                                            onChange={(e) => {
                                                field.onChange(e.target.value);
                                                handleSearch(e.target.value);
                                                setUnitDropdownOpen(true); // keep open while typing
                                            }}
                                        />
                                        {unitDropdownOpen && units.length > 0 && (
                                            <ul className="absolute z-10 bg-white border mt-1 max-h-48 overflow-y-auto w-full rounded-md shadow-md">
                                                {units.map((unit: any) => (
                                                    <li
                                                        key={unit.id}
                                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedUnit(unit);
                                                            field.onChange(unit.unit_name);
                                                            setUnitDropdownOpen(false); // <-- close dropdown after selection
                                                        }}
                                                    >
                                                        {unit.unit_name}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            />
                            {errors.unit_name && (
                                <p className="text-red-500">{errors.unit_name.message}</p>
                            )}
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label>Quantity <span className="text-red-500">*</span></Label>
                            <Input
                                type="number"
                                {...register("qty", { valueAsNumber: true })}
                                onFocus={(e) => e.target.value === "0" && e.target.select()}
                                onWheel={(e) => e.currentTarget.blur()}
                            />
                            {errors.qty && (
                                <p className="text-red-500">{errors.qty.message}</p>
                            )}
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label>Date <span className="text-red-500">*</span></Label>
                            <Input type="date" {...register("date")} />
                            {errors.date && (
                                <p className="text-red-500">{errors.date.message}</p>
                            )}
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
                                    <Label>Material <span className="text-red-500">*</span></Label>
                                    <Popover
                                        key={field.id}
                                        open={openIndex === index}
                                        onOpenChange={(isOpen) => setOpenIndex(isOpen ? index : null)}
                                    >
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
                                                            onSelect={() => {
                                                                setValue(`items.${index}.material`, mat.name);
                                                                setOpenIndex(null); // close the dropdown
                                                            }}
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

                                    {errors.items?.[index]?.material && (
                                        <p className="text-red-500">{errors.items?.[index]?.material?.message}</p>
                                    )}
                                </div>

                                <div>
                                    <Label>Article Name <span className="text-red-500">*</span></Label>
                                    <Input {...register(`items.${index}.article_name`)} />
                                    {errors.items?.[index]?.article_name && (
                                        <p className="text-red-500">{errors.items?.[index]?.article_name?.message}</p>
                                    )}
                                </div>

                                <div>
                                    <Label>Weight <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...register(`items.${index}.weight`, { valueAsNumber: true })}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        onFocus={(e) => e.target.value === "0" && e.target.select()}
                                        onChange={(e) => {
                                            const weight = parseFloat(e.target.value) || 0;
                                            const rate = watch(`items.${index}.rate`) || 0;
                                            setValue(`items.${index}.weight`, weight);
                                            setValue(`items.${index}.value`, rate * weight);
                                        }}
                                    />
                                    {errors.items?.[index]?.weight && (
                                        <p className="text-red-500">{errors.items?.[index]?.weight?.message}</p>
                                    )}
                                </div>

                                <div>
                                    <Label>UOM <span className="text-red-500">*</span></Label>
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
                                    {errors.items?.[index]?.uom && (
                                        <p className="text-red-500">{errors.items?.[index]?.uom?.message}</p>
                                    )}
                                </div>

                                <div>
                                    <Label>Rate (₹) <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...register(`items.${index}.rate`, { valueAsNumber: true })}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        onFocus={(e) => e.target.value === "0" && e.target.select()}
                                        onChange={(e) => {
                                            const rate = parseFloat(e.target.value) || 0;
                                            const weight = watch(`items.${index}.weight`) || 0;
                                            setValue(`items.${index}.rate`, rate);
                                            setValue(`items.${index}.value`, rate * weight);
                                        }}
                                    />
                                    {errors.items?.[index]?.rate && (
                                        <p className="text-red-500">{errors.items?.[index]?.rate?.message}</p>
                                    )}
                                </div>

                                <div>
                                    <Label>Value (₹)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        readOnly
                                        {...register(`items.${index}.value`, { valueAsNumber: true })}
                                        value={(watch(`items.${index}.value`) || 0).toFixed(2)}
                                    />
                                    {errors.items?.[index]?.value && (
                                        <p className="text-red-500">{errors.items?.[index]?.value?.message}</p>
                                    )}
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
                                    step="0.01"
                                    defaultValue={0}
                                    {...register("rd", {
                                        valueAsNumber: true,
                                        setValueAs: (v) => (v === "" ? 0 : parseFloat(v)),
                                    })}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    onFocus={(e) => e.target.value === "0" && e.target.select()}
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
