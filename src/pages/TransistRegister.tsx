import DataTable from "@/components/DataTable";
import { useState } from "react";
import { useTransitRegisters } from "@/hooks/useTransistRegister";
import { useDebounce } from "@/hooks/useDebounce";
import FormattedDate from "@/lib/formatDate";
import { Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TransistDialogbox from "@/components/TransistDialogbox";

const TransistRegister = () => {
    const [open, setOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<any>(null);
    const [page, setPage] = useState(1);
    const rowsPerPage = 5;
    const [search, setSearch] = useState("");
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const debouncedSearch = useDebounce(search, 350);
    const { data } = useTransitRegisters({ page, limit: rowsPerPage, search: debouncedSearch });
    const articles = data?.data?.data || [];
    const totalRecords = data?.data?.pagination?.total_records || 0;

    const columns = [
        { key : "production_name", header: "Production Name", sortable: true },
        { key: "article_name", header: "Article Name", sortable: true },
        { key: "quantity", header: "Quantity", sortable: true },
        { key: "unit", header: "Unit", sortable: true },
        { key: "remarks", header: "Remarks", sortable: true },
        { key : "transit_date", header: "Transit Date", sortable: true, render: (date: string) => <FormattedDate date={date} formatString="dd/MM/yyyy"  /> },
        { key: "created_at", header: "Created Date", sortable: true, render: (date: string) => <FormattedDate date={date} /> },
        {
            key: "actions", header: "Actions", render: (_value: any, row: any) => (
                <div className="flex gap-1">
                    <Button variant="outline" size="sm" data-testid={`button-view-${row.id}`} onClick={() => { setSelectedArticle(row), setIsViewDialogOpen(true) }}>
                        <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-edit-${row.id}`}
                        title="Update Status"
                        onClick={() => {handleUpdateStatus(row)}}
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                    {/* <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-delete-${row.id}`}
                        title="Delete"
                        onClick={() => handleDelete(row)}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button> */}
                </div>
            )
        }
    ];

    const handleUpdateStatus = (row: any) => {
        setSelectedArticle(row);
        setOpen(true);
    };

    // const handleDelete = (row: any) => {
    //     setSelectedArticle(row);
    //     setIsEditDialogOpen(true);
    // };

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Transit Register</h1>
                    <p className="text-muted-foreground">Manage transit register</p>
                </div>
                <TransistDialogbox open={open} setOpen={setOpen} editId={selectedArticle?.id} setSelectedArticle={setSelectedArticle}  />
            </div>

            <DataTable
                title="Transit Register"
                columns={columns}
                data={articles}
                searchable={true}
                exportable={true}
                pagination={true}
                rowsPerPage={rowsPerPage}
                totalRecords={totalRecords}
                currentPage={page}
                onPageChange={(newPage) => {
                    setPage(newPage);
                }}
                search={search}
                onSearch={(term) => {
                    setSearch(term);
                }}
            />

            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>View Purchase Order - {selectedArticle?.article_name}</DialogTitle>
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
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
            </Dialog>
        </>
    );
};
export default TransistRegister;
