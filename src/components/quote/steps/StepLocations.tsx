import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface StepLocationsProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Mock ZIP code data for demo
const zipRiskGrades: Record<string, { grade: "A" | "B" | "C" | "D" | "E"; state: string; county: string }> = {
  "10001": { grade: "A", state: "NY", county: "New York" },
  "10010": { grade: "A", state: "NY", county: "New York" },
  "90210": { grade: "B", state: "CA", county: "Los Angeles" },
  "77598": { grade: "B", state: "TX", county: "Harris" },
  "33101": { grade: "C", state: "FL", county: "Miami-Dade" },
};

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

  const addLocation = () => {
    if (!newStreetAddress.trim() || !newZipCode.trim()) return;

    const zip = newZipCode.trim();
    
    const riskInfo = zipRiskGrades[zip] || { grade: "C" as const, state: "Unknown", county: "Unknown" };
    
    // Determine status based on risk grade
    let status: Location["status"] = "accepted";
    if (riskInfo.grade === "A") {
      status = Math.random() > 0.3 ? "accepted" : "referred";
    } else if (riskInfo.grade === "D" || riskInfo.grade === "E") {
      status = "referred";
    }

    const newLocation: Location = {
      id: Date.now().toString(),
      address: newStreetAddress.trim(),
      name: newLocationName || undefined,
      zipCode: zip,
      state: riskInfo.state,
      county: riskInfo.county,
      riskGrade: riskInfo.grade,
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
          <div className="border-2 border-dashed rounded-xl p-8 text-center">
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">Upload Excel File</p>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop or click to upload a .xlsx or .csv file
            </p>
            <Button variant="outline">Browse Files</Button>
          </div>
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
                          <DropdownMenuItem>Edit</DropdownMenuItem>
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
    </div>
  );
}
