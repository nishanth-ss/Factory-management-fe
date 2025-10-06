    import DataTable from "@/components/DataTable";
    import ProductDialog from "@/components/ProductComponent/ProductDialogBox";
    import { useDebounce } from "@/hooks/useDebounce";
    import { useState } from "react";
    import { useProducts } from "@/hooks/useProduct";
    import { Button } from "@/components/ui/button";
    import { Edit, Eye } from "lucide-react";
    import { ViewDialog } from "@/components/common/ViewDialogBox";

    const ProductPage = () => {
        const [search, setSearch] = useState("");
        const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
        const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
        const [selectedProduct, setSelectedProduct] = useState<any>(null);
        const [page, setPage] = useState(1);
        const rowsPerPage = 5;

        const handleClose = () => {
            setIsCreateDialogOpen(false);
            setSelectedProduct(null);
        };
        const columns = [
            {
                header: "Product Name",
                key: "product_name",
            },
            {
                header: "Product Code",
                key: "product_code",
            },
            {
                header: "Description",
                key: "description",
            },
            {
                key: "actions",
                header: "Actions",
                render: (_value: any, row: any) => (
                <div className="flex gap-1">
                    <Button variant="outline" size="sm" data-testid={`button-view-batch-${row.id}`} onClick={() => {setSelectedProduct(row), setIsViewDialogOpen(true)}}>
                    <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-edit-batch-${row.id}`} onClick={() => {setSelectedProduct(row), setIsCreateDialogOpen(true)}}>
                    <Edit className="h-3 w-3" />
                    </Button>
                </div>
                )
            },
        ];
        const debouncedSearch = useDebounce(search, 350);
        const { data: products } = useProducts({ page: page, limit: rowsPerPage,search: debouncedSearch });
        const productData = products?.result || [];

        return (
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Products</h1>
                        <p className="text-muted-foreground">Manage products</p>
                    </div>

                    <ProductDialog
                        isCreateDialogOpen={isCreateDialogOpen}
                        setIsCreateDialogOpen={setIsCreateDialogOpen}
                        selectedProduct={selectedProduct}
                        handleClose={handleClose}
                        setSelectedProduct={setSelectedProduct}
                    />
                </div>
                <DataTable
                    title="Products"
                    columns={columns}
                    data={productData}
                    searchable={true}
                    exportable={true}
                    pagination={true}
                    rowsPerPage={rowsPerPage}
                    totalRecords={products?.total || 0}
                    currentPage={page}
                    onPageChange={(newPage) => setPage(newPage)}
                    search={search}
                    onSearch={(term) => {
                        setSearch(term);
                        setPage(1);
                    }}
                />

                <ViewDialog
                    open={isViewDialogOpen}
                    onOpenChange={setIsViewDialogOpen}
                    title="Product"
                    subtitle={selectedProduct?.product_name}
                    children={
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Product Code:</strong> {selectedProduct?.product_code}</p>
                                        <p><strong>Product Name:</strong> {selectedProduct?.product_name}</p>
                                        <p><strong>Description:</strong> {selectedProduct?.description}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                />
            </div>
        );
    };

    export default ProductPage;
