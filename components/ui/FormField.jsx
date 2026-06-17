"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";

export const FormField = ({
  name,
  label,
  description,
  children,
  className = "",
  ...props
}) => {
  const formContext = useFormContext();

  // If useFormContext is called outside of a FormProvider, handle gracefully
  const errors = formContext?.formState?.errors || {};
  const error = name.split(".").reduce((acc, part) => acc?.[part], errors)?.message;

  const inputId = `${name}-input`;
  const errorId = `${name}-error`;
  const descId = `${name}-description`;

  // Ensure there is exactly one child (the input/select/textarea)
  let clonedChild = children;
  try {
    const child = React.Children.only(children);
    const describedByParts = [];
    if (description) describedByParts.push(descId);
    if (error) describedByParts.push(errorId);
    const describedBy = describedByParts.length > 0 ? describedByParts.join(" ") : undefined;

    clonedChild = React.cloneElement(child, {
      id: child.props.id || inputId,
      "aria-invalid": error ? "true" : "false",
      "aria-describedby": child.props["aria-describedby"] || describedBy,
      "aria-errormessage": error ? errorId : undefined,
      ...props,
    });
  } catch (err) {
    // If not a single child, just render children directly as fallback
  }

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}

      {clonedChild}

      {description && (
        <p id={descId} className="text-xs text-muted-foreground mt-0.5">
          {description}
        </p>
      )}

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            aria-live="polite"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 4 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="text-xs text-red-500 dark:text-red-400 font-medium overflow-hidden"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FormField;
