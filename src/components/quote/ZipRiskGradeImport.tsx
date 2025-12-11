import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ZipRiskGradeImportProps {
  onImportComplete?: () => void;
}

interface ParsedZipData {
  zip_code: string;
  risk_grade: string;
  state?: string;
  county?: string;
}

export function ZipRiskGradeImport({ onImportComplete }: ZipRiskGradeImportProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    total: number;
  } | null>(null);

  const parseExcelFile = async (file: File): Promise<ParsedZipData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          
          // Look for a sheet named "zip" or "ZIP" or use the first sheet
          let sheetName = workbook.SheetNames.find(
            (name) => name.toLowerCase() === "zip"
          );
          if (!sheetName) {
            sheetName = workbook.SheetNames[0];
          }
          
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
          
          // Find header row and column indices
          const headerRow = jsonData[0] as string[];
          const zipColIndex = headerRow.findIndex(
            (h) => h && String(h).toLowerCase().includes("zip")
          );
          const gradeColIndex = headerRow.findIndex(
            (h) => h && (String(h).toLowerCase().includes("grade") || String(h).toLowerCase().includes("risk"))
          );
          const stateColIndex = headerRow.findIndex(
            (h) => h && String(h).toLowerCase().includes("state")
          );
          const countyColIndex = headerRow.findIndex(
            (h) => h && String(h).toLowerCase().includes("county")
          );

          if (zipColIndex === -1 || gradeColIndex === -1) {
            reject(new Error("Could not find ZIP and Risk Grade columns. Please ensure your spreadsheet has columns containing 'zip' and 'grade' or 'risk' in the headers."));
            return;
          }

          const parsedData: ParsedZipData[] = [];
          
          // Start from row 1 (skip header)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as (string | number)[];
            const zipCode = row[zipColIndex];
            const riskGrade = row[gradeColIndex];
            
            if (zipCode && riskGrade) {
              const grade = String(riskGrade).toUpperCase().trim();
              // Validate grade is A-E
              if (["A", "B", "C", "D", "E"].includes(grade)) {
                parsedData.push({
                  zip_code: String(zipCode).trim().padStart(5, "0"),
                  risk_grade: grade,
                  state: stateColIndex !== -1 ? String(row[stateColIndex] || "").trim() || undefined : undefined,
                  county: countyColIndex !== -1 ? String(row[countyColIndex] || "").trim() || undefined : undefined,
                });
              }
            }
          }
          
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsBinaryString(file);
    });
  };

  const importToDatabase = async (data: ParsedZipData[]) => {
    const batchSize = 100;
    let successCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from("zip_risk_grades")
        .upsert(batch, { onConflict: "zip_code" });
      
      if (error) {
        failedCount += batch.length;
        console.error("Batch insert error:", error);
      } else {
        successCount += batch.length;
      }
      
      setUploadProgress(Math.round(((i + batch.length) / data.length) * 100));
    }
    
    return { success: successCount, failed: failedCount, total: data.length };
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setImportResult(null);

    try {
      toast.info("Parsing Excel file...");
      const parsedData = await parseExcelFile(file);
      
      if (parsedData.length === 0) {
        toast.error("No valid ZIP codes found in the file");
        setIsUploading(false);
        return;
      }

      toast.info(`Found ${parsedData.length} ZIP codes. Importing...`);
      const result = await importToDatabase(parsedData);
      
      setImportResult(result);
      
      if (result.failed === 0) {
        toast.success(`Successfully imported ${result.success} ZIP codes`);
      } else {
        toast.warning(`Imported ${result.success} ZIP codes, ${result.failed} failed`);
      }
      
      onImportComplete?.();
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to import file");
    } finally {
      setIsUploading(false);
    }
  }, [onImportComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <Loader2 className="h-10 w-10 text-primary mx-auto mb-3 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        )}
        <p className="font-medium mb-1">
          {isUploading ? "Importing ZIP codes..." : "Import ZIP Risk Grades"}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your rater's ZIP tab (.xlsx, .xls, or .csv)
        </p>
        {!isUploading && (
          <Button variant="outline" type="button">Browse Files</Button>
        )}
      </div>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            {uploadProgress}% complete
          </p>
        </div>
      )}

      {importResult && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          importResult.failed === 0 ? "bg-success/10" : "bg-warning/10"
        }`}>
          {importResult.failed === 0 ? (
            <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium text-sm">Import Complete</p>
            <p className="text-sm text-muted-foreground">
              {importResult.success} of {importResult.total} ZIP codes imported successfully
              {importResult.failed > 0 && ` (${importResult.failed} failed)`}
            </p>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Expected columns:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>ZIP code (required) - column header containing "zip"</li>
          <li>Risk Grade (required) - A, B, C, D, or E - column header containing "grade" or "risk"</li>
          <li>State (optional) - column header containing "state"</li>
          <li>County (optional) - column header containing "county"</li>
        </ul>
      </div>
    </div>
  );
}