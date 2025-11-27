import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Home,
  Package,
  FileText,
  ShoppingBasket,
  ShoppingCart,
  Truck,
  Factory,
  IndianRupee,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ShieldMinus,
  NotebookPen,
  UserStar
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useDispatch } from "react-redux";
import { persistor } from "@/store/store";
import { logout } from "@/store/authSlice";
import logo from "@/assets/logo.png";

// Navigation items visible to all roles
const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Raw Materials", url: "/materials", icon: Package },
  // { title: "Product", url: "/product", icon: ShoppingBasket },
  // { title: "Batches", url: "/batches", icon: ShieldMinus },
  { title: "Indents", url: "/indents", icon: FileText },
  { title: "RM Purchase Orders", url: "/purchase-orders", icon: ShoppingCart },
  { title: "Manufacturing Articles", url: "/manufacturing-articles", icon: Factory },
  { title: "Transit Register", url: "/transist-register", icon: NotebookPen },
  { title: "Customer Order", url: "/customer-order", icon: UserStar },
  { title: "GRN", url: "/grn", icon: Truck },
  { title: "Production", url: "/production", icon: Factory },
  { title: "Expenditure", url: "/expenditure", icon: IndianRupee },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

// Admin / special menu items
const adminItems = [
  { title: "Vendors", url: "/vendors", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Users", url: "/users", icon: Users, allow: 1 },
  { title: "Logout", url: "/logout", icon: LogOut },
];

export default function AppSidebar() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const dispatch = useDispatch();

  // derive roleId from user object
  const roleString = (user?.role || "").toLowerCase();
  const roleId = roleString === "admin" ? 1 : 2;


  const handleLogout = async () => {
    // Clear redux auth state
    dispatch(logout());

    // Purge redux-persist storage
    await persistor.purge();

    // Clear any extra localStorage if needed
    localStorage.clear();

    // Navigate to login
    navigate("/login");
  };

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader>
        <div>
            <img src={logo} alt="AG soft solution" className="w-[60%] mx-auto" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => {
                if (item.allow && item.allow !== roleId) return null;

                return (
                  <SidebarMenuItem key={item.title}>
                    {item.title === "Logout" ? (
                      <SidebarMenuButton
                        onClick={handleLogout}
                        data-testid="nav-logout"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground">
          User: {roleId === 1 ? "Admin" : "User"}
          <br />
          Plant: Main Factory
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
