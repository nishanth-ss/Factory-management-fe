import DataTable from "@/components/DataTable";
import { useCallback, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import FormattedDate from "@/lib/formatDate";
import { Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCustomerOrders, type CustomerOrder } from "@/hooks/useCustomerOrders";
import CustomerOrderDialog from "@/components/CustomerOrderDialog";
import { getRoleIdFromAuth } from "@/lib/utils";

const CustomerOrderPage = () => {
    const [open, setOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<CustomerOrder | undefined>(undefined);
    const [page, setPage] = useState(1);
    const rowsPerPage = 5;
    const [search, setSearch] = useState("");
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [viewingArticle, setViewingArticle] = useState<CustomerOrder | undefined>(undefined);

    const debouncedSearch = useDebounce(search, 350);
    const { data } = useCustomerOrders({ page, limit: rowsPerPage, search: debouncedSearch });
    const orders = data?.data?.data || [];
    const totalRecords = data?.data?.pagination?.total_records || 0;
    const Role = getRoleIdFromAuth();

    const columns = [
        // { key: "transit_register_id" as const, header: "Transit Register ID", sortable: true },
        { key: "so_no" as const, header: "SO Number", sortable: true },
        {
            key: "order_date" as const,
            header: "Order Date",
            sortable: true,
            render: (date: string) => (
                <FormattedDate date={date} formatString="dd/MM/yyyy" />
            ),
        },
        {key: "article_name" as const, header: "Article Name", sortable: true},
        { key: "customer_name" as const, header: "Customer Name", sortable: true },
        { key: "customer_address" as const, header: "Customer Address", sortable: false },
        { key: "ordered_qty" as const, header: "Ordered Qty", sortable: true },
        { key: "total_transferred_qty" as const, header: "Transferred Qty", sortable: true },
        { key: "rate" as const, header: "Rate", sortable: true },
        {
            key: "due_date" as const,
            header: "Due Date",
            sortable: true,
            render: (date: string) => (
                <FormattedDate date={date} formatString="dd/MM/yyyy" />
            ),
        },
        { key: "status" as const, header: "Status", sortable: true },
        {
            key: "created_at" as const,
            header: "Created At",
            sortable: true,
            render: (date: string) => <FormattedDate date={date} />,
        },
        {
            key: "actions" as const,
            header: "Actions",
            render: (_value: any, row: any) => (
                <div className="flex gap-1">
                    {/* View */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setViewingArticle(row);
                            setIsViewDialogOpen(true);
                        }}
                    >
                        <Eye className="h-3 w-3" />
                    </Button>
                    {/* Edit */}
                    <Button
                        variant="outline"
                        size="sm"
                        title="Edit"
                        onClick={() => handleUpdateStatus(row)}
                        disabled={Role !== 1}   
                    >
                        <Edit className="h-3 w-3" />
                    </Button>

                    {/* Delete (optional) */}
                    {/* 
        <Button
          variant="outline"
          size="sm"
          title="Delete"
          onClick={() => handleDelete(row)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        */}
                </div>
            ),
        },
    ];


    const handleUpdateStatus = useCallback((row: CustomerOrder) => {
        setSelectedArticle(row);
        setOpen(true);
    }, []);

    // const handleDelete = (row: any) => {
    //     setSelectedArticle(row);
    //     setIsEditDialogOpen(true);
    // };

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Customer Order</h1>
                    <p className="text-muted-foreground">Manage customer order</p>
                </div>
                <CustomerOrderDialog 
                    key={selectedArticle?.id || 'create'}
                    open={open} 
                    setOpen={setOpen} 
                    editId={selectedArticle?.id} 
                    selectedArticle={selectedArticle}
                    setSelectedArticle={setSelectedArticle}
                />
            </div>

            <DataTable
                title="Customer Orders"
                data={orders}
                columns={columns}
                currentPage={page}
                onPageChange={setPage}
                totalRecords={totalRecords}
                rowsPerPage={rowsPerPage}
                search={search}
                onSearch={setSearch}
            />


            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
                setIsViewDialogOpen(open);
                if (!open) {
                    // Reset the viewing article when dialog is closed
                    setViewingArticle(undefined);
                }
            }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>View Customer Order - {viewingArticle?.so_no || 'Loading...'}</DialogTitle>
                    </DialogHeader>
                    {viewingArticle && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="font-medium">Order Details</p>
                                    <p>SO Number: {viewingArticle.so_no || 'N/A'}</p>
                                    <p>Order Date: {viewingArticle.order_date ? new Date(viewingArticle.order_date).toLocaleDateString() : 'N/A'}</p>
                                    <p>Due Date: {viewingArticle.due_date ? new Date(viewingArticle.due_date).toLocaleDateString() : 'N/A'}</p>
                                    <p>Status: {viewingArticle.status || 'N/A'}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-medium">Customer Details</p>
                                    <p>Name: {viewingArticle.customer_name || 'N/A'}</p>
                                    <p>Address: {viewingArticle.customer_address || 'N/A'}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-medium">Product Details</p>
                                    {/* <p>Product: {viewingArticle.article_name || 'N/A'}</p> */}
                                    <p>Quantity: {viewingArticle.ordered_qty || '0'}</p>
                                    <p>Rate: ₹{parseFloat(String(viewingArticle.rate || '0')).toFixed(2)}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-medium">Additional Information</p>
                                    <p>Notes: {viewingArticle.notes || 'No notes'}</p>
                                    <p>Created: {viewingArticle.created_at ? new Date(viewingArticle.created_at).toLocaleString() : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            {/* <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Purchase Order - {selectedArticle?.article_name}</DialogTitle>
                    </DialogHeader>
                    {selectedArticle && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <p>Indent Number: {selectedArticle.article_name}</p>
                                <p>Vendor: {selectedArticle.remarks}</p>
                                <p>Created At: {new Date(selectedArticle.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog> */}
        </>
    );
};
export default CustomerOrderPage;
