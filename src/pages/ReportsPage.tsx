import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown,
  Package, 
  Factory, 
  ShoppingCart, 
  IndianRupee,
  Calendar,
  Download,
  FileText,
  Activity
} from "lucide-react";
import { formatINR } from "@/lib/currency";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {  useReportQuery, useReports } from "@/hooks/useReports";
import { exportToExcel } from "@/components/ExportToExcel";

interface MetricCard {
  title: string;
  value: number | string;
  change?: number;
  changeType?: "positive" | "negative" | "neutral";
  icon: any;
  format?: "currency" | "number" | "percentage";
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface ProductValue {
  product_name: string;
  total_production_value: string;
}

interface ExpenditureItem {
  category: string;
  total_amount: string;
}

function MetricSummaryCard({ metric }: { metric: MetricCard }) {
  const formatValue = (value: number | string) => {
    if (typeof value === "string") return value;
    
    switch (metric.format) {
      case "currency":
        return formatINR(value);
      case "percentage":
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
        <metric.icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
          {formatValue(metric.value)}
        </div>
        {metric.change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {metric.changeType === "positive" ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : metric.changeType === "negative" ? (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            ) : null}
            <span className={
              metric.changeType === "positive" ? "text-green-500" : 
              metric.changeType === "negative" ? "text-red-500" : ""
            }>
              {metric.change > 0 ? "+" : ""}{metric.change.toFixed(1)}%
            </span>
            <span className="ml-1">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SimpleBarChart({ data, title }: { data: ChartData[]; title: string }) {
  const maxValue = Math.max(...(data?.map(d => d.value) ?? [0]));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data?.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">
                  {formatINR(item.value)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-primary transition-all duration-500"
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || undefined
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ReportCard({ 
  title, 
  description, 
  icon: Icon, 
  onGenerate 
}: { 
  title: string; 
  description: string; 
  icon: any; 
  onGenerate: () => void;
}) {
  
  return (
    <Card className="hover-elevate">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onGenerate}
              data-testid={`button-generate-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("current-month");
  const [reportType, setReportType] = useState("overview");
  const [reportDateRange, setReportDateRange] = useState("current_month");

  const { data: reports } = useReports();
  const reportData = reports?.data?.kpis;
  const productionData = reports?.data?.productValues;
  const compareProduction = reportData?.kpi_percentage
  const expenditureBreakdown = reports?.data?.expenditureBreakdown;
  const { fetchReport } = useReportQuery();
    const metrics: MetricCard[] = [
    {
      title: "Total Production",
      value: Number(reportData?.total_production),
      change: compareProduction?.total_production,
      changeType: compareProduction?.total_production > 0 ? "positive" : "negative",
      icon: Factory,
      format: "number",
    },
    {
      title: "Material Efficiency",
      value: Number(reportData?.industrial_efficiency),
      change: compareProduction?.industrial_efficiency,
      changeType: compareProduction?.industrial_efficiency > 0 ? "positive" : "negative",
      icon: Package,
      format: "percentage",
    },
    {
      title: "Total Expenditure",
      value: Number(reportData?.total_expenditures),
      change: compareProduction?.total_expenditures,
      changeType: compareProduction?.total_expenditures > 0 ? "positive" : "negative",
      icon: IndianRupee,
      format: "currency",
    },
    {
      title: "Active Vendors",
      value: Number(reportData?.active_vendors),
      change: compareProduction?.active_vendors,
      changeType: compareProduction?.active_vendors > 0 ? "positive" : "negative",
      icon: ShoppingCart,
      format: "number",
    },
  ];

  const transformProductionData = (productValues: ProductValue[]): ChartData[] => {
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]; // extra colors for flexibility
  
    return productValues?.map((item, index) => ({
      name: item.product_name,
      value: Number(item.total_production_value),
      color: colors[index % colors.length], 
    }));
  };

  const transformExpenditureData = (
    expenditureBreakdown: ExpenditureItem[]
  ): ChartData[] => {
    // Define color palette (can be adjusted to match your design)
    const colors = ["#8b5cf6", "#06b6d4", "#84cc16", "#f97316", "#e11d48", "#0ea5e9"];
  
    return expenditureBreakdown?.map((item, index) => ({
      name: item.category,
      value: Number(item.total_amount),
      color: colors[index % colors.length], // cycle through colors if there are more categories
    }));
  };

  const handleGenerateReport = async (reportName: string) => {
    try {
      const data = await fetchReport(reportName, reportDateRange);
      exportToExcel(reportName, data);
    } catch (err: any) {
      console.log(err.message || "Failed to fetch report");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="heading-reports">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-export-all-reports">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button variant="outline" size="sm" data-testid="button-schedule-reports">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Reports
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[200px]" data-testid="select-date-range">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-month">Current Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="last-3-months">Last 3 Months</SelectItem>
            <SelectItem value="last-6-months">Last 6 Months</SelectItem>
            <SelectItem value="current-year">Current Year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-[200px]" data-testid="select-report-type">
            <SelectValue placeholder="Report Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Overview</SelectItem>
            <SelectItem value="production">Production</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
            <SelectItem value="vendor">Vendor Performance</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="secondary" data-testid="badge-date-range">
          {format(startOfMonth(new Date()), "MMM dd")} - {format(endOfMonth(new Date()), "MMM dd, yyyy")}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <MetricSummaryCard key={index} metric={metric} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart 
          data={transformProductionData(productionData)} 
          title="Production Value by Product" 
        />
        <SimpleBarChart 
          data={transformExpenditureData(expenditureBreakdown)} 
          title="Expenditure Breakdown" 
        />
      </div>

      {/* Report Generation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Generate Reports</h2>
          <Select value={reportDateRange} onValueChange={setReportDateRange}>
          <SelectTrigger className="w-[200px]" data-testid="select-date-range">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current_month">Current Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="last_3_months">Last 3 Months</SelectItem>
            <SelectItem value="last_6_months">Last 6 Months</SelectItem>
            <SelectItem value="current_year">Current Year</SelectItem>
          </SelectContent>
        </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ReportCard
            title="Production Summary"
            description="Detailed production metrics, efficiency, and batch analysis"
            icon={Factory}
            onGenerate={() => handleGenerateReport("production-report")}
          />
          <ReportCard
            title="Financial Report"
            description="Cost analysis, expenditure breakdown, and budget variance"
            icon={IndianRupee}
            onGenerate={() => handleGenerateReport("financial-report")}
          />
          <ReportCard
            title="Inventory Analysis"
            description="Stock levels, material consumption, and reorder recommendations"
            icon={Package}
            onGenerate={() => handleGenerateReport("inventory-report")}
          />
          <ReportCard
            title="Vendor Performance"
            description="Vendor reliability, delivery times, and cost analysis"
            icon={ShoppingCart}
            onGenerate={() => handleGenerateReport("vendor-report")}
          />
          <ReportCard
            title="Quality Control"
            description="QC metrics, batch approvals, and rejection analysis"
            icon={Activity}
            onGenerate={() => handleGenerateReport("quality-control-report")}
          />
          <ReportCard
            title="Operational Efficiency"
            description="Overall efficiency metrics and optimization opportunities"
            icon={TrendingUp}
            onGenerate={() => handleGenerateReport("quality-operationEfficiency-report")}
          />
        </div>
      </div>
    </div>
  );
}