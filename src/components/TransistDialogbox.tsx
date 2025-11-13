'use client';

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
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  useCreateTransitRegister,
  useSingleTransitRegister,
  useUpdateTransitRegister,
} from "@/hooks/useTransistRegister";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useManufactureArticles } from "@/hooks/useManufactureArticles";
import { useIndents } from "@/hooks/useIndent";
import { useDebounce } from "@/hooks/useDebounce";

interface TransistDialogboxProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  editId?: string | null;
  setSelectedArticle: (article: any) => void;
}

const MIN_SEARCH_LENGTH = 2;
const DEBOUNCE_DELAY = 1000;

export default function TransistDialogbox({
  open,
  setOpen,
  editId,
  setSelectedArticle,
}: TransistDialogboxProps) {
  const form = useForm({
    defaultValues: {
      manufacture_articles_id: "",
      transit_date: "",
      production_name: "",
      indent_id: "",
      quantity: 0,
      unit: "",
      remarks: "",
    },
  });

  const createMutation = useCreateTransitRegister();
  const updateMutation = useUpdateTransitRegister();
  const { data: singleArticle } = useSingleTransitRegister(editId ?? "", {
    enabled: !!editId,
  });

  const [maopen, setMaOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedArticleName, setSelectedArticleName] = useState("");

  const [indentOpen, setIndentOpen] = useState(false);
  const [indentSearch, setIndentSearch] = useState("");
  const [selectedIndentName, setSelectedIndentName] = useState("");

  const debouncedIndentSearch = useDebounce(indentSearch, DEBOUNCE_DELAY);

  const debouncedSearch = useDebounce(search, DEBOUNCE_DELAY);

  const { data, isFetching } = useManufactureArticles(
    {
      page: 1,
      limit: 10,
      search: debouncedSearch,
    },
    {
      enabled: debouncedSearch.length >= MIN_SEARCH_LENGTH,
    }
  );

  const articles = data?.data?.data ?? [];

  const { data: indentData, isFetching: isFetchingIndents } = useIndents(
    {
      page: 1,
      limit: 10,
      search: debouncedIndentSearch,
    }
  );

  const indents: any[] = indentData?.data ?? [];

  console.log(indents);


  // Populate form on edit
  useEffect(() => {
    if (singleArticle?.data) {
      const article = singleArticle.data;
      form.reset({
        manufacture_articles_id: article.manufacture_articles_id ?? "",
        transit_date: article.transit_date ?? "",
        production_name: article.production_name ?? "",
        indent_id: article.indent_id ?? "",
        quantity: article.quantity ?? 0,
        unit: article.unit ?? "",
        remarks: article.remarks ?? "",
      });

      // Show selected article name in edit mode
      // if (article.manufacture_articles_id) {
      //   setSelectedArticleName(article.manufacture_article_name || "Unknown Article");
      // }
    }
  }, [singleArticle, form]);

  const onSubmit = async (values: any) => {
    if (editId) {
      updateMutation.mutate(
        { id: editId, data: values },
        {
          onSuccess: () => {
            setOpen(false);
            setSelectedArticle(null);
          },
        }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          form.reset();
          setOpen(false);
          setSelectedArticle(null);
        },
      });
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedArticle(null);
    form.reset();
    setSelectedArticleName("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedArticle(null);
      setSearch("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            setSelectedArticle(null);
            form.reset();
            setSelectedArticleName("");
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Transist Register
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md w-full h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editId ? "Edit Transist Register" : "Create Transist Register"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Manufacture Article Select */}
            <FormField
              control={form.control}
              name="manufacture_articles_id"
              rules={{ required: "Manufacturing article is required" }}
              render={({ field }) => {
                const selectedArticle = articles.find(
                  (a: any) => a.id === field.value
                );

                return (
                  <FormItem>
                    <FormLabel>Manufacturing Article*</FormLabel>

                    <Popover open={maopen} onOpenChange={setMaOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={maopen}
                          className="w-full justify-between font-normal"
                        >
                          <span className="truncate">
                            {selectedArticleName || selectedArticle?.article_name || "Select article..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-full p-0" align="start">
                        <Command
                          filter={(value, search) => {
                            if (!search) return 1;
                            const article = articles.find(
                              (a: any) => a.id.toString() === value
                            );
                            if (!article) return 0;
                            const text = `${article.article_name} ${article.code || ""}`.toLowerCase();
                            return text.includes(search.toLowerCase()) ? 1 : 0;
                          }}
                        >
                          <CommandInput
                            placeholder="Search article..."
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
                            ) : articles.length > 0 ? (
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
                                      {article.code && (
                                        <p className="text-xs text-muted-foreground">
                                          Code: {article.code}
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
            />

            {/* Transit Date */}
            <FormField
              control={form.control}
              name="transit_date"
              rules={{ required: "Transit date is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transit Date*</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Production Name */}
            <FormField
              control={form.control}
              name="production_name"
              rules={{ required: "Production name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Production Name*</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter production name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Indent Select */}
            {/* Indent Select */}
            <FormField
              control={form.control}
              name="indent_id"
              rules={{ required: "Indent is required" }}
              render={({ field }) => {
                /* Find the currently selected indent so we can display its number */
                const selectedIndent = indents.find((i: any) => i.id === field.value);

                return (
                  <FormItem>
                    <FormLabel>Indent*</FormLabel>

                    <Popover open={indentOpen} onOpenChange={setIndentOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={indentOpen}
                          className="w-full justify-between font-normal"
                        >
                          <span className="truncate">
                            {selectedIndentName ||
                              selectedIndent?.indent_no ||
                              selectedIndent?.indent_number ||
                              "Select indent..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-full p-0" align="start">
                        <Command
                          /* Re-create the command when the data changes to avoid stale items */
                          key={`${debouncedIndentSearch}-${indents.length}`}
                          /* Simple client-side filter – you can keep it or remove it */
                          filter={(value, search) => {
                            if (!search) return 1;
                            const indent = indents.find((i: any) => i.id.toString() === value);
                            if (!indent) return 0;
                            const text = `${indent.indent_no || ""} ${indent.unit_name || ""}`.toLowerCase();
                            return text.includes(search.toLowerCase()) ? 1 : 0;
                          }}
                        >
                          <CommandInput
                            placeholder="Search indent..."
                            value={indentSearch}
                            onValueChange={(val) => {
                              setIndentSearch(val);
                              /* keep the popover open while typing */
                              if (val.length >= MIN_SEARCH_LENGTH) setIndentOpen(true);
                            }}
                            className="h-9"
                          />

                          <CommandList className="max-h-[250px] overflow-y-auto">
                            {isFetchingIndents ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                              </div>
                            ) : debouncedIndentSearch.length < MIN_SEARCH_LENGTH ? (
                              <CommandEmpty>
                                Type at least {MIN_SEARCH_LENGTH} characters...
                              </CommandEmpty>
                            ) : indents.length > 0 ? (
                              <CommandGroup>
                                {indents.map((indent: any) => (
                                  <CommandItem
                                    key={indent.id}
                                    value={indent.id.toString()}
                                    onSelect={() => {
                                      field.onChange(indent.id);
                                      setSelectedIndentName(
                                        indent.indent_no ||
                                        indent.indent_number ||
                                        indent.name ||
                                        "Unknown"
                                      );
                                      setIndentSearch("");
                                      setIndentOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${field.value === indent.id ? "opacity-100" : "opacity-0"
                                        }`}
                                    />
                                    <div className="flex-1">
                                      <p className="font-medium">{indent.indent_no}</p>
                                      {indent.unit_name && (
                                        <p className="text-xs text-muted-foreground">
                                          {indent.unit_name}
                                        </p>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            ) : (
                              <CommandEmpty>No indents found.</CommandEmpty>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              rules={{
                required: "Quantity is required",
                validate: (v) => Number(v) > 0 || "Quantity must be greater than 0",
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity*</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Enter quantity"
                      value={field.value || ""} // ✅ show blank instead of 0
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? "" : Number(val)); // ✅ store number or blank
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            {/* Unit */}
            <FormField
              control={form.control}
              name="unit"
              rules={{ required: "Unit is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit*</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter unit (e.g. kg, pcs)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remarks */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter remarks (optional)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editId
                  ? updateMutation.isPending
                    ? "Updating..."
                    : "Update"
                  : createMutation.isPending
                    ? "Creating..."
                    : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}