import KPICard from '../KPICard';
import { Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function KPICardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <KPICard 
        title="Pending Indents"
        value={23}
        subtitle="Awaiting approval"
        icon={Clock}
        trend={{ direction: "up", value: "+12% from last week" }}
      />
      <KPICard 
        title="Active Batches"
        value={8}
        subtitle="In production"
        icon={Package}
        trend={{ direction: "down", value: "-2 from yesterday" }}
      />
      <KPICard 
        title="Low Stock Items"
        value={15}
        subtitle="Below reorder level"
        icon={AlertTriangle}
        trend={{ direction: "up", value: "+3 new alerts" }}
      />
      <KPICard 
        title="Completed Orders"
        value={142}
        subtitle="This month"
        icon={CheckCircle}
        trend={{ direction: "up", value: "+18% vs last month" }}
      />
    </div>
  );
}