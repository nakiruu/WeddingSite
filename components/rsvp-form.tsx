"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitRsvp } from "@/app/rsvp/actions";
import { rsvpSchema, type RsvpInput } from "@/lib/rsvp-schema";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const labelClass =
  "font-sans text-[11px] uppercase tracking-[0.1em] text-muted-foreground";

export function RsvpForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<RsvpInput>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      guestName: "",
      plusOne: false,
      dietary: "",
      plusOneName: "",
      plusOneDietary: "",
    },
  });

  const attendance = form.watch("attendance");
  const plusOne = form.watch("plusOne");
  const attending = attendance === "accept";
  // Gating the fields on `attending` is the visual half of the decline rule;
  // normalizeRsvp in the action is the data half.
  const showPlusOneFields = attending && plusOne;

  async function onSubmit(values: RsvpInput) {
    setFormError(null);
    const result = await submitRsvp(values);

    if (result.ok) {
      setSubmitted(true);
      return;
    }

    setFormError(result.message);
    for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
      if (messages?.[0]) {
        form.setError(field as keyof RsvpInput, { message: messages[0] });
      }
    }
  }

  if (submitted) {
    return (
      <div className="animate-fade-up w-full max-w-lg border border-border bg-card p-10 text-center">
        <p className="font-display text-3xl font-light italic text-foreground">
          Thank you
        </p>
        <div className="mx-auto my-6 h-px w-12 bg-mulberry" />
        <p className="font-sans text-sm text-muted-foreground">
          Your response has been received. We cannot wait to celebrate with you.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up w-full max-w-lg border border-border bg-card p-8 md:p-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
          <FormField
            control={form.control}
            name="guestName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Guest Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your full name"
                    className="border-border bg-background"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="attendance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Will you be attending?
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col gap-3 sm:flex-row sm:gap-6"
                  >
                    <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-foreground">
                      <RadioGroupItem value="accept" />
                      Joyfully Accept
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-foreground">
                      <RadioGroupItem value="decline" />
                      Regretfully Decline
                    </label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {attending && (
            <>
              <FormField
                control={form.control}
                name="plusOne"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex cursor-pointer items-center gap-2.5 font-sans text-sm text-foreground">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      I will be bringing a plus one
                    </label>
                  </FormItem>
                )}
              />

              {showPlusOneFields && (
                <FormField
                  control={form.control}
                  name="plusOneName"
                  render={({ field }) => (
                    <FormItem className="animate-fade-up">
                      <FormLabel className={labelClass}>
                        Name of Plus One
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Guest's full name"
                          className="border-border bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="meal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Meal Selection</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full border-border bg-background">
                          <SelectValue placeholder="Select your meal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {siteConfig.meals.map((meal) => (
                          <SelectItem key={meal.value} value={meal.value}>
                            {meal.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showPlusOneFields && (
                <FormField
                  control={form.control}
                  name="plusOneMeal"
                  render={({ field }) => (
                    <FormItem className="animate-fade-up">
                      <FormLabel className={labelClass}>
                        Plus One Meal Selection
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full border-border bg-background">
                            <SelectValue placeholder="Select their meal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {siteConfig.meals.map((meal) => (
                            <SelectItem key={meal.value} value={meal.value}>
                              {meal.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="dietary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>
                      Dietary Restrictions
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Please list any allergies or dietary needs"
                        className="border-border bg-background"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showPlusOneFields && (
                <FormField
                  control={form.control}
                  name="plusOneDietary"
                  render={({ field }) => (
                    <FormItem className="animate-fade-up">
                      <FormLabel className={labelClass}>
                        Plus One&apos;s Dietary Restrictions
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Please list any allergies or dietary needs for your guest"
                          className="border-border bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </>
          )}

          {formError && (
            <p role="alert" className="font-sans text-sm text-destructive">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full bg-primary py-3.5 font-sans text-xs font-medium uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {form.formState.isSubmitting ? "Sending…" : "Submit RSVP"}
          </Button>

          <p className="text-center font-sans text-xs text-muted-foreground">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mr-1 inline-block size-3 align-[-1px] text-mulberry"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            RSVP deadline:{" "}
            <span className="text-mulberry-strong">
              {siteConfig.rsvpDeadline}
            </span>
          </p>
        </form>
      </Form>
    </div>
  );
}
