"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import FormField from "@/components/ui/FormField";

const NoticeCreationForm = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const { register, handleSubmit, watch } = methods;
  const descriptionValue = watch("description") || "";

  const onSubmit = async (data) => {
    const titleTrimmed = data.title.trim();
    const descriptionTrimmed = data.description.trim();

    if (!titleTrimmed || !descriptionTrimmed) {
      return toast.error("Fill all fields");
    }

    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: titleTrimmed,
          content: descriptionTrimmed,
          category: "general",
          priority: "medium",
          isPinned: false,
          tags: [],
          targetAudience: ["student", "teacher", "parent"],
        }),
      });
      const dataJson = await response.json();
      if (response.ok && dataJson.success) {
        toast.success("Notice published!");
        onSuccess();
      } else {
        toast.error(dataJson.error || "Failed to publish.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-6 space-y-4 bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl"
      >
        <h3 className="text-xl font-bold text-white">Create Notice</h3>
        
        <FormField name="title">
          <input
            {...register("title", { required: "Title is required" })}
            className="w-full p-3 bg-slate-800 rounded-lg text-white"
            placeholder="Title"
          />
        </FormField>

        {/* Character Counter Implementation */}
        <FormField name="description">
          <textarea
            {...register("description", {
              required: "Description is required",
              maxLength: {
                value: 1000,
                message: "Description cannot exceed 1000 characters",
              },
            })}
            maxLength={1000}
            rows={5}
            placeholder="Enter notice description..."
            className="w-full p-3 bg-slate-800 rounded-lg text-white resize-none"
          />
        </FormField>
        
        <div
          className={`text-xs text-right ${descriptionValue.length > 900 ? "text-red-500" : "text-slate-500"}`}
        >
          {descriptionValue.length} / 1000
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="text-slate-400">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 px-4 py-2 rounded-lg text-white"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default NoticeCreationForm;
