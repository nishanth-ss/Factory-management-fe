"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { useCreateCustomerOrder, useUpdateCustomerOrder, useGetCustomerOrderById } from "@/hooks/useCustomerOrders";
import { useCallback, useEffect, useState } from "react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useTransitRegisters } from "@/hooks/useTransistRegister";

interface CustomerOrderDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    editId?: string;
    selectedArticle?: any; // Consider creating a proper type for this
    setSelectedArticle?: (article: any) => void;
}

export default function CustomerOrderDialog({ open, setOpen, editId, selectedArticle, setSelectedArticle }: CustomerOrderDialogProps) {
    const form = useForm({
        defaultValues: {
            transit_register_id: "",
            so_no: "",
            order_date: "",
            customer_name: "",
            customer_address: "",
            ordered_qty: "",
            transfered_qty: "",
            rate: "",
            due_date: "",
            notes: "",
            status: "PARTIAL",
        },
    });

    const createMutation = useCreateCustomerOrder();
    const updateMutation = useUpdateCustomerOrder();
    const { data: singleOrder } = useGetCustomerOrderById(editId ?? "");
    const [maopen, setMaOpen] = useState(false);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const [selectedArticleName, setSelectedArticleName] = useState("");
    const MIN_SEARCH_LENGTH = 2; // Define minimum search length

    // Reset form when dialog is opened/closed
    useEffect(() => {
        if (!open) {
            form.reset({
                transit_register_id: "",
                so_no: "",
                order_date: "",
                customer_name: "",
                customer_address: "",
                ordered_qty: "",
                rate: "",
                due_date: "",
                notes: "",
            });
            setSearch("");
            setSelectedArticleName("");
        }
    }, [open]);

    const { data: transitRegistersResponse, isFetching } = useTransitRegisters({
        page: 1,
        limit: 10,
        search: debouncedSearch,
        enabled: debouncedSearch.length >= MIN_SEARCH_LENGTH
    });

    const articles = transitRegistersResponse?.data?.data || [];

    // Handle form population when selectedArticle changes
    useEffect(() => {
        // Only run this effect when we have a selected article and the dialog is open
        if (!selectedArticle || !open) return;

        // Create a stable reference to the form values
        const formValues = {
            transit_register_id: selectedArticle.transit_register_id || "",
            so_no: selectedArticle.so_no || "",
            order_date: selectedArticle.order_date?.split('T')[0] || "",
            customer_name: selectedArticle.customer_name || "",
            customer_address: selectedArticle.customer_address || "",
            ordered_qty: selectedArticle.ordered_qty?.toString() || "",
            rate: selectedArticle.rate?.toString() || "",
            due_date: selectedArticle.due_date?.split('T')[0] || "",
            notes: selectedArticle.notes || "",
        };

        // Only update if the values have changed
        const currentValues = form.getValues();
        const formKeys = Object.keys(formValues) as Array<keyof typeof formValues>;
        const hasChanged = formKeys.some(
            key => currentValues[key] !== formValues[key]
        );

        if (hasChanged) {
            form.reset(formValues);

            // Set the selected article name for display
            if (selectedArticle.transit_register_id) {
                const article = articles.find(a => a.id === selectedArticle.transit_register_id);
                setSelectedArticleName(article?.article_name || "");
            } else {
                setSelectedArticleName("");
            }
        }
        // We only want to run this when the selectedArticle's ID changes, not on every render
    }, [selectedArticle?.id, open]);

    // Handle dialog close
    useEffect(() => {
        if (!open) {
            // Only reset if the form has values
            const hasValues = Object.values(form.getValues()).some(value => Boolean(value));
            if (hasValues) {
                form.reset({
                    transit_register_id: "",
                    so_no: "",
                    order_date: "",
                    customer_name: "",
                    customer_address: "",
                    ordered_qty: "",
                    rate: "",
                    due_date: "",
                    notes: "",
                });
                setSelectedArticleName("");
            }

            // Clear the selected article when dialog closes
            if (setSelectedArticle) {
                setSelectedArticle(undefined);
            }
        }
        // Only depend on open state and stable references
    }, [open, setSelectedArticle]);

    // Submit handler
    const onSubmit = (values: any) => {
        if (editId && selectedArticle) {
            updateMutation.mutate(
                { id: editId, data: values },
                {
                    onSuccess: () => {
                        setOpen(false);
                    },
                }
            );
        } else {
            createMutation.mutate(values, {
                onSuccess: () => {
                    setOpen(false);
                },
            });
        }
    };

    const handleCancel = () => {
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Customer Order
                </Button>
            </DialogTrigger>

            <DialogContent className={`max-w-lg w-full max-w-3xl overflow-y-auto ${editId ? 'h-[65vh]' : 'h-[85vh]'}`}>                <DialogHeader>
                <DialogTitle>
                    {editId ? "Edit Customer Order" : "Create Customer Order"}
                </DialogTitle>
            </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className=" grid grid-cols-2 gap-5">
                            {/* Transit Register ID */}
                            {!editId && <FormField
                                control={form.control}
                                name="transit_register_id"
                                rules={{ required: "Transit register is required" }}
                                render={({ field }) => {
                                    const selectedArticle = Array.isArray(articles) ? articles?.find(
                                        (a: any) => a.id === field.value
                                    ) : null;

                                    return (
                                        <FormItem>
                                            <FormLabel>Transit Register*</FormLabel>

                                            <Popover open={maopen} onOpenChange={setMaOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={maopen}
                                                        className="w-full justify-between font-normal"
                                                    >
                                                        <span className="truncate">
                                                            {selectedArticleName || selectedArticle?.article_name || "Select transit register..."}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>

                                                <PopoverContent className="w-full p-0" align="start">
                                                    <Command
                                                        filter={(value, search) => {
                                                            if (!search) return 1;
                                                            const article = Array.isArray(articles) ? articles?.find(
                                                                (a: any) => a.id.toString() === value
                                                            ) : null;
                                                            if (!article) return 0;
                                                            const text = `${article.article_name} ${article.production_name || ""}`.toLowerCase();
                                                            return text.includes(search.toLowerCase()) ? 1 : 0;
                                                        }}
                                                    >
                                                        <CommandInput
                                                            placeholder="Search transit register..."
                                                            onValueChange={(val) => {
                                                                setSearch(val);
                                                                if (val.length >= MIN_SEARCH_LENGTH) {
                                                                    setMaOpen(true);
                                                                }
                                                            }}
                                                        />

                                                        <CommandList className="max-h-[250px] overflow-y-auto">
                                                            {isFetching ? (
                                                                <div className="flex items-center justify-center py-6">
                                                                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                                                                </div>
                                                            ) : debouncedSearch.length < MIN_SEARCH_LENGTH ? (
                                                                <CommandEmpty>
                                                                    Type at least {MIN_SEARCH_LENGTH} characters...
                                                                </CommandEmpty>
                                                            ) : Array.isArray(articles) && articles.length > 0 ? (
                                                                <CommandGroup>
                                                                    {articles.map((article: any) => (
                                                                        <CommandItem
                                                                            key={article.id}
                                                                            value={article.id.toString()}
                                                                            onSelect={() => {
                                                                                field.onChange(article.id);
                                                                                setSelectedArticleName(article.article_name);
                                                                                setSearch("");
                                                                                setMaOpen(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={`mr-2 h-4 w-4 ${field.value === article.id
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                                    }`}
                                                                            />
                                                                            <div className="flex-1">
                                                                                <p className="font-medium">{article.article_name}</p>
                                                                                {article.production_name && (
                                                                                    <p className="text-xs text-muted-foreground">
                                                                                        Production: {article.production_name}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            ) : (
                                                                <CommandEmpty>No articles found.</CommandEmpty>
                                                            )}
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>

                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />}

                            {/* SO Number */}
                            <FormField
                                control={form.control}
                                name="so_no"
                                rules={{ required: "SO Number is required" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SO Number*</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="SO-102" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Order Date */}
                            <FormField
                                control={form.control}
                                name="order_date"
                                rules={{ required: "Order date is required" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Order Date*</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Customer Name */}
                            <FormField
                                control={form.control}
                                name="customer_name"
                                rules={{ required: "Customer name is required" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer Name*</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter customer name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Customer Address */}
                            <FormField
                                control={form.control}
                                name="customer_address"
                                rules={{ required: "Customer address is required" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer Address*</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter customer address" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Ordered Qty */}
                            <FormField
                                control={form.control}
                                name="ordered_qty"
                                rules={{ required: true, validate: v => Number(v) > 0 || "Must be > 0" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ordered Qty*</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={1} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Transfered Qty */}
                            {!editId && <FormField
                                control={form.control}
                                name="transfered_qty"
                                rules={{ required: "Transfered qty is required" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Transfered Qty*</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={0} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />}

                            {/* Rate */}
                            <FormField
                                control={form.control}
                                name="rate"
                                rules={{ required: "Rate is required" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rate*</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Due Date */}
                            <FormField
                                control={form.control}
                                name="due_date"
                                rules={{ required: "Due date is required" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Due Date*</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Notes */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Optional notes" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Status */}
                            <FormField
                                control={form.control}
                                name="status"
                                rules={{ required: "Status is required" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status*</FormLabel>
                                        <FormControl>
                                            <select className="border rounded-md p-2 w-full" {...field}>
                                                <option value="PARTIAL">PARTIAL</option>
                                                <option value="COMPLETED">COMPLETED</option>
                                                <option value="PENDING">PENDING</option>
                                            </select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </div>
                        {/* Buttons */}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" type="button" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editId ? "Update" : "Create"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
