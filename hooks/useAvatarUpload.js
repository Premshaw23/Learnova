"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { parseUploadErrorMessage, validateAvatarFile } from "@/lib/avatar";

/**
 * Handles avatar file validation, preview, upload, and profile sync.
 *
 * @param {{ user: import("firebase/auth").User|null, onUploaded?: (url: string) => void }} params
 */
export function useAvatarUpload({ user, onUploaded }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const uploadInFlightRef = useRef(false);
  const previewUrlRef = useRef(null);

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = null;
    setPreviewUrl(null);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const setPreviewFromFile = useCallback((file) => {
    if (previewUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  }, []);

  const uploadAvatar = useCallback(
    async (file, { faceDescriptor } = {}) => {
      const activeUser = auth?.currentUser ?? user;

      if (!activeUser) {
        toast.error("You must be signed in to upload an avatar.");
        return { success: false };
      }

      if (uploadInFlightRef.current) {
        toast.error("Upload already in progress. Please wait.");
        return { success: false };
      }

      const validation = validateAvatarFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return { success: false };
      }

      uploadInFlightRef.current = true;
      setIsUploading(true);
      setPreviewFromFile(file);

      const uploadToast = toast.loading("Uploading avatar...");

      try {
        const token = await activeUser.getIdToken();
        const formData = new FormData();
        formData.append("file", file);
        if (faceDescriptor) {
          formData.append("faceDescriptor", faceDescriptor);
        }

        const response = await fetch("/api/images", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json().catch(() => ({}));
        const imageUrl = data?.url;

        if (!response.ok || !imageUrl) {
          throw new Error(parseUploadErrorMessage(data, "Failed to upload image"));
        }

        let syncWarning = false;

        try {
          await updateProfile(activeUser, { photoURL: imageUrl });
        } catch (authSyncErr) {
          console.warn("Firebase Auth photoURL sync failed:", authSyncErr);
          syncWarning = true;
        }

        if (db) {
          try {
            const userRef = doc(db, "users", activeUser.uid);
            await updateDoc(userRef, {
              photoURL: imageUrl,
              avatar: imageUrl,
              image: imageUrl,
              avatarUpdatedAt: serverTimestamp(),
            });
          } catch (firestoreErr) {
            console.warn("Firestore client avatar sync failed:", firestoreErr);
            syncWarning = true;
          }
        }

        onUploaded?.(imageUrl);

        toast.success(
          syncWarning
            ? "Photo uploaded. Profile may take a moment to refresh."
            : "Avatar updated successfully!",
          { id: uploadToast }
        );

        return { success: true, url: imageUrl, syncWarning };
      } catch (err) {
        console.error("Avatar upload failed:", err);
        clearPreview();
        toast.error(err.message || "Failed to update profile picture.", {
          id: uploadToast,
        });
        return { success: false };
      } finally {
        uploadInFlightRef.current = false;
        setIsUploading(false);
      }
    },
    [user, onUploaded, setPreviewFromFile, clearPreview]
  );

  return {
    previewUrl,
    isUploading,
    uploadAvatar,
    clearPreview,
    setPreviewFromFile,
  };
}
