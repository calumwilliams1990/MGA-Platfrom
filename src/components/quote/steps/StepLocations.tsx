import { useState, useEffect } from "react";
import { Info, ChevronLeft, Plus, Search, MoreVertical, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { QuoteData, Location } from "@/pages/NewQuote";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ZipRiskGradeImport } from "../ZipRiskGradeImport";

interface StepLocationsProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  onNext: () => void;
  onBack: () => void;
}

type RiskGrade = "A" | "B" | "C" | "D" | "E";

interface ZipRiskData {
  risk_grade: RiskGrade;
  state: string | null;
  county: string | null;
}

const statusConfig = {
  accepted: { label: "Accepted", className: "bg-success text-success-foreground" },
  referred: { label: "Referral", className: "bg-insurance-referred text-white" },
  declined: { label: "Declined", className: "bg-destructive text-destructive-foreground" },
  missing: { label: "Missing", className: "bg-warning text-warning-foreground" },
};

export function StepLocations({
  quoteData,
  updateQuoteData,
  onNext,
  onBack,
}: StepLocationsProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "excel">("manual");
  const [newStreetAddress, setNewStreetAddress] = useState("");
  const [newZipCode, setNewZipCode] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [zipRiskCache, setZipRiskCache] = useState<Record<string, ZipRiskData>>({});
  const [zipLookupResult, setZipLookupResult] = useState<ZipRiskData | null>(null);
  const [isLookingUpZip, setIsLookingUpZip] = useState(false);

  // Lookup ZIP risk grade when ZIP code changes
  useEffect(() => {
    const lookupZip = async () => {
      const zip = newZipCode.trim();
      if (zip.length !== 5) {
        setZipLookupResult(null);
        return;
      }

      setIsLookingUpZip(true);
      const riskData = await fetchZipRiskGrade(zip);
      setZipLookupResult(riskData);
      setIsLookingUpZip(false);
    };

    const debounce = setTimeout(lookupZip, 300);
    return () => clearTimeout(debounce);
  }, [newZipCode]);

  // Fetch ZIP risk grade from database
  const fetchZipRiskGrade = async (zip: string): Promise<ZipRiskData> => {
    // Check cache first
    if (zipRiskCache[zip]) {
      return zipRiskCache[zip];
    }

    const { data, error } = await supabase
      .from("zip_risk_grades")
      .select("risk_grade, state, county")
      .eq("zip_code", zip)
      .maybeSingle();

    if (error || !data) {
      // Return default if not found
      return { risk_grade: "C", state: null, county: null };
    }

    const riskData: ZipRiskData = {
      risk_grade: data.risk_grade as RiskGrade,
      state: data.state,
      county: data.county,
    };

    // Cache the result
    setZipRiskCache((prev) => ({ ...prev, [zip]: riskData }));
    return riskData;
  };

  const addLocation = async () => {
    if (!newStreetAddress.trim() || !newZipCode.trim()) return;

    const zip = newZipCode.trim();
    
    const riskInfo = await fetchZipRiskGrade(zip);
    
    // Determine status based on risk grade - A, D, E are referral grades
    let status: Location["status"] = "accepted";
    if (riskInfo.risk_grade === "A" || riskInfo.risk_grade === "D" || riskInfo.risk_grade === "E") {
      status = "referred";
    }

    const newLocation: Location = {
      id: Date.now().toString(),
      address: newStreetAddress.trim(),
      name: newLocationName || undefined,
      zipCode: zip,
      state: riskInfo.state || "Unknown",
      county: riskInfo.county || "Unknown",
      riskGrade: riskInfo.risk_grade,
      type: "Commercial",
      status,
      propertyValue: 500000,
      contentsValue: 100000,
    };

    updateQuoteData({ locations: [...quoteData.locations, newLocation] });
    setNewStreetAddress("");
    setNewZipCode("");
    setNewLocationName("");
  };

  const removeLocation = (id: string) => {
    updateQuoteData({
      locations: quoteData.locations.filter((loc) => loc.id !== id),
    });
  };

  // Edit location state
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editAddress, setEditAddress] = useState("");
  const [editZipCode, setEditZipCode] = useState("");
  const [editLocationName, setEditLocationName] = useState("");

  const openEditDialog = (location: Location) => {
    setEditingLocation(location);
    setEditAddress(location.address);
    setEditZipCode(location.zipCode);
    setEditLocationName(location.name || "");
  };

  const saveEditedLocation = async () => {
    if (!editingLocation || !editAddress.trim() || !editZipCode.trim()) return;

    const zip = editZipCode.trim();
    const riskInfo = await fetchZipRiskGrade(zip);

    // Determine status based on risk grade
    let status: Location["status"] = "accepted";
    if (riskInfo.risk_grade === "A" || riskInfo.risk_grade === "D" || riskInfo.risk_grade === "E") {
      status = "referred";
    }

    const updatedLocation: Location = {
      ...editingLocation,
      address: editAddress.trim(),
      name: editLocationName || undefined,
      zipCode: zip,
      state: riskInfo.state || "Unknown",
      county: riskInfo.county || "Unknown",
      riskGrade: riskInfo.risk_grade,
      status,
    };

    updateQuoteData({
      locations: quoteData.locations.map((loc) =>
        loc.id === editingLocation.id ? updatedLocation : loc
      ),
    });

    setEditingLocation(null);
  };

  const filteredLocations = quoteData.locations.filter((loc) => {
    const matchesSearch = loc.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || loc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Insured Location Information</h2>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Add locations to be covered under this policy</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="text-muted-foreground">
        Add the locations to be covered under this policy
      </p>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "manual" | "excel")}>
        <TabsList>
          <TabsTrigger value="manual">Add Locations Manually</TabsTrigger>
          <TabsTrigger value="excel">Upload Via Excel</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Street address for the policy document</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="streetAddress"
                placeholder="34 Down Street, New York, NY"
                value={newStreetAddress}
                onChange={(e) => setNewStreetAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ZIP code for risk grading</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="zipCode"
                placeholder="10010"
                value={newZipCode}
                onChange={(e) => setNewZipCode(e.target.value)}
                maxLength={5}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="locationName">Location Name (Optional)</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>A friendly name for this location</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="locationName"
                placeholder="Head Office"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
              />
            </div>
          </div>

          {/* Risk Grade Lookup Display */}
          {newZipCode.trim().length === 5 && (
            <div className={cn(
              "p-4 rounded-lg border",
              isLookingUpZip ? "bg-muted/50 border-muted" :
              zipLookupResult?.risk_grade === "A" ? "bg-insurance-referred/10 border-insurance-referred" :
              zipLookupResult?.risk_grade === "D" || zipLookupResult?.risk_grade === "E" ? "bg-insurance-referred/10 border-insurance-referred" :
              "bg-success/10 border-success"
            )}>
              {isLookingUpZip ? (
                <p className="text-sm text-muted-foreground">Looking up ZIP code...</p>
              ) : zipLookupResult ? (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Risk Grade: {zipLookupResult.risk_grade}</span>
                      {(zipLookupResult.risk_grade === "A" || zipLookupResult.risk_grade === "D" || zipLookupResult.risk_grade === "E") && (
                        <Badge className="bg-insurance-referred text-white">Referral ZIP</Badge>
                      )}
                    </div>
                    {(zipLookupResult.county || zipLookupResult.state) && (
                      <p className="text-sm text-muted-foreground">
                        {[zipLookupResult.county, zipLookupResult.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  {zipLookupResult.risk_grade === "A" && (
                    <p className="text-sm text-insurance-referred font-medium">
                      Grade A requires underwriter review
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">ZIP code not found in database</p>
              )}
            </div>
          )}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={addLocation}
            disabled={!newStreetAddress.trim() || !newZipCode.trim()}
          >
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        </TabsContent>

        <TabsContent value="excel" className="space-y-4">
          <ZipRiskGradeImport 
            onImportComplete={() => {
              // Clear the cache so new lookups fetch fresh data
              setZipRiskCache({});
            }} 
          />
        </TabsContent>
      </Tabs>

      {/* Locations Table */}
      {quoteData.locations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Added Locations</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  className="pl-9 w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="referred">Referred</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="missing">Missing Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Risk Grade</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm truncate max-w-xs">
                          {location.address}
                        </p>
                        {location.name && (
                          <p className="text-xs text-muted-foreground">
                            {location.name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>Grade {location.riskGrade}</TableCell>
                    <TableCell>{location.type}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", statusConfig[location.status].className)}>
                        {statusConfig[location.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(location)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => removeLocation(location.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {filteredLocations.length} of {quoteData.locations.length} results
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext}>Continue</Button>
      </div>

      {/* Edit Location Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-address">Street Address</Label>
              <Input
                id="edit-address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-zip">ZIP Code</Label>
              <Input
                id="edit-zip"
                value={editZipCode}
                onChange={(e) => setEditZipCode(e.target.value)}
                maxLength={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Location Name (Optional)</Label>
              <Input
                id="edit-name"
                value={editLocationName}
                onChange={(e) => setEditLocationName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLocation(null)}>
              Cancel
            </Button>
            <Button onClick={saveEditedLocation} disabled={!editAddress.trim() || !editZipCode.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
