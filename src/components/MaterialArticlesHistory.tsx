import { ArrowLeft } from "lucide-react";
import { navigate } from "wouter/use-browser-location";
import DataTable from "./DataTable";
import { useManufactureArticleHistory } from "../hooks/useManufactureArticles";
import { useParams } from "wouter";
import { useState } from "react";

const MaterialArticlesHistory = () => {

    const { id } = useParams();
    const { data } = useManufactureArticleHistory(id || "");

    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    const rawMaterialData = data?.data || [];
    const totalRecords = data?.pagination?.total_records || 0;

    const historyColumns = [
    { 
        header: "Article Name", 
        key: "article_name" 
    },
    { 
        header: "Remarks", 
        key: "article_remarks" 
    },
    { 
        header: "Transit Date", 
        key: "transit_date" ,
        render: (date: string) => new Date(date).toLocaleDateString() 
    },
    { 
        header: "Quantity", 
        key: "quantity" 
    },
    { 
        header: "Remaining Qty", 
        key: "remaining_qty" 
    },
    {
        header: "Dispatched Qty",
        key: "total_dispatched_qty"
    },
    { 
        header: "Unit", 
        key: "unit" 
    },
    { 
        header: "Production", 
        key: "production_name" 
    },
    { 
        header: "Created At", 
        key: "created_at", 
        render: (date: string) => new Date(date).toLocaleDateString() 
    }
];

    return (
        <div>
            <div className="flex items-center gap-2">
                <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => navigate("/manufacturing-articles")} />
                <h1>Materials Articles History</h1>
            </div>

            <DataTable
                title="Materials Articles History"
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

export default MaterialArticlesHistory;
