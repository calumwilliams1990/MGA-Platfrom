import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

const credsSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email" }).max(255),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(72),
});

const requestSchema = z.object({
  full_name: z.string().trim().min(1, "Required").max(120),
  email: z.string().trim().email("Invalid email").max(255),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Request access form state
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqCompany, setReqCompany] = useState("");
  const [reqReason, setReqReason] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credsSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast({ title: "Invalid input", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/", { replace: true });
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = requestSchema.safeParse({
      full_name: reqName,
      email: reqEmail,
      company: reqCompany,
      reason: reqReason,
    });
    if (!parsed.success) {
      toast({ title: "Invalid input", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("login_requests").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      company: parsed.data.company || null,
      reason: parsed.data.reason || null,
    });
    setBusy(false);
    if (error) {
      logger.error("Login request failed", error);
      toast({ title: "Request failed", description: error.message, variant: "destructive" });
      return;
    }
    setRequestSent(true);
    setReqName(""); setReqEmail(""); setReqCompany(""); setReqReason("");
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({ title: "Google sign in failed", description: String(result.error), variant: "destructive" });
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      navigate("/", { replace: true });
    } catch (err) {
      logger.error("Google sign in error", err);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Velonix Broker Portal</CardTitle>
          <CardDescription>Sign in or request access to the portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="request">Request access</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input id="signin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
              </form>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
                Continue with Google
              </Button>
            </TabsContent>
            <TabsContent value="request">
              {requestSent ? (
                <div className="mt-4 space-y-3 text-sm">
                  <p className="font-medium">Request received.</p>
                  <p className="text-muted-foreground">
                    Thanks — we'll review your request and reach out by email once your account is approved.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setRequestSent(false)}>
                    Submit another request
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRequestAccess} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="req-name">Full name</Label>
                    <Input id="req-name" value={reqName} onChange={(e) => setReqName(e.target.value)} required maxLength={120} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req-email">Work email</Label>
                    <Input id="req-email" type="email" value={reqEmail} onChange={(e) => setReqEmail(e.target.value)} required maxLength={255} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req-company">Company / Brokerage</Label>
                    <Input id="req-company" value={reqCompany} onChange={(e) => setReqCompany(e.target.value)} maxLength={160} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req-reason">Reason for access</Label>
                    <Textarea id="req-reason" value={reqReason} onChange={(e) => setReqReason(e.target.value)} maxLength={1000} rows={3} />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>Submit request</Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Accounts are created by Velonix after review. You'll be notified by email.
                  </p>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
