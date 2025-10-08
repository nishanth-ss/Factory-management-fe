import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  IndianRupee, 
  Package, 
  ShoppingCart, 
  Factory, 
  TrendingUp, 
  TrendingDown,
  Filter,
  Download
} from "lucide-react";
import { formatINR } from "@/lib/currency";
import { format } from "date-fns";
import { useExpenditures } from "@/hooks/useExpenditure";

interface ExpenditureItem {
  id: string;
  category: "materials" | "production" | "procurement" | "operations";
  description: string;
  amount: number;
  date: string;
  reference?: string;
  type: "cost" | "expense";
}


interface ExpenditureItem1 {
  id: string;
  title: string;
  category: "materials" | "production" | "vendor" | "expense";
  amount: number;
  date: string;
  ref_no?: string;
  type: "materials" | "production" | "vendor" | "expense";
}

function ExpenditureCard1({ item }: { item: ExpenditureItem1 }) {
  const categoryIcons = {
    materials: Package,
    production: Factory,
    vendor: ShoppingCart,
    expense: TrendingUp,
  };

  const categoryColors = {
    materials: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    production: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
    vendor: "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    expense: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  };

  const Icon = categoryIcons[item.type];

  return (
    <Card className="hover-elevate" data-testid={`card-expenditure-${item.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-md ${categoryColors[item.type]}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-medium text-sm" data-testid={`text-expenditure-description-${item.id}`}>
                {item.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {format(new Date(item.date), "MMM dd, yyyy")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-lg" data-testid={`text-expenditure-amount-${item.id}`}>
              {formatINR(item.amount)}
            </div>
            <Badge 
              variant={item.type === "expense" ? "secondary" : "outline"} 
              className="text-xs"
              data-testid={`badge-expenditure-type-${item.id}`}
            >
              {item.type}
            </Badge>
          </div>
        </div>
        {item.ref_no && (
          <div className="text-xs text-muted-foreground">
            Ref: {item.ref_no}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({ 
  title, 
  amount, 
  icon: Icon, 
  change, 
  changeType = "neutral" 
}: { 
  title: string; 
  amount: number; 
  icon: any; 
  change?: number; 
  changeType?: "positive" | "negative" | "neutral";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-summary-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {formatINR(amount)}
        </div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {changeType === "positive" ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : changeType === "negative" ? (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            ) : null}
            <span className={
              changeType === "positive" ? "text-green-500" : 
              changeType === "negative" ? "text-red-500" : ""
            }>
              {change > 0 ? "+" : ""}{change.toFixed(1)}%
            </span>
            <span className="ml-1">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ExpenditurePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { data: expenditures } = useExpenditures();
  const topCards = expenditures?.data?.monthlyCosts?.[0];
  const detailsCardData = expenditures?.data?.detailedRecords;

  const mockExpenditures: ExpenditureItem[] = [
    {
      id: "1",
      category: "materials",
      description: "Steel Sheet Purchase",
      amount: 125000,
      date: "2025-09-20",
      reference: "PO-2025-001",
      type: "cost",
    },
    {
      id: "2", 
      category: "production",
      description: "Production Batch - Widget Manufacturing",
      amount: 85000,
      date: "2025-09-19",
      reference: "PB-TEST-001",
      type: "cost",
    },
    {
      id: "3",
      category: "procurement",
      description: "Vendor Payment Processing",
      amount: 5000,
      date: "2025-09-18",
      reference: "PMT-2025-045",
      type: "expense",
    },
    {
      id: "4",
      category: "operations",
      description: "Factory Utilities",
      amount: 35000,
      date: "2025-09-17",
      type: "expense",
    },
    {
      id: "5",
      category: "materials",
      description: "Aluminum Rod Purchase",
      amount: 95000,
      date: "2025-09-16",
      reference: "PO-2025-002",
      type: "cost",
    },
  ];

  const filteredExpenditures = mockExpenditures.filter((item) => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="heading-expenditure">Expenditure</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-export-expenditure">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" data-testid="button-filter-expenditure">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Expenses"
          amount={topCards?.grand_total_cost}
          icon={IndianRupee}
          change={Number(topCards?.change_from_last_month?.grand_total_cost) || 0}
          changeType={Number(topCards?.change_from_last_month?.grand_total_cost) > 0 ? "positive" : "negative"}
        />
        <SummaryCard
          title="Materials Cost"
          amount={topCards?.total_material_cost}
          icon={Package}
          change={Number(topCards?.change_from_last_month?.total_material_cost) || 0}
          changeType={Number(topCards?.change_from_last_month?.total_material_cost) > 0 ? "positive" : "negative"}
        />
        <SummaryCard
          title="Production Cost"
          amount={topCards?.total_production_cost}
          icon={Factory}
          change={Number(topCards?.change_from_last_month?.total_production_cost) || 0}
          changeType={Number(topCards?.change_from_last_month?.total_production_cost) > 0 ? "positive" : "negative"}
        />
        <SummaryCard
          title="Operations Cost"
          amount={topCards?.total_operation_expense}
          icon={TrendingUp}
          change={Number(topCards?.change_from_last_month?.total_operation_expense) || 0}
          changeType={Number(topCards?.change_from_last_month?.total_operation_expense) > 0 ? "positive" : "negative"}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search expenditures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-expenditure"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="materials">Materials</SelectItem>
            <SelectItem value="production">Production</SelectItem>
            <SelectItem value="procurement">Procurement</SelectItem>
            <SelectItem value="operations">Operations</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-type-filter">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="cost">Cost</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="secondary" data-testid="badge-expenditure-count">
          {filteredExpenditures.length} item{filteredExpenditures.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Expenditure List */}
      {filteredExpenditures.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <IndianRupee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No expenditures found</h3>
            <p className="text-muted-foreground">
              {searchTerm || categoryFilter !== "all" || typeFilter !== "all" 
                ? "No expenditures match your current filters." 
                : "No expenditure data available for this period."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* {filteredExpenditures.map((item) => (
            <ExpenditureCard key={item.id} item={item} />
          ))} */}

          {
            detailsCardData?.map((item: any) => (
              <ExpenditureCard1 key={item.id} item={item} />
            ))
          }
        </div>
      )}
    </div>  
  );
}