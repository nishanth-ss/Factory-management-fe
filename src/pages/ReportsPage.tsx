import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Package, 
  Factory, 
  ShoppingCart, 
  IndianRupee,
  Calendar,
  Download,
  FileText,
  PieChart,
  Activity
} from "lucide-react";
import { formatINR } from "@/lib/currency";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

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
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => (
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

  // Mock data - in real app this would come from APIs
  const metrics: MetricCard[] = [
    {
      title: "Total Production",
      value: 1250,
      change: 15.3,
      changeType: "positive",
      icon: Factory,
      format: "number"
    },
    {
      title: "Material Efficiency",
      value: 94.2,
      change: 2.1,
      changeType: "positive",
      icon: Package,
      format: "percentage"
    },
    {
      title: "Total Expenditure",
      value: 2850000,
      change: -8.5,
      changeType: "positive",
      icon: IndianRupee,
      format: "currency"
    },
    {
      title: "Active Vendors",
      value: 28,
      change: 12.0,
      changeType: "positive",
      icon: ShoppingCart,
      format: "number"
    },
  ];

  const productionData: ChartData[] = [
    { name: "Widget A", value: 450000, color: "#3b82f6" },
    { name: "Widget B", value: 380000, color: "#10b981" },
    { name: "Widget C", value: 320000, color: "#f59e0b" },
    { name: "Widget D", value: 280000, color: "#ef4444" },
  ];

  const expenditureData: ChartData[] = [
    { name: "Raw Materials", value: 1200000, color: "#8b5cf6" },
    { name: "Production Costs", value: 850000, color: "#06b6d4" },
    { name: "Procurement", value: 450000, color: "#84cc16" },
    { name: "Operations", value: 350000, color: "#f97316" },
  ];

  const handleGenerateReport = (reportName: string) => {
    // Mock report generation - in real app would trigger download
    console.log(`Generating ${reportName} report...`);
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
          data={productionData} 
          title="Production Value by Product" 
        />
        <SimpleBarChart 
          data={expenditureData} 
          title="Expenditure Breakdown" 
        />
      </div>

      {/* Report Generation */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Generate Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ReportCard
            title="Production Summary"
            description="Detailed production metrics, efficiency, and batch analysis"
            icon={Factory}
            onGenerate={() => handleGenerateReport("Production Summary")}
          />
          <ReportCard
            title="Financial Report"
            description="Cost analysis, expenditure breakdown, and budget variance"
            icon={IndianRupee}
            onGenerate={() => handleGenerateReport("Financial Report")}
          />
          <ReportCard
            title="Inventory Analysis"
            description="Stock levels, material consumption, and reorder recommendations"
            icon={Package}
            onGenerate={() => handleGenerateReport("Inventory Analysis")}
          />
          <ReportCard
            title="Vendor Performance"
            description="Vendor reliability, delivery times, and cost analysis"
            icon={ShoppingCart}
            onGenerate={() => handleGenerateReport("Vendor Performance")}
          />
          <ReportCard
            title="Quality Control"
            description="QC metrics, batch approvals, and rejection analysis"
            icon={Activity}
            onGenerate={() => handleGenerateReport("Quality Control")}
          />
          <ReportCard
            title="Operational Efficiency"
            description="Overall efficiency metrics and optimization opportunities"
            icon={TrendingUp}
            onGenerate={() => handleGenerateReport("Operational Efficiency")}
          />
        </div>
      </div>
    </div>
  );
}