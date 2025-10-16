import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrder";
import type { PurchaseOrder } from "@/types/purchaseType";
import { uploadFileDeletion, useCreateGrn, useSingleGrn, useUpdateGrn, useUploadGrnFile } from "@/hooks/useGrn";
import type { GrnCreatePayload } from "@/types/grn";
import { formatINR } from "@/lib/currency";
import { useVendors } from "@/hooks/useVendor";

const createGrnFormSchema = z.object({
  grn_no: z.string().min(1, "GRN Number is required"),
  purchase_order_id: z.string().min(1, "Purchase Order is required"),
  gate_pass_number: z.string().min(1, "Gate Pass Number is required"),
  notes: z.string().optional(),
  received_by: z.string().optional(),
});

export type CreateGrnFormData = z.infer<typeof createGrnFormSchema>;

// ---------------------- Types ----------------------
interface GRNFormProps {
  onSubmit: () => void;
  setIsCreateDialogOpen: (open: boolean) => void;
  selectedGrn: any;
  setSelectedGrn: (grn: any) => void;
}

// ---------------------- Helper ----------------------
const generateGRNNumber = () => {
  const today = new Date();
  const dateStr =
    today.getFullYear().toString().slice(-2) +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");
  const randomSuffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `GRN${dateStr}${randomSuffix}`;
};

// ---------------------- Component ----------------------
export default function GRNForm({ onSubmit, setIsCreateDialogOpen, selectedGrn, setSelectedGrn }: GRNFormProps) {
  const [selectedPOId, setSelectedPOId] = useState<string>(""); // will hold the display purchase_order_id
  const createGrnMutation = useCreateGrn();
  const updateGrnMutation = useUpdateGrn();
  const uploadMutation = useUploadGrnFile();
  const deleteFileMutation = uploadFileDeletion();
  const [imageError, setImageError] = useState(false);

  // Provide the selected GRN id to the query and get a refetch function
  const { refetch: refetchSingleGrn } = useSingleGrn(selectedGrn?.grn_id, { enabled: !!selectedGrn?.grn_id });

  const { data: poResponse } = usePurchaseOrders();
  const approvedPOsData: PurchaseOrder[] = poResponse?.data ?? [];
  const { data: vendors } = useVendors();
  const vendorResponse = vendors?.data ?? [];
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<any[]>([]);

  const form = useForm<CreateGrnFormData>({
    resolver: zodResolver(createGrnFormSchema),
    defaultValues: {
      grn_no: generateGRNNumber(),
      purchase_order_id: "",
      gate_pass_number: "",
      notes: "",
    },
  });


  // Effect 1: run once when selectedGrn changes to prefill the form
  useEffect(() => {
    if (!selectedGrn) return;
    const immediatePOId = String(selectedGrn.purchase_order_id ?? "").trim();
    // Reset once to the GRN values
    form.reset({
      grn_no: selectedGrn.grn_no ?? generateGRNNumber(),
      purchase_order_id: immediatePOId,
      gate_pass_number: selectedGrn.gate_pass_number ?? "",
      notes: selectedGrn.notes ?? "",
      received_by: selectedGrn.received_by ?? "",
    });
    setSelectedPOId(immediatePOId);
  }, [selectedGrn]);

  useEffect(() => {
    if (selectedGrn?.uploaded_files?.length) {
      const urls = selectedGrn.uploaded_files.map((f: any) => ({
        id: f.file_id,
        url: getFullFileUrl(f.file_url),
      }));
      setUploadedUrls(urls);
    } else {
      setUploadedUrls([]);
    }
  }, [selectedGrn]);

  // Effect 2: when POs load/update, refine the mapped purchase_order_id if needed
  useEffect(() => {
    if (!selectedGrn) return;
    if (!approvedPOsData || approvedPOsData.length === 0) return;

    const currentFieldValue = form.getValues().purchase_order_id;
    const grnPOIdRaw = String(selectedGrn.purchase_order_id ?? "").trim();
    const grnPoNoRaw = String((selectedGrn as any).po_no ?? "").trim();

    const matchedPO = approvedPOsData.find((po) => {
      const poId = String(po.id ?? "").trim();
      const poDisplayId = String((po as any).purchase_order_id ?? "").trim();
      const poNo = String(po.po_no ?? "").trim();
      return poId === grnPOIdRaw || poDisplayId === grnPOIdRaw || (grnPoNoRaw !== "" && poNo === grnPoNoRaw);
    });

    const resolvedPOId = (matchedPO as any)?.purchase_order_id ?? grnPOIdRaw;
    // Only update if something actually changed to avoid loops
    if (String(currentFieldValue) !== String(resolvedPOId)) {
      form.setValue("purchase_order_id", resolvedPOId, { shouldDirty: false, shouldValidate: false });
      setSelectedPOId(resolvedPOId);
    }
  }, [approvedPOsData, selectedGrn]);

  const handleSubmit = (data: CreateGrnFormData) => {
    if (!selectedPO) return;
    if (selectedGrn) {
      const payload: any = {
        ...data,
        purchase_order_id: selectedPO?.id ?? String((selectedGrn as any)?.id ?? ""),
      };
      updateGrnMutation.mutate({ id: selectedGrn.grn_id, data: payload }, {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
          setSelectedGrn(null);
          setSelectedPOId("");
          if (file || images.length > 0) {
            const allFiles = [file, ...images].filter(Boolean) as File[];
            const poId = String(selectedPO?.id ?? "");
            allFiles.forEach((f) => uploadFileToServer(f, poId));
          }
        }
      });
      return;
    }
    const payload: GrnCreatePayload = {
      ...data,
      purchase_order_id: selectedPO?.id ?? String((selectedGrn as any)?.id ?? ""),
    };
    createGrnMutation.mutate(payload, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setSelectedGrn(null);
        setSelectedPOId("");
        if (file || images.length > 0) {
          const allFiles = [file, ...images].filter(Boolean) as File[];
          const poId = String(selectedPO?.id ?? "");
          allFiles.forEach((f) => uploadFileToServer(f, poId));
        }
      },
    });
  };


  const selectedPOFromList = approvedPOsData.find((po) => {
    const byId = String(po.id) === String(selectedPOId);
    const byDisplay = selectedPOId ? String((po as any).purchase_order_id) === String(selectedPOId) : selectedGrn?.purchase_order_id;
    const byPoNo = selectedGrn && String(po.po_no) === String((selectedGrn as any).po_no ?? "");
    return byId || byDisplay || Boolean(byPoNo);
  });
  const selectedPO = selectedPOFromList || (selectedGrn
    ? {
      // Build a minimal PO-like object from GRN row as a fallback when the list page doesn't contain this PO
      purchase_order_id: String((selectedGrn as any).purchase_order_id ?? ""),
      vendor_id: (selectedGrn as any).vendor_id,
      total_value: Number((selectedGrn as any).total_amount ?? 0),
      expected_delivery: String((selectedGrn as any).expected_delivery ?? ""),
      po_no: String((selectedGrn as any).po_no ?? ""),
    } as any
    : undefined);

  function uploadFileToServer(file: File, po_id: string) {
    const formData = new FormData();
    formData.append("files", file);
    formData.append("purchase_order_id", po_id);
    uploadMutation.mutate(formData);
  }

  function getFullFileUrl(path: string) {
    if (!path) return "";
    const fixedPath = path.replace(/\\/g, "/");
    // Adjust this base according to your backend
    const baseUrl = import.meta.env.VITE_API_URL;   
    const cleanUrl = baseUrl.replace("/api", "") 
    return `${cleanUrl}${fixedPath}`;
  }

  const handleDeleteFile = (id: string) => {
    deleteFileMutation.mutate(id, {
      onSuccess: async () => {
        // Refetch the single GRN after deletion and update local selectedGrn state
        const result: any = await refetchSingleGrn();

        if (result.data) {
          setSelectedGrn(result?.data?.data);
        }
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* GRN Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="grn_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GRN Number*</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchase_order_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Order*</FormLabel>
                <Select
                  value={(field.value as string) ? field.value : selectedPO?.purchase_order_id}
                  onValueChange={(value) => {
                    setSelectedPOId(value);
                    field.onChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PO" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* If current value isn't in list (due to pagination), include it so the select shows a value */}
                    {selectedPOId && !approvedPOsData.some((po) => String((po as any).purchase_order_id) === String(selectedPOId)) && (
                      <SelectItem key={`current-${selectedPOId}`} value={selectedPOId}>
                        {selectedPOId}
                      </SelectItem>
                    )}
                    {approvedPOsData.map((po) => {
                      const vendorName = vendorResponse?.find((v: any) => v.id === (po as any).vendor_id)?.name || "Vendor";
                      return (
                        <SelectItem key={po.id} value={String((po as any).purchase_order_id)}>
                          {(po as any).purchase_order_id} - {vendorName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gate_pass_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gate Pass Number*</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* PO Details */}
        {selectedPO && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Purchase Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">PO Number:</span>
                  <p className="font-medium">{selectedPO.purchase_order_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vendor:</span>
                  <p className="font-medium">{vendorResponse?.find((v: any) => v.id === (selectedPO as any).vendor_id)?.name || "Vendor"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Value:</span>
                  <p className="font-medium">{formatINR(String((selectedPO as any).total_amount ?? (selectedPO as any).total_value ?? 0))}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected Delivery:</span>
                  <p className="font-medium">{(() => {
                    const d = (selectedPO as any).expected_delivery ?? (selectedGrn as any)?.expected_delivery ?? "";
                    if (!d) return "";
                    const date = new Date(d);
                    return isNaN(date.getTime()) ? String(d) : date.toLocaleDateString();
                  })()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Additional notes..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attachments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ---------- File Upload ---------- */}
            <div>
              <FormLabel>Document (PDF, max 1)</FormLabel>
              {!file ? (
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                />
              ) : (
                <div className="flex items-center justify-between mt-2 border p-2 rounded-md">
                  <a
                    href={URL.createObjectURL(file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm truncate max-w-[80%]"
                  >
                    {file.name}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    title="Delete file"
                  >
                    🗑️
                  </Button>
                </div>
              )}
            </div>

            {/* ---------- Image Upload ---------- */}
            <div>
              <FormLabel>Images (1–4)</FormLabel>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length > 4) {
                    alert("You can upload a maximum of 4 images.");
                    return;
                  }
                  setImages(files);
                }}
              />

              {images.length > 0 && (
                <div className="flex gap-3 mt-3 flex-wrap">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group w-24 h-24 border rounded-md overflow-hidden">
                      {/* Click to view */}
                      <a
                        href={URL.createObjectURL(img)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`uploaded-${idx}`}
                          className="object-cover w-full h-full cursor-pointer"
                        />
                      </a>

                      {/* Delete button (appears on hover) */}
                      <button
                        type="button"
                        onClick={() => {
                          const newImgs = [...images];
                          newImgs.splice(idx, 1);
                          setImages(newImgs);
                        }}
                        className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ---------- Uploaded URLs Section (optional after API upload) ---------- */}
            {uploadedUrls.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {uploadedUrls
                  .filter((file) => !!file.url) // ✅ skip files with empty URLs
                  .map((file, i) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.url);

                    // ✅ Skip broken or invalid image
                    if (isImage && imageError) return null;

                    return (
                      <div
                        key={file.id}
                        className="relative group border rounded-md overflow-hidden w-24 h-24 flex items-center justify-center bg-muted"
                      >
                        {isImage ? (
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={file.url}
                              alt={`uploaded-${i}`}
                              className="w-full h-full object-cover"
                              onError={() => setImageError(true)}
                            />
                          </a>
                        ) : (
                          // ✅ File type (PDF/DOCX/etc.)
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline text-xs text-center px-1 truncate w-full"
                          >
                            {file.name || "View File"}
                          </a>
                        )}

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id)}
                          className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete file"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}

          </CardContent>
        </Card>


        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onSubmit}>
            Cancel
          </Button>
          {selectedGrn ? <Button
            type="submit"
            disabled={createGrnMutation.isPending}
          >
            {createGrnMutation.isPending ? "Updating..." : "Update GRN"}
          </Button> : <Button
            type="submit"
            disabled={createGrnMutation.isPending}
          >
            {createGrnMutation.isPending ? "Creating..." : "Create GRN"}
          </Button>}
        </div>
      </form>
    </Form>
  );
}
