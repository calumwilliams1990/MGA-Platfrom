import { logger } from "@/lib/logger";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus, Calendar, DollarSign } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Policy {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  insured_name: string | null;
  policy_limit: number | null;
  inception_date: string | null;
  expiry_date: string | null;
  estimated_premium: number | null;
  product: "terror_liability" | "marine_tow";
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  pending: { label: "Pending", className: "bg-warning text-warning-foreground" },
  active: { label: "Active", className: "bg-success text-success-foreground" },
  expired: { label: "Expired", className: "bg-destructive text-destructive-foreground" },
};

export default function MyPolicies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const [tl, mt] = await Promise.all([
        supabase
          .from("policies")
          .select("id, created_at, updated_at, status, insured_name, policy_limit, inception_date, expiry_date, estimated_premium")
          .order("updated_at", { ascending: false }),
        supabase
          .from("marine_tow_quotes")
          .select("id, created_at, updated_at, status, insured_name, estimated_premium")
          .order("updated_at", { ascending: false }),
      ]);
      if (tl.error) throw tl.error;
      if (mt.error) throw mt.error;
      const combined: Policy[] = [
        ...(tl.data || []).map((p) => ({ ...p, product: "terror_liability" as const })),
        ...(mt.data || []).map((p) => ({
          ...p,
          policy_limit: null,
          inception_date: null,
          expiry_date: null,
          product: "marine_tow" as const,
        })),
      ].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
      setPolicies(combined);
    } catch (error) {
      logger.error("Error fetching policies:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "My Policies" }]} />
      <div className="flex-1 overflow-auto bg-sidebar">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-sidebar-foreground">My Policies</h1>
              <p className="text-sidebar-foreground/70">
                View and manage your saved policies
              </p>
            </div>
            <Link to="/quote/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Quote
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </Card>
              ))}
            </div>
          ) : policies.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No policies yet</h3>
              <p className="text-muted-foreground mb-4">
                Start a new quote to create your first policy
              </p>
              <Link to="/quote/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Quote
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {policies.map((policy) => (
                <Card key={policy.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium truncate max-w-[180px]">
                          {policy.insured_name || "Untitled Policy"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Updated {format(new Date(policy.updated_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusConfig[policy.status]?.className || statusConfig.draft.className}>
                      {statusConfig[policy.status]?.label || "Draft"}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {policy.inception_date && policy.expiry_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(policy.inception_date), "MMM d, yyyy")} — {format(new Date(policy.expiry_date), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>Limit: {formatCurrency(policy.policy_limit)}</span>
                    </div>
                    {policy.estimated_premium && (
                      <div className="text-sm font-medium text-primary">
                        Premium: {formatCurrency(policy.estimated_premium)}
                      </div>
                    )}
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <Link
                      to={
                        policy.product === "marine_tow"
                          ? `/quote/marine-tow?id=${policy.id}`
                          : `/quote/new?id=${policy.id}`
                      }
                    >
                      Continue Editing
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}