import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PI_PROVIDERS } from "@/lib/marineTowOptions";
import { toast } from "@/hooks/use-toast";
import { ShieldAlert } from "lucide-react";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
};

type ProductAccess = {
  user_id: string;
  product: string;
  pi_provider: string | null;
};

const PRODUCTS = [
  { key: "marine_tow", label: "Marine Tow", requiresPiProvider: true },
];

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = useIsAdmin();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [access, setAccess] = useState<ProductAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [profilesRes, accessRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_product_access").select("user_id, product, pi_provider"),
    ]);
    if (profilesRes.error) {
      toast({ title: "Failed to load users", description: profilesRes.error.message, variant: "destructive" });
    } else {
      setProfiles(profilesRes.data ?? []);
    }
    if (accessRes.error) {
      toast({ title: "Failed to load access", description: accessRes.error.message, variant: "destructive" });
    } else {
      setAccess(accessRes.data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const accessMap = useMemo(() => {
    const m = new Map<string, ProductAccess>();
    access.forEach((a) => m.set(`${a.user_id}:${a.product}`, a));
    return m;
  }, [access]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        (p.email ?? "").toLowerCase().includes(q) ||
        (p.full_name ?? "").toLowerCase().includes(q),
    );
  }, [profiles, search]);

  const toggleAccess = async (userId: string, product: string, enabled: boolean) => {
    if (enabled) {
      const { error } = await supabase
        .from("user_product_access")
        .upsert(
          { user_id: userId, product, pi_provider: null },
          { onConflict: "user_id,product" },
        );
      if (error) {
        toast({ title: "Could not grant access", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from("user_product_access")
        .delete()
        .eq("user_id", userId)
        .eq("product", product);
      if (error) {
        toast({ title: "Could not revoke access", description: error.message, variant: "destructive" });
        return;
      }
    }
    await loadData();
  };

  const setPiProvider = async (userId: string, product: string, provider: string) => {
    const { error } = await supabase
      .from("user_product_access")
      .upsert(
        { user_id: userId, product, pi_provider: provider },
        { onConflict: "user_id,product" },
      );
    if (error) {
      toast({ title: "Could not save provider", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "P&I provider saved" });
    await loadData();
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card className="p-8 flex items-start gap-4 max-w-2xl">
          <ShieldAlert className="h-6 w-6 text-destructive shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-semibold">Admin access required</h2>
            <p className="text-sm text-muted-foreground mt-1">
              You don't have permission to view this page.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administrator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage user product access and assigned P&I providers.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={loadData} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              {PRODUCTS.map((p) => (
                <TableHead key={p.key}>{p.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={2 + PRODUCTS.length} className="text-center text-muted-foreground py-8">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  {p.full_name || <span className="text-muted-foreground italic">(no name)</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{p.email}</TableCell>
                {PRODUCTS.map((prod) => {
                  const entry = accessMap.get(`${p.id}:${prod.key}`);
                  const enabled = !!entry;
                  return (
                    <TableCell key={prod.key}>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={enabled}
                          onCheckedChange={(v) => toggleAccess(p.id, prod.key, v)}
                        />
                        {enabled && prod.requiresPiProvider && (
                          <div className="flex items-center gap-2">
                            <Select
                              value={entry?.pi_provider ?? ""}
                              onValueChange={(v) => setPiProvider(p.id, prod.key, v)}
                            >
                              <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Assign P&I provider" />
                              </SelectTrigger>
                              <SelectContent>
                                {PI_PROVIDERS.map((name) => (
                                  <SelectItem key={name} value={name}>
                                    {name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!entry?.pi_provider && (
                              <Badge variant="destructive">Provider required</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
