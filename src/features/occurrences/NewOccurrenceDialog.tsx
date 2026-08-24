import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  Image as ImageIcon,
  Trash2,
  Video,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  AGENCIES,
  OCCURRENCE_GROUPS,
  OCCURRENCE_ICONS,
  OCCURRENCE_TYPES,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  classifyOccurrence,
  getOccurrenceType,
} from "./catalog";
import { addOccurrence } from "./store";
import type { Occurrence, OccurrenceLocation, OccurrenceMedia } from "./types";
import { OccurrenceLocationPicker } from "./OccurrenceLocationPicker";

type Step = "categoria" | "midia" | "descricao" | "local" | "revisao" | "protocolo";

const EMPTY_LOCATION: OccurrenceLocation = {
  latitude: null,
  longitude: null,
  municipality: null,
  state: null,
  neighborhood: null,
  locality: null,
  address: null,
  manualLabel: null,
};

export function NewOccurrenceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<Step>("categoria");
  const [typeId, setTypeId] = useState<string | null>(null);
  const [media, setMedia] = useState<OccurrenceMedia | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<OccurrenceLocation>(EMPTY_LOCATION);
  const [created, setCreated] = useState<Occurrence | null>(null);

  const cameraRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) return;

    const timeout = setTimeout(() => {
      setStep("categoria");
      setTypeId(null);
      setMedia(null);
      setDescription("");
      setLocation(EMPTY_LOCATION);
      setCreated(null);
    }, 200);

    return () => clearTimeout(timeout);
  }, [open]);

  const occurrenceType = typeId ? getOccurrenceType(typeId) : null;

  const classification = useMemo(
    () =>
      typeId
        ? classifyOccurrence({ typeId, description })
        : null,
    [typeId, description],
  );

  function handleFile(file: File | undefined, kind: OccurrenceMedia["kind"]) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setMedia({ kind, dataUrl: String(reader.result) });
    };
    reader.readAsDataURL(file);
  }

  function submit() {
    if (!typeId) return;

    const occurrence = addOccurrence({
      typeId,
      description,
      media,
      location,
    });

    setCreated(occurrence);
    setStep("protocolo");
  }

  const back: Record<Step, Step | null> = {
    categoria: null,
    midia: "categoria",
    descricao: "midia",
    local: "descricao",
    revisao: "local",
    protocolo: null,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b border-border px-4 py-3 text-left sm:px-5">
          <div className="flex items-center gap-2">
            {back[step] ? (
              <button
                type="button"
                aria-label="Voltar"
                onClick={() => setStep(back[step]!)}
                className="focus-ring -ml-1 grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
              >
                <ArrowLeft className="size-4" />
              </button>
            ) : null}

            <div className="min-w-0">
              <DialogTitle className="text-base font-bold">
                Registrar ocorrência
              </DialogTitle>

              <DialogDescription className="text-xs">
                {step === "protocolo"
                  ? "Protocolo gerado"
                  : "Canal oficial entre o cidadão e a prefeitura"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {/* 1. CATEGORIA */}
          {step === "categoria" ? (
            <div className="space-y-5">
              {OCCURRENCE_GROUPS.map((group) => (
                <div key={group.id}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {group.label}
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {OCCURRENCE_TYPES.filter(
                      (item) => item.groupId === group.id,
                    ).map((item) => {
                      const Icon = OCCURRENCE_ICONS[item.icon];
                      const active = typeId === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setTypeId(item.id);
                            setStep("midia");
                          }}
                          className={cn(
                            "focus-ring flex min-h-[64px] items-center gap-2 rounded-2xl border p-3 text-left transition",
                            active
                              ? "border-primary bg-secondary"
                              : "border-border bg-card hover:bg-secondary/60",
                          )}
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                            <Icon className="size-4.5" />
                          </span>

                          <span className="text-xs font-semibold leading-tight text-foreground">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* 2. MÍDIA */}
          {step === "midia" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Uma foto ajuda a prefeitura a entender a ocorrência. É opcional.
              </p>

              {media ? (
                <div className="overflow-hidden rounded-2xl border border-border">
                  {media.kind === "photo" ? (
                    <img
                      src={media.dataUrl}
                      alt="Prévia da mídia da ocorrência"
                      className="max-h-64 w-full object-cover"
                    />
                  ) : (
                    <video
                      src={media.dataUrl}
                      controls
                      className="max-h-64 w-full bg-black"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => setMedia(null)}
                    className="focus-ring flex w-full items-center justify-center gap-2 border-t border-border p-3 text-xs font-semibold text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Remover e substituir
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <MediaButton
                    icon={Camera}
                    label="Câmera"
                    onClick={() => cameraRef.current?.click()}
                  />
                  <MediaButton
                    icon={Video}
                    label="Vídeo"
                    onClick={() => videoRef.current?.click()}
                  />
                  <MediaButton
                    icon={ImageIcon}
                    label="Galeria"
                    onClick={() => galleryRef.current?.click()}
                  />
                </div>
              )}

              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) =>
                  handleFile(event.target.files?.[0], "photo")
                }
              />
              <input
                ref={videoRef}
                type="file"
                accept="video/*"
                capture="environment"
                className="hidden"
                onChange={(event) =>
                  handleFile(event.target.files?.[0], "video")
                }
              />
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  handleFile(event.target.files?.[0], "photo")
                }
              />

              <PrimaryButton onClick={() => setStep("descricao")}>
                Continuar
              </PrimaryButton>
            </div>
          ) : null}

          {/* 3. DESCRIÇÃO */}
          {step === "descricao" ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="occurrence-description"
                  className="text-sm font-semibold text-foreground"
                >
                  O que aconteceu?
                </label>

                <Textarea
                  id="occurrence-description"
                  value={description}
                  maxLength={600}
                  rows={4}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Descreva rapidamente a situação."
                  className="mt-2"
                />
              </div>

              {occurrenceType?.hints.length ? (
                <div className="flex flex-wrap gap-2">
                  {occurrenceType.hints.map((hint) => (
                    <button
                      key={hint}
                      type="button"
                      onClick={() => setDescription(hint)}
                      className="focus-ring rounded-full bg-secondary px-3 py-1.5 text-left text-[11px] font-medium text-secondary-foreground"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              ) : null}

              <PrimaryButton onClick={() => setStep("local")}>
                Continuar
              </PrimaryButton>
            </div>
          ) : null}

          {/* 4. LOCALIZAÇÃO */}
          {step === "local" ? (
            <OccurrenceLocationPicker
              location={location}
              onChange={setLocation}
              onConfirm={() => setStep("revisao")}
            />
          ) : null}

          {/* 5. REVISÃO */}
          {step === "revisao" && occurrenceType && classification ? (
            <div className="space-y-4">
              <div className="card-premium space-y-3 p-4">
                <Row label="Categoria" value={occurrenceType.label} />
                <Row
                  label="Descrição"
                  value={description.trim() || "Sem descrição"}
                />
                <Row
                  label="Local"
                  value={
                    location.manualLabel ??
                    [location.neighborhood, location.municipality]
                      .filter(Boolean)
                      .join(" — ") ||
                    (location.latitude != null
                      ? `${location.latitude.toFixed(5)}, ${location.longitude?.toFixed(5)}`
                      : "Não informado")
                  }
                />
                <Row
                  label="Prioridade sugerida"
                  value={PRIORITY_LABELS[classification.priority]}
                  color={PRIORITY_COLORS[classification.priority]}
                />
                <Row
                  label="Encaminhamento"
                  value={AGENCIES[classification.agency]}
                />
              </div>

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Classificação preliminar por regras locais, preparada para
                análise por IA em etapas futuras. O registro não aciona
                automaticamente serviços de emergência.
              </p>

              <PrimaryButton onClick={submit}>Enviar ocorrência</PrimaryButton>
            </div>
          ) : null}

          {/* 6. PROTOCOLO */}
          {step === "protocolo" && created ? (
            <div className="space-y-4 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-primary">
                <Check className="size-7" />
              </span>

              <div>
                <p className="text-base font-bold text-foreground">
                  Ocorrência registrada com sucesso.
                </p>

                <p className="mt-1 text-2xl font-black tracking-tight text-primary">
                  {created.protocol}
                </p>
              </div>

              <div className="card-premium space-y-3 p-4 text-left">
                <Row
                  label="Categoria"
                  value={getOccurrenceType(created.typeId).label}
                />
                <Row
                  label="Local"
                  value={
                    created.location.manualLabel ??
                    [created.location.neighborhood, created.location.municipality]
                      .filter(Boolean)
                      .join(" — ") ||
                    "Não informado"
                  }
                />
                <Row
                  label="Data"
                  value={new Date(created.createdAt).toLocaleString("pt-BR")}
                />
                <Row label="Status" value={STATUS_LABELS[created.status]} />
                <Row
                  label="Prioridade"
                  value={PRIORITY_LABELS[created.priority]}
                  color={PRIORITY_COLORS[created.priority]}
                />
              </div>

              <PrimaryButton onClick={() => onOpenChange(false)}>
                Concluir
              </PrimaryButton>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MediaButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Camera;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card text-primary transition hover:bg-secondary/60"
    >
      <Icon className="size-6" />
      <span className="text-xs font-semibold text-foreground">{label}</span>
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition hover:bg-primary-deep active:scale-[0.99]"
    >
      {children}
    </button>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>

      <span
        className="max-w-[65%] text-right text-xs font-semibold text-foreground"
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
