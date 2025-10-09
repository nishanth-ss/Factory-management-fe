import { RawMaterialBatchesDialog } from "@/components/RawMaterialComp/RawMaterialBatchComp";
import { Button } from "@/components/ui/button";
import { useRawMaterialBatches } from "@/hooks/useRawMaterialBatch";
import { Edit, Eye, Plus } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import DataTable from "@/components/DataTable";
import { ViewDialog } from "@/components/common/ViewDialogBox";
import StatusBadge from "@/components/StatusBadge";

interface BatchFormData {
    id?: string;
    batch_no: string;
    product_id: string;
    start_date: string;
    end_date: string;
    status: string;
    notes: string;
    product_name?: string;
    product_code?: string;
}

const BatchPage = () => {
    const [search, setSearch] = useState("");
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [openBatchesDialog, setOpenBatchesDialog] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<BatchFormData>({
        id: "",
        batch_no: "",
        product_id: "",
        start_date: "",
        end_date: "",
        status: "",
        notes: "",
    });
    const [page, setPage] = useState(1);
    const rowsPerPage = 5;
    const debouncedSearch = useDebounce(search, 350);
    const { data: batches } = useRawMaterialBatches({ page: page, limit: rowsPerPage, search: debouncedSearch });
    const batchData = batches?.data || [];
    const batchColumns = [
        {
            header: "Batch No",
            key: "batch_no",
        },
        {
            header: "Product",
            key: "product_id",
            render: (_value: any, row: any) => row.product_name + " - " + row.product_code,
        },
        {
            header: "Start Date",
            key: "start_date",
            render: (_value: any, row: any) => new Date(row.start_date).toLocaleDateString(),
        },
        {
            header: "End Date",
            key: "end_date",
            render: (_value: any, row: any) => new Date(row.end_date).toLocaleDateString(),
        },
        {
            header: "Status",
            key: "status",
            render: (_value: any, row: any) => <StatusBadge status={row.status} />,
        },
        {
            header: "Notes",
            key: "notes",
            render: (_value: any, row: any) => row.notes,
        },
        {
            header: "Actions",
            key: "actions",
            render: (_value: any, row: any) => (
                <div className="flex gap-1">
                    <Button variant="outline" size="sm" data-testid={`button-view-batch-${row.id}`} onClick={() => { setSelectedBatch(row), setIsViewDialogOpen(true) }}>
                        <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-edit-batch-${row.id}`} onClick={() => { setSelectedBatch(row), setOpenBatchesDialog(true) }}>
                        <Edit className="h-3 w-3" />
                    </Button>
                </div>
            )
        },
    ]

    return (
        <div>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Batches</h1>
                    <p className="text-muted-foreground">Manage batches</p>
                </div>
                <Button data-testid="button-create-material" onClick={() => setOpenBatchesDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Batch
                </Button>

            </div>
            <RawMaterialBatchesDialog
                open={openBatchesDialog}
                onOpenChange={setOpenBatchesDialog}
                selectedBatch={selectedBatch}
                setSelectedBatch={setSelectedBatch}
            />

            <ViewDialog
                open={isViewDialogOpen}
                onOpenChange={() => setIsViewDialogOpen(false)}
                handleClose={() => {setIsViewDialogOpen(false), setSelectedBatch({batch_no: "", product_id: "", start_date: "", end_date: "", status: "planned", notes: ""})}}
                title="Batch"
                subtitle={selectedBatch?.batch_no}
                children={
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Batch No:</strong> {selectedBatch?.batch_no}</p>
                                    <p><strong>Product:</strong> {selectedBatch?.product_name + " - " + selectedBatch?.product_code}</p>
                                    <p><strong>Start Date:</strong> {new Date(selectedBatch?.start_date).toLocaleDateString()}</p>
                                    <p><strong>End Date:</strong> {new Date(selectedBatch?.end_date).toLocaleDateString()}</p>
                                    <p><strong>Status:</strong> {selectedBatch?.status}</p>
                                    <p><strong>Notes:</strong> {selectedBatch?.notes}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            />

            <DataTable
                title="Batches"
                columns={batchColumns}
                data={batchData || []}
                searchable={true}
                exportable={true}
                pagination={true}
                rowsPerPage={rowsPerPage}
                totalRecords={batches?.total || 0}
                currentPage={page}
                onPageChange={(newPage) => setPage(newPage)}
                search={search}
                onSearch={(term) => {
                    setSearch(term);
                    setPage(1);
                }}
            />
        </div>
    );
};

export default BatchPage;
