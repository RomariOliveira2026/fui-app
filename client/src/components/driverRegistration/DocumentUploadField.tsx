import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { isLocalDemoDev } from "@/lib/demoMode";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { fuiBrand } from "@/lib/fuiTheme";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

type DocumentUploadFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  accept?: string;
  className?: string;
};

export default function DocumentUploadField({
  label,
  value,
  onChange,
  hint,
  accept = "image/*",
  className,
}: DocumentUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDemoUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const uploadDocument = trpc.upload.uploadDocument.useMutation();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/") && !file.type.includes("pdf")) {
      toast.error("Envie uma imagem (JPG, PNG) ou PDF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 5MB");
      return;
    }

    setUploading(true);
    try {
      if (isDemoUser || isLocalDemoDev()) {
        onChange(URL.createObjectURL(file));
        toast.success("Documento anexado");
        return;
      }

      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await uploadDocument.mutateAsync({
        fileData: dataUrl,
        fileName: file.name,
        fileType: file.type,
      });
      onChange(result.url);
      toast.success("Documento enviado");
    } catch {
      toast.error("Falha ao enviar documento");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

      {value ? (
        <div className="relative rounded-xl border border-border overflow-hidden bg-muted/20">
          {value.includes("pdf") ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              PDF anexado
            </div>
          ) : (
            <img src={value} alt="" className="h-32 w-full object-cover" />
          )}
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border",
            "bg-muted/10 px-4 py-8 text-sm text-muted-foreground transition-colors",
            "hover:border-primary/40 hover:bg-primary/5"
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <ImagePlus className="h-6 w-6 text-primary" />
          )}
          <span>{uploading ? "Enviando..." : "Toque para enviar"}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
