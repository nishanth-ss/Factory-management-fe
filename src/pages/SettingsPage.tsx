import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Clock,
  AlertTriangle,
  Save,
  RefreshCw,
  Factory,
  IndianRupee
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: any;
}

function SettingCard({ 
  title, 
  description, 
  children 
}: { 
  title: string; 
  description: string; 
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

function ToggleSetting({ 
  label, 
  description, 
  checked, 
  onCheckedChange,
  testId
}: { 
  label: string; 
  description: string; 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void;
  testId: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch 
        checked={checked} 
        onCheckedChange={onCheckedChange}
        data-testid={testId}
      />
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  
  // System Settings
  const [companyName, setCompanyName] = useState("Manufacturing Corp Ltd");
  const [plantName, setPlantName] = useState("Main Factory");
  const [timeZone, setTimeZone] = useState("Asia/Kolkata");
  const [currency, setCurrency] = useState("INR");
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lowInventoryAlerts, setLowInventoryAlerts] = useState(true);
  const [productionAlerts, setProductionAlerts] = useState(true);
  const [vendorNotifications, setVendorNotifications] = useState(false);
  
  // Security Settings
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [auditLogging, setAuditLogging] = useState(true);
  const [dataRetention, setDataRetention] = useState("12");
  
  // Operational Settings
  const [autoGrnApproval, setAutoGrnApproval] = useState(false);
  const [productionAutoStart, setProductionAutoStart] = useState(false);
  const [inventoryTracking, setInventoryTracking] = useState(true);
  
  const handleSaveSettings = () => {
    // Mock save functionality
    toast({
      title: "Settings saved successfully",
      description: "Your configuration has been updated.",
    });
  };

  const handleResetSettings = () => {
    // Mock reset functionality
    toast({
      title: "Settings reset",
      description: "All settings have been restored to defaults.",
      variant: "destructive",
    });
  };

  const sections: SettingSection[] = [
    {
      id: "company",
      title: "Company Information",
      description: "Basic company and facility details",
      icon: Factory,
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Configure alert and notification preferences",
      icon: Bell,
    },
    {
      id: "security",
      title: "Security & Privacy",
      description: "Security settings and data retention policies",
      icon: Shield,
    },
    {
      id: "operations",
      title: "Operational Settings",
      description: "Workflow automation and process configuration",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="heading-settings">Settings</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleResetSettings}
            data-testid="button-reset-settings"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button 
            onClick={handleSaveSettings}
            data-testid="button-save-settings"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((section) => (
          <Card key={section.id} className="hover-elevate cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{section.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {section.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <SettingCard
          title="Company Information"
          description="Update your company and facility details"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                data-testid="input-company-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plant-name">Plant/Facility Name</Label>
              <Input
                id="plant-name"
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                data-testid="input-plant-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Select value={timeZone} onValueChange={setTimeZone}>
                <SelectTrigger data-testid="select-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">₹ Indian Rupee (INR)</SelectItem>
                  <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                  <SelectItem value="GBP">£ British Pound (GBP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SettingCard>

        {/* Notifications */}
        <SettingCard
          title="Notifications"
          description="Configure how and when you receive alerts"
        >
          <div className="space-y-4">
            <ToggleSetting
              label="Email Notifications"
              description="Receive notifications via email"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              testId="toggle-email-notifications"
            />
            <ToggleSetting
              label="Low Inventory Alerts"
              description="Get notified when stock levels are low"
              checked={lowInventoryAlerts}
              onCheckedChange={setLowInventoryAlerts}
              testId="toggle-low-inventory-alerts"
            />
            <ToggleSetting
              label="Production Alerts"
              description="Notifications for production status changes"
              checked={productionAlerts}
              onCheckedChange={setProductionAlerts}
              testId="toggle-production-alerts"
            />
            <ToggleSetting
              label="Vendor Notifications"
              description="Updates about vendor performance and delivery"
              checked={vendorNotifications}
              onCheckedChange={setVendorNotifications}
              testId="toggle-vendor-notifications"
            />
          </div>
        </SettingCard>

        {/* Security Settings */}
        <SettingCard
          title="Security & Privacy"
          description="Manage security settings and data retention"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                <SelectTrigger data-testid="select-session-timeout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-retention">Data Retention (months)</Label>
              <Select value={dataRetention} onValueChange={setDataRetention}>
                <SelectTrigger data-testid="select-data-retention">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="24">2 years</SelectItem>
                  <SelectItem value="36">3 years</SelectItem>
                  <SelectItem value="60">5 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ToggleSetting
              label="Audit Logging"
              description="Track all user actions and system changes"
              checked={auditLogging}
              onCheckedChange={setAuditLogging}
              testId="toggle-audit-logging"
            />
          </div>
        </SettingCard>

        {/* Operational Settings */}
        <SettingCard
          title="Operational Settings"
          description="Configure workflow automation and processes"
        >
          <div className="space-y-4">
            <ToggleSetting
              label="Auto GRN Approval"
              description="Automatically approve GRNs that meet criteria"
              checked={autoGrnApproval}
              onCheckedChange={setAutoGrnApproval}
              testId="toggle-auto-grn-approval"
            />
            <ToggleSetting
              label="Production Auto-Start"
              description="Automatically start production when materials are available"
              checked={productionAutoStart}
              onCheckedChange={setProductionAutoStart}
              testId="toggle-production-auto-start"
            />
            <ToggleSetting
              label="Real-time Inventory Tracking"
              description="Update inventory levels in real-time during transactions"
              checked={inventoryTracking}
              onCheckedChange={setInventoryTracking}
              testId="toggle-inventory-tracking"
            />
          </div>
        </SettingCard>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Application Version</Label>
              <Badge variant="outline" data-testid="badge-app-version">v1.0.0</Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Database Status</Label>
              <Badge variant="default" className="bg-green-500" data-testid="badge-db-status">
                Connected
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Last Backup</Label>
              <Badge variant="secondary" data-testid="badge-last-backup">
                2 hours ago
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Important Notice
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Some settings may require a system restart to take effect. 
                Always backup your data before making significant configuration changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}