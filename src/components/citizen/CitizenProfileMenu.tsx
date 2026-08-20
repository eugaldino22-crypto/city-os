import { useRef, useState } from "react";
import {
  Bell,
  Camera,
  ChevronRight,
  FileText,
  LogOut,
  MapPin,
  Save,
  Settings,
  User,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CitizenProfileMenuProps = {
  citizenName?: string;
  cityName?: string;
  photoUrl?: string;
  onProfileChange?: (profile: {
    name: string;
    photoUrl: string;
  }) => void;

  /*
   * Permite que o sino principal do Header
   * abra o mesmo painel de notificações.
   */
  notificationsOpen?: boolean;
  onNotificationsOpenChange?: (open: boolean) => void;
};

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "C"
  );
}

export function CitizenProfileMenu({
  citizenName = "Cidadão",
  cityName = "Localização atual",
  photoUrl = "",
  onProfileChange,
  notificationsOpen: notificationsOpenProp,
  onNotificationsOpenChange,
}: CitizenProfileMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [internalNotificationsOpen, setInternalNotificationsOpen] =
    useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [editedName, setEditedName] = useState(citizenName);
  const [editedPhoto, setEditedPhoto] = useState(photoUrl);

  const notificationsOpen =
    notificationsOpenProp ?? internalNotificationsOpen;

  function setNotificationsOpen(open: boolean) {
    if (onNotificationsOpenChange) {
      onNotificationsOpenChange(open);
    } else {
      setInternalNotificationsOpen(open);
    }
  }

  const initials = getInitials(citizenName);

  function openProfile() {
    setEditedName(citizenName);
    setEditedPhoto(photoUrl);
    setProfileOpen(true);
  }

  function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    /*
     * Mantemos a imagem original sem compressão.
     * O limite evita arquivos excessivamente grandes.
     */
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEditedPhoto(reader.result);
      }
    };

    reader.readAsDataURL(file);

    /*
     * Permite selecionar novamente a mesma imagem.
     */
    event.target.value = "";
  }

  function saveProfile() {
    const name = editedName.trim() || "Cidadão";

    onProfileChange?.({
      name,
      photoUrl: editedPhoto,
    });

    setProfileOpen(false);
  }

  return (
    <>
      {/* MENU DO PERFIL */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Abrir perfil do cidadão"
            className="focus-ring rounded-full outline-none transition hover:scale-[1.03] active:scale-[0.97]"
          >
            <Avatar className="size-11 overflow-hidden border-2 border-white/80 shadow-lg">
              {photoUrl ? (
                <AvatarImage
                  src={photoUrl}
                  alt={`Foto de ${citizenName}`}
                  className="size-full object-cover object-center"
                />
              ) : null}

              <AvatarFallback className="bg-white text-sm font-bold text-primary-deep">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="w-80 rounded-2xl border-border bg-background p-2 shadow-[var(--shadow-lift)]"
        >
          <DropdownMenuLabel className="p-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-14 overflow-hidden border border-border">
                {photoUrl ? (
                  <AvatarImage
                    src={photoUrl}
                    alt={`Foto de ${citizenName}`}
                    className="size-full object-cover object-center"
                  />
                ) : null}

                <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-foreground">
                  {citizenName}
                </p>

                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  <span className="truncate">{cityName}</span>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={openProfile}
            className="cursor-pointer rounded-xl px-3 py-3"
          >
            <User className="mr-3 size-4 text-primary" />
            <span className="flex-1">Meu perfil</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a
              href="/protocolos"
              className="flex cursor-pointer rounded-xl px-3 py-3"
            >
              <FileText className="mr-3 size-4 text-primary" />
              <span className="flex-1">Meus protocolos</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => setNotificationsOpen(true)}
            className="cursor-pointer rounded-xl px-3 py-3"
          >
            <Bell className="mr-3 size-4 text-primary" />
            <span className="flex-1">Notificações</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => setSettingsOpen(true)}
            className="cursor-pointer rounded-xl px-3 py-3"
          >
            <Settings className="mr-3 size-4 text-primary" />
            <span className="flex-1">Configurações</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => {
              console.log("Logout solicitado");
            }}
            className="cursor-pointer rounded-xl px-3 py-3 text-destructive focus:text-destructive"
          >
            <LogOut className="mr-3 size-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* PERFIL */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Meu perfil
            </DialogTitle>

            <DialogDescription>
              Atualize suas informações pessoais do Portal do Cidadão.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="size-32 overflow-hidden border-4 border-primary/10 shadow-lg">
                  {editedPhoto ? (
                    <AvatarImage
                      src={editedPhoto}
                      alt="Foto do cidadão"
                      className="size-full object-cover object-center"
                    />
                  ) : null}

                  <AvatarFallback className="bg-primary text-3xl font-bold text-primary-foreground">
                    {getInitials(editedName)}
                  </AvatarFallback>
                </Avatar>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Alterar foto"
                  className="focus-ring absolute bottom-0 right-0 grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 active:scale-95"
                >
                  <Camera className="size-5" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Toque na câmera para alterar sua foto
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="citizen-name"
                className="text-sm font-semibold text-foreground"
              >
                Nome completo
              </label>

              <Input
                id="citizen-name"
                value={editedName}
                onChange={(event) =>
                  setEditedName(event.target.value)
                }
                placeholder="Digite seu nome"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="rounded-2xl bg-muted/60 p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 text-primary" />

                <div>
                  <p className="text-sm font-semibold">
                    Localização
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {cityName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setProfileOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={saveProfile}
              className="rounded-xl"
            >
              <Save className="mr-2 size-4" />
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NOTIFICAÇÕES */}
      <Dialog
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
      >
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Notificações</DialogTitle>

            <DialogDescription>
              Acompanhe avisos importantes da sua cidade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                  <Bell className="size-5 text-primary" />
                </div>

                <div>
                  <p className="font-semibold">
                    Tudo atualizado
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Você não possui novas notificações no momento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CONFIGURAÇÕES */}
      <Dialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      >
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Configurações</DialogTitle>

            <DialogDescription>
              Personalize sua experiência no Portal do Cidadão.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl border border-border p-4 text-left transition hover:bg-muted"
            >
              <div>
                <p className="font-semibold">
                  Privacidade
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Controle seus dados e permissões.
                </p>
              </div>

              <ChevronRight className="size-5 text-muted-foreground" />
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl border border-border p-4 text-left transition hover:bg-muted"
            >
              <div>
                <p className="font-semibold">
                  Preferências
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Personalize sua experiência.
                </p>
              </div>

              <ChevronRight className="size-5 text-muted-foreground" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
