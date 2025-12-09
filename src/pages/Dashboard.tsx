import { FileCheck, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { RecentProducts } from "@/components/dashboard/RecentProducts";
import { RecentSubmissions } from "@/components/dashboard/RecentSubmissions";
import { QuoteTemplates } from "@/components/dashboard/QuoteTemplates";

export default function Dashboard() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: "Dashboard" }]}
      />
      <div className="flex-1 overflow-auto bg-sidebar">
        <div className="p-6 space-y-6">
          {/* Welcome Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-bold">{getGreeting()}, Calum W!</h1>
            <p className="text-muted-foreground">
              Here's what's happening with your portfolio today
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<FileCheck className="h-6 w-6 text-white" />}
              iconColor="bg-primary"
              title="Active Policies"
              value={352}
              trend={{ value: "+12", positive: true }}
              subtitle="Across all statuses"
            />
            <StatCard
              icon={<Clock className="h-6 w-6 text-white" />}
              iconColor="bg-insurance-urgent"
              title="Quotes Pending Action"
              value={16}
              badge={{ text: "Urgent", variant: "warning" }}
              subtitle="Require immediate attention"
            />
            <StatCard
              icon={<AlertCircle className="h-6 w-6 text-white" />}
              iconColor="bg-insurance-referred"
              title="Active Policies"
              value={34}
              subtitle="12 due this month"
            />
            <StatCard
              icon={<TrendingUp className="h-6 w-6 text-white" />}
              iconColor="bg-success"
              title="This Week's Activity"
              value={42}
              trend={{ value: "+8%", positive: true }}
              subtitle="New submissions & quotes"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed - Takes 2 columns */}
            <div className="lg:col-span-2">
              <ActivityFeed />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              <RecentProducts />
              <RecentSubmissions />
            </div>
          </div>

          {/* Quote Templates */}
          <QuoteTemplates />
        </div>
      </div>
    </>
  );
}
