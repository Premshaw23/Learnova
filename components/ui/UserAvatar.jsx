"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AVATAR_ACCEPT_ATTRIBUTE } from "@/lib/avatar";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { useAuthenticatedAvatarSrc } from "@/hooks/useAuthenticatedAvatarSrc";

const SIZE_STYLES = {
  xs: {
    container: "w-7 h-7",
    text: "text-[10px]",
    ring: "ring-2",
    editButton: "p-1",
    editIcon: "w-3 h-3",
  },
  sm: {
    container: "w-8 h-8",
    text: "text-xs",
    ring: "ring-2",
    editButton: "p-1.5",
    editIcon: "w-3.5 h-3.5",
  },
  md: {
    container: "w-12 h-12",
    text: "text-sm",
    ring: "ring-2",
    editButton: "p-1.5",
    editIcon: "w-4 h-4",
  },
  lg: {
    container: "w-20 h-20",
    text: "text-xl",
    ring: "ring-2",
    editButton: "p-2",
    editIcon: "w-4 h-4",
  },
  xl: {
    container: "w-28 h-28",
    text: "text-3xl",
    ring: "ring-4",
    editButton: "p-2",
    editIcon: "w-4 h-4",
  },
};

function UserAvatarComponent({
  user: userProp,
  userProfile: userProfileProp,
  previewUrl,
  size = "md",
  editable = false,
  isUploading = false,
  onFileSelect,
  accept = AVATAR_ACCEPT_ATTRIBUTE,
  alt,
  className,
  fallbackClassName,
  showStatusDot = false,
  shape = "circle",
  editLabel = "Change profile photo",
  name: nameOverride,
  initials: initialsOverride,
  inputRef,
  cacheVersion,
  priority = false,
}) {
  const fileInputRef = useRef(null);
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;

  const { avatarUrl, displayName, initials, getToken } = useUserAvatar({
    user: userProp,
    userProfile: userProfileProp,
    previewUrl,
    cacheVersion,
  });

  const resolvedName = nameOverride || displayName;
  const resolvedInitials = initialsOverride || initials;
  const resolvedAlt = alt || `${resolvedName} profile photo`;

  const displaySrc = previewUrl || avatarUrl;
  const { src: imageSrc, loading, error } = useAuthenticatedAvatarSrc(
    displaySrc,
    { getToken }
  );
  const [imgLoadError, setImgLoadError] = useState(false);

  useEffect(() => {
    setImgLoadError(false);
  }, [displaySrc, imageSrc]);

  const showImage = Boolean(imageSrc) && !error && !imgLoadError;
  const showSpinner =
    isUploading || (loading && !previewUrl && !imageSrc);
  const imgLoading = priority ? "eager" : "lazy";

  const handleEditClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isUploading) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
    event.target.value = "";
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "relative overflow-hidden transition-opacity duration-300",
          shape === "rounded" ? "rounded-xl" : "rounded-full",
          sizeStyle.container,
          sizeStyle.ring,
          "ring-white/20 border border-white/10",
          showImage ? "bg-zinc-900" : ""
        )}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={resolvedAlt}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              showSpinner ? "opacity-60" : "opacity-100"
            )}
            loading={imgLoading}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            onError={() => setImgLoadError(true)}
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white",
              sizeStyle.text,
              fallbackClassName
            )}
            aria-hidden={showImage}
          >
            {resolvedInitials}
          </div>
        )}

        {showSpinner && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/50"
            role="status"
            aria-label="Loading profile photo"
          >
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>

      {editable && (
        <>
          <button
            type="button"
            onClick={handleEditClick}
            disabled={isUploading}
            aria-label={editLabel}
            className={cn(
              "absolute bottom-0 right-0 z-20 rounded-full border border-white/20 bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/70 disabled:cursor-not-allowed disabled:opacity-60",
              sizeStyle.editButton
            )}
          >
            <Camera className={sizeStyle.editIcon} aria-hidden="true" />
          </button>
          <input
            ref={(node) => {
              fileInputRef.current = node;
              if (typeof inputRef === "function") {
                inputRef(node);
              } else if (inputRef) {
                inputRef.current = node;
              }
            }}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
            aria-hidden="true"
            tabIndex={-1}
          />
        </>
      )}

      {showStatusDot && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-zinc-950"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export const UserAvatar = memo(UserAvatarComponent);
