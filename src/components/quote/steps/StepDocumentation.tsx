import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Cloud, FileText, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteData } from "@/pages/NewQuote";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StepDocumentationProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function StepDocumentation({
  quoteData,
  updateQuoteData,
  onNext,
  onSkip,
}: StepDocumentationProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>(quoteData.documents);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...uploadedFiles, ...acceptedFiles];
      setUploadedFiles(newFiles);
      updateQuoteData({ documents: newFiles });
    },
    [uploadedFiles, updateQuoteData]
  );

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    updateQuoteData({ documents: newFiles });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
      "image/*": [".jpg", ".jpeg", ".png"],
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Documentation Upload</h2>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Upload documents to auto-populate form fields</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="text-muted-foreground">
        Upload existing documents to auto-populate form fields (optional)
      </p>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="font-medium mb-2">Click to upload or drag and drop</p>
        <p className="text-sm text-muted-foreground mb-4">
          ACORD forms, emails, SoV files, policy documents, or other supporting files
        </p>
        <Button type="button" variant="outline">
          Browse File
        </Button>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Uploaded Files</h3>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onSkip}>
          Skip and Enter Manually
        </Button>
        <Button onClick={onNext} disabled={uploadedFiles.length === 0}>
          Continue
        </Button>
      </div>
    </div>
  );
}
