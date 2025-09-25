import { z } from "zod";

// Single item in the GRN
export const grnItemSchema = z.object({
  purchaseOrderItemId: z.string(),
  qty: z.number().min(0.001, "Quantity must be greater than 0"),
  costPerUnit: z.number().min(0, "Cost cannot be negative").optional(),
  batchNo: z.string().optional(),
  mfgDate: z.string().optional(),
  expDate: z.string().optional(),
  location: z.string().optional(),
  tempId: z.string().optional(),
  materialName: z.string().optional(),
  materialCode: z.string().optional(),
  uom: z.string().optional(),
  orderedQty: z.number().optional(),
  remainingQty: z.number().optional(),
  rate: z.number().optional(),
});

// GRN form schema
export const createGrnFormSchema = z.object({
  grn: z.object({
    grnNo: z.string().min(1, "GRN Number is required"),
    purchaseOrderId: z.string().min(1, "Purchase Order is required"),
    notes: z.string().optional(),
    receivedBy: z.string().optional(), // will be set programmatically
  }),
  items: z.array(grnItemSchema).min(1, "At least one item is required"),
});