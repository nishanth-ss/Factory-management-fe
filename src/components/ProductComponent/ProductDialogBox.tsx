import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProduct";
import { useEffect } from "react";

interface ProductDialogProps {
    isCreateDialogOpen: boolean;
    setIsCreateDialogOpen: (open: boolean) => void;
    selectedProduct?: any;
    handleClose: () => void;
    setSelectedProduct: (product: any) => void;
}

export const productSchema = z.object({
    product_name: z.string().min(1, "Product name is required"),
    product_code: z.string().min(1, "Product code is required"),
    description: z.string().optional(),
});

const ProductDialog: React.FC<ProductDialogProps> = ({
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    selectedProduct,
    handleClose,
    setSelectedProduct,
}) => {

    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();

    const form = useForm<any>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            product_code: "",
            product_name: "",
            description: "",
        },
    });

    useEffect(() => {
        if (Object.keys(selectedProduct || {}).length > 0) {
            // Reset form when dialog opens — either with selectedProduct or empty values
            form.reset({
                product_code: selectedProduct?.product_code,
                product_name: selectedProduct?.product_name,
                description: selectedProduct?.description,
            });
        } else {
            // Creating new
            form.reset({
                product_code: "",
                product_name: "",
                description: "",
            });
        }
    }, [selectedProduct, form]);

    const onSubmit = (data: any) => {
        if (Object.keys(selectedProduct || {}).length > 0) {
            
            updateProduct.mutate({...data,id:selectedProduct.id},{
                onSuccess: () => {
                    handleClose();
                    setSelectedProduct(null);
                },
            });
        } else {
            createProduct.mutate(data,{
                onSuccess: () => {
                    handleClose();
                    setSelectedProduct(null);
                },
            });
        }
    };

    return (

        <Dialog open={isCreateDialogOpen} onOpenChange={() => {setIsCreateDialogOpen(!isCreateDialogOpen), setSelectedProduct(null)}}>
            <DialogTrigger asChild>
                <Button data-testid="button-create-material">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{selectedProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="product_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Code*</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., RM001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="product_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Name*</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Cotton Fabric" {...field} />
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
                                        <Textarea placeholder="Detailed description..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {selectedProduct ? "Update Product" : "Create Product"}
                            </Button>
                        </div>
                    </form>
                </Form>

            </DialogContent>
        </Dialog>
    )
}

export default ProductDialog;