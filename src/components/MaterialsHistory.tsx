import { ArrowLeft } from "lucide-react";
import { navigate } from "wouter/use-browser-location";
import DataTable from "./DataTable";
import { useRawMaterialHistory } from "../hooks/useRawMaterial";
import { useParams } from "wouter";
import { useState } from "react";

const MaterialsHistory = () => {

    const { id } = useParams();
    const { data } = useRawMaterialHistory(id || "");

    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    const rawMaterialData = data?.data?.data || [];
    const totalRecords = data?.data?.pagination?.total_records || 0;

    const historyColumns = [
        { header: "Issue Date", key: "issue_date", render: (issue_date: string) => new Date(issue_date).toLocaleDateString() },
        { header: "Description", key: "description" },
        { header: "Quantity Issued (kg)", key: "quantity_issued_kg" },
        { header: "Balance (kg)", key: "balance_kg" },
        { header: "Indent", key: "indent_number" },
        { header: "Remarks", key: "remarks" },
    ];

    return (
        <div>
            <div className="flex items-center gap-2">
                <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => navigate("/materials")} />
                <h1>Materials History</h1>
            </div>

            <DataTable
                title="Raw Material History"
                columns={historyColumns}
                data={rawMaterialData}
                searchable={false}
                exportable
                pagination
                rowsPerPage={rowsPerPage}
                totalRecords={totalRecords}
                currentPage={page}
                onPageChange={(newPage) => setPage(newPage)}
            />

        </div>
    );
};

export default MaterialsHistory;
