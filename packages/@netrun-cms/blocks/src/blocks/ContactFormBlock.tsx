/**
 * ContactFormBlock - Contact form with validation
 *
 * Adapted from NetrunnewSite ContactForm component.
 * Configurable form fields with client-side validation.
 *
 * @module @netrun-cms/blocks
 * @author Netrun Systems
 */

import React, { useState, useCallback } from 'react';
import { Send, Plus, X, GripVertical } from 'lucide-react';
import type { ContactFormBlockContent, FormField } from '@netrun-cms/core';
import { cn, getBlockSettingsClasses, type BaseBlockProps } from '../utils';

export interface ContactFormBlockProps extends BaseBlockProps<ContactFormBlockContent> {
  /** API endpoint for form submission */
  apiEndpoint?: string;
  /** Callback on successful submission */
  onSubmit?: (data: Record<string, unknown>) => Promise<void>;
}

/**
 * ContactFormBlock component - displays a contact form
 */
export const ContactFormBlock: React.FC<ContactFormBlockProps> = ({
  content,
  settings,
  mode = 'view',
  className,
  onContentChange,
  apiEndpoint,
  onSubmit,
}) => {
  const { headline, description, fields, submitText = 'Send Message', successMessage } = content;

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize form data
  const initFormData = useCallback(() => {
    const data: Record<string, unknown> = {};
    fields.forEach((field) => {
      data[field.name] = field.type === 'checkbox' ? false : '';
    });
    return data;
  }, [fields]);

  // Validate a single field
  const validateField = (field: FormField, value: unknown): string | null => {
    if (field.required && !value) {
      return `${field.label} is required`;
    }

    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value as string)) {
        return 'Please enter a valid email address';
      }
    }

    return null;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach((field) => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else if (apiEndpoint) {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Failed to submit form');
        }
      }

      setIsSuccess(true);
      setFormData(initFormData());
    } catch (error) {
      setErrors({ _form: 'Failed to submit. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Field management for edit mode
  const handleFieldUpdate = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onContentChange?.({ ...content, fields: newFields });
  };

  const handleAddField = () => {
    const newField: FormField = {
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
    };
    onContentChange?.({ ...content, fields: [...fields, newField] });
  };

  const handleRemoveField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onContentChange?.({ ...content, fields: newFields });
  };

  const renderField = (field: FormField, index: number) => {
    const value = formData[field.name];
    const error = errors[field.name];

    if (mode === 'edit') {
      return (
        <div
          key={index}
          className="p-4 rounded-lg border border-dashed border-[var(--netrun-primary)]/30 bg-[var(--netrun-surface)]/50 group"
        >
          <div className="flex items-center gap-2 mb-3">
            <GripVertical className="w-4 h-4 opacity-50 cursor-grab" />
            <input
              type="text"
              value={field.label}
              onChange={(e) => handleFieldUpdate(index, { label: e.target.value })}
              className="flex-grow px-2 py-1 text-sm bg-transparent border-b border-[var(--netrun-primary)]/30 focus:border-[var(--netrun-primary)] outline-none text-[var(--netrun-text)]"
              placeholder="Field label"
            />
            <button
              onClick={() => handleRemoveField(index)}
              className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 rounded transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--netrun-text-secondary)]">Type:</label>
              <select
                value={field.type}
                onChange={(e) =>
                  handleFieldUpdate(index, { type: e.target.value as FormField['type'] })
                }
                className="px-2 py-1 text-xs rounded bg-[var(--netrun-background)] border border-[var(--netrun-primary)]/20 text-[var(--netrun-text)]"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="textarea">Textarea</option>
                <option value="select">Select</option>
                <option value="checkbox">Checkbox</option>
              </select>
            </div>
            <label className="flex items-center gap-1 text-xs text-[var(--netrun-text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={(e) => handleFieldUpdate(index, { required: e.target.checked })}
                className="w-3 h-3"
              />
              Required
            </label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => handleFieldUpdate(index, { placeholder: e.target.value })}
              className="px-2 py-1 text-xs rounded bg-[var(--netrun-background)] border border-[var(--netrun-primary)]/20 text-[var(--netrun-text)]"
              placeholder="Placeholder text"
            />
          </div>
          {field.type === 'select' && (
            <input
              type="text"
              value={field.options?.join(', ') || ''}
              onChange={(e) =>
                handleFieldUpdate(index, { options: e.target.value.split(',').map((s) => s.trim()) })
              }
              className="mt-2 w-full px-2 py-1 text-xs rounded bg-[var(--netrun-background)] border border-[var(--netrun-primary)]/20 text-[var(--netrun-text)]"
              placeholder="Options (comma-separated)"
            />
          )}
        </div>
      );
    }

    // View mode rendering
    const baseInputClass = cn(
      'w-full px-4 py-3 rounded-lg transition-colors',
      'bg-[var(--netrun-surface)] border',
      error
        ? 'border-red-500 focus:border-red-500'
        : 'border-[var(--netrun-primary)]/20 focus:border-[var(--netrun-primary)]',
      'text-[var(--netrun-text)] placeholder:text-[var(--netrun-text-secondary)]/50',
      'focus:outline-none'
    );

    return (
      <div key={index} className="space-y-1">
        <label className="block text-sm font-medium text-[var(--netrun-text)]">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {field.type === 'textarea' ? (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={cn(baseInputClass, 'resize-y')}
          />
        ) : field.type === 'select' ? (
          <select
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseInputClass}
          >
            <option value="">{field.placeholder || `Select ${field.label}`}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : field.type === 'checkbox' ? (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={(value as boolean) || false}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              className="w-4 h-4 rounded border-[var(--netrun-primary)]/20"
            />
            <span className="text-sm text-[var(--netrun-text-secondary)]">
              {field.placeholder || field.label}
            </span>
          </label>
        ) : (
          <input
            type={field.type}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  };

  return (
    <section
      className={cn(
        getBlockSettingsClasses(settings),
        className
      )}
    >
      <div className="container mx-auto max-w-2xl">
        {/* Headline */}
        {(headline || mode === 'edit') && (
          mode === 'edit' ? (
            <input
              type="text"
              value={headline || ''}
              onChange={(e) => onContentChange?.({ ...content, headline: e.target.value })}
              className="w-full text-3xl font-bold text-center mb-4 bg-transparent border-b-2 border-dashed border-[var(--netrun-primary)]/30 focus:border-[var(--netrun-primary)] outline-none text-[var(--netrun-text)]"
              placeholder="Form headline"
            />
          ) : (
            <h2 className="text-3xl font-bold text-center mb-4 text-[var(--netrun-text)] font-[var(--netrun-font-family-heading)]">
              {headline}
            </h2>
          )
        )}

        {/* Description */}
        {(description || mode === 'edit') && (
          mode === 'edit' ? (
            <textarea
              value={description || ''}
              onChange={(e) => onContentChange?.({ ...content, description: e.target.value })}
              className="w-full text-center mb-8 bg-transparent border-b border-dashed border-[var(--netrun-primary)]/20 focus:border-[var(--netrun-primary)]/50 outline-none text-[var(--netrun-text-secondary)] resize-none"
              placeholder="Form description"
              rows={2}
            />
          ) : (
            <p className="text-center mb-8 text-[var(--netrun-text-secondary)]">
              {description}
            </p>
          )
        )}

        {/* Success message */}
        {isSuccess && (
          <div className="mb-8 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-center">
            {successMessage || 'Thank you! Your message has been sent.'}
          </div>
        )}

        {/* Form error */}
        {errors._form && (
          <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-center">
            {errors._form}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fields */}
          <div className="space-y-4">
            {fields.map((field, index) => renderField(field, index))}
          </div>

          {/* Add field button in edit mode */}
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleAddField}
              className="w-full py-3 border-2 border-dashed border-[var(--netrun-primary)]/30 rounded-lg text-[var(--netrun-primary)] hover:border-[var(--netrun-primary)] hover:bg-[var(--netrun-primary)]/5 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Field
            </button>
          )}

          {/* Submit button */}
          {mode === 'edit' ? (
            <input
              type="text"
              value={submitText || ''}
              onChange={(e) => onContentChange?.({ ...content, submitText: e.target.value })}
              className="w-full py-4 px-6 rounded-lg font-bold text-center bg-[var(--netrun-primary)] text-[var(--netrun-background)]"
              placeholder="Submit button text"
            />
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full py-4 px-6 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2',
                'bg-[var(--netrun-primary)] text-[var(--netrun-background)]',
                isSubmitting
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:opacity-90'
              )}
            >
              {isSubmitting ? (
                'Sending...'
              ) : (
                <>
                  {submitText || 'Send Message'}
                  <Send className="w-5 h-5" />
                </>
              )}
            </button>
          )}

          {/* Success message editor */}
          {mode === 'edit' && (
            <input
              type="text"
              value={successMessage || ''}
              onChange={(e) => onContentChange?.({ ...content, successMessage: e.target.value })}
              className="w-full mt-4 px-3 py-2 text-sm rounded bg-[var(--netrun-surface)] border border-[var(--netrun-primary)]/20 text-[var(--netrun-text)]"
              placeholder="Success message (optional)"
            />
          )}
        </form>
      </div>
    </section>
  );
};

export default ContactFormBlock;
