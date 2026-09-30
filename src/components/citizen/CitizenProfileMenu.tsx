import { useEffect, useRef, useState } from "react";
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

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
import { useAuth } from "@/features/auth/AuthProvider";
import { validateCitizenAvatarFile } from "@/services/citizen";
import { useNavigate } from "@tanstack/react-router";

type CitizenProfileMenuProps = {
  citizenName?: string;
  citizenPhone?: string;
  cityName?: string;
  avatarUrl?: string | null;
  onProfileChange?: (profile: {
    name: string;
    phone: string;
    avatarFile: File | null;
  }) => Promise<void> | void;
  profileSaving?: boolean;
  avatarUploading?: boolean;

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
  citizenPhone = "",
  cityName = "Localização atual",
  avatarUrl = null,
  onProfileChange,
  profileSaving = false,
  avatarUploading = false,
  notificationsOpen: notificationsOpenProp,
  onNotificationsOpenChange,
}: CitizenProfileMenuProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [internalNotificationsOpen, setInternalNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [editedName, setEditedName] = useState(citizenName);
  const [editedPhone, setEditedPhone] = useState(citizenPhone);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const notificationsOpen = notificationsOpenProp ?? internalNotificationsOpen;

  function setNotificationsOpen(open: boolean) {
    if (onNotificationsOpenChange) {
      onNotificationsOpenChange(open);
    } else {
      setInternalNotificationsOpen(open);
    }
  }

  const initials = getInitials(citizenName);
  const displayedAvatarUrl = avatarPreviewUrl ?? avatarUrl;

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  function openProfile() {
    setEditedName(citizenName);
    setEditedPhone(citizenPhone);
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setProfileError(null);
    setProfileOpen(true);
  }

  function selectAvatar(file: File | null) {
    if (!file) return;

    try {
      validateCitizenAvatarFile(file);
      setProfileError(null);
      setAvatarFile(file);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    } catch (error) {
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      setProfileError(
        error instanceof Error ? error.message : "Não foi possível usar esta imagem.",
      );
    }
  }

  async function saveProfile() {
    const name = editedName.trim();
    setProfileError(null);

    if (!name) {
      setProfileError("Informe seu nome completo para salvar o perfil.");
      return;
    }

    try {
      await onProfileChange?.({ name, phone: editedPhone, avatarFile });
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      setProfileOpen(false);
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Não foi possível atualizar o perfil.",
      );
    }
  }

  async function handleSignOut() {
    setLogoutError(null);
    setSigningOut(true);

    try {
      await signOut();
      await navigate({ to: "/" });
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Não foi possível sair da conta.");
    } finally {
      setSigningOut(false);
    }
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
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="Foto do perfil" /> : null}
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
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="Foto do perfil" /> : null}
                <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-foreground">{citizenName}</p>

                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  <span className="truncate">{cityName}</span>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={openProfile} className="cursor-pointer rounded-xl px-3 py-3">
            <User className="mr-3 size-4 text-primary" />
            <span className="flex-1">Meu perfil</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a href="/protocolos" className="flex cursor-pointer rounded-xl px-3 py-3">
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

          {logoutError ? (
            <p className="px-3 py-2 text-xs text-destructive" role="alert">
              {logoutError}
            </p>
          ) : null}

          <DropdownMenuItem
            disabled={signingOut}
            onSelect={(event) => {
              event.preventDefault();
              void handleSignOut();
            }}
            className="cursor-pointer rounded-xl px-3 py-3 text-destructive focus:text-destructive"
          >
            <LogOut className="mr-3 size-4" />
            <span>{signingOut ? "Saindo…" : "Sair"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* PERFIL */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Meu perfil</DialogTitle>

            <DialogDescription>
              Atualize suas informações pessoais do Portal do Cidadão.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center">
              <Avatar className="size-32 overflow-hidden border-4 border-primary/10 shadow-lg">
                {displayedAvatarUrl ? (
                  <AvatarImage src={displayedAvatarUrl} alt="Prévia da foto de perfil" />
                ) : null}
                <AvatarFallback className="bg-primary text-3xl font-bold text-primary-foreground">
                  {getInitials(editedName)}
                </AvatarFallback>
              </Avatar>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  selectAvatar(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
                disabled={profileSaving}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 rounded-xl"
                onClick={() => avatarInputRef.current?.click()}
                disabled={profileSaving}
              >
                <Camera className="mr-2 size-4" />
                {avatarFile ? "Trocar foto" : "Alterar foto"}
              </Button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                JPG, PNG ou WebP, com até 5 MB. A prévia será salva quando você confirmar as
                alterações.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="citizen-name" className="text-sm font-semibold text-foreground">
                Nome completo
              </label>

              <Input
                id="citizen-name"
                value={editedName}
                onChange={(event) => setEditedName(event.target.value)}
                placeholder="Digite seu nome"
                className="h-12 rounded-xl"
                maxLength={160}
                disabled={profileSaving}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="citizen-phone" className="text-sm font-semibold text-foreground">
                Telefone
              </label>

              <Input
                id="citizen-phone"
                type="tel"
                autoComplete="tel"
                value={editedPhone}
                onChange={(event) => setEditedPhone(event.target.value)}
                placeholder="(00) 00000-0000"
                className="h-12 rounded-xl"
                maxLength={32}
                disabled={profileSaving}
              />
            </div>

            <div className="rounded-2xl bg-muted/60 p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 text-primary" />

                <div>
                  <p className="text-sm font-semibold">Localização</p>

                  <p className="mt-1 text-sm text-muted-foreground">{cityName}</p>
                </div>
              </div>
            </div>

            {profileError ? (
              <p
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                role="alert"
              >
                {profileError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAvatarFile(null);
                setAvatarPreviewUrl(null);
                setProfileOpen(false);
              }}
              className="rounded-xl"
              disabled={profileSaving}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={() => void saveProfile()}
              className="rounded-xl"
              disabled={profileSaving}
            >
              <Save className="mr-2 size-4" />
              {avatarUploading
                ? "Enviando foto…"
                : profileSaving
                  ? "Salvando…"
                  : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NOTIFICAÇÕES */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Notificações</DialogTitle>

            <DialogDescription>Acompanhe avisos importantes da sua cidade.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                  <Bell className="size-5 text-primary" />
                </div>

                <div>
                  <p className="font-semibold">Tudo atualizado</p>

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
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Configurações</DialogTitle>

            <DialogDescription>Personalize sua experiência no Portal do Cidadão.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl border border-border p-4 text-left transition hover:bg-muted"
            >
              <div>
                <p className="font-semibold">Privacidade</p>

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
                <p className="font-semibold">Preferências</p>

                <p className="mt-1 text-sm text-muted-foreground">Personalize sua experiência.</p>
              </div>

              <ChevronRight className="size-5 text-muted-foreground" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
