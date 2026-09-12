import { z } from "zod";

export const MEAL_VALUES = ["chicken", "salmon", "vegetarian"] as const;
export type MealValue = (typeof MEAL_VALUES)[number];

const optionalNote = z
  .string()
  .trim()
  .max(500, "Please keep this under 500 characters")
  .optional();

const optionalName = z
  .string()
  .trim()
  .max(100, "Please keep this under 100 characters")
  .optional();

export const rsvpSchema = z
  .object({
    guestName: z
      .string()
      .trim()
      .min(1, "Please enter your name")
      .max(100, "Please keep this under 100 characters"),
    attendance: z.enum(["accept", "decline"], {
      message: "Please let us know if you can join us",
    }),
    meal: z.enum(MEAL_VALUES).optional(),
    dietary: optionalNote,
    plusOne: z.boolean().default(false),
    plusOneName: optionalName,
    plusOneMeal: z.enum(MEAL_VALUES).optional(),
    plusOneDietary: optionalNote,
  })
  .superRefine((data, ctx) => {
    // Declining supersedes everything downstream: no meal, no plus one.
    if (data.attendance !== "accept") return;

    if (!data.meal) {
      ctx.addIssue({
        code: "custom",
        path: ["meal"],
        message: "Please choose a meal",
      });
    }

    if (!data.plusOne) return;

    if (!data.plusOneName) {
      ctx.addIssue({
        code: "custom",
        path: ["plusOneName"],
        message: "Please enter your guest's name",
      });
    }

    if (!data.plusOneMeal) {
      ctx.addIssue({
        code: "custom",
        path: ["plusOneMeal"],
        message: "Please choose a meal for your guest",
      });
    }
  });

export type RsvpInput = z.input<typeof rsvpSchema>;
export type RsvpData = z.output<typeof rsvpSchema>;

/**
 * Drops fields the guest's answers made irrelevant, so someone who fills the
 * form and then switches to "decline" does not submit a meal they will not eat.
 * The form hides these fields too; this is the data-side half of that rule.
 */
export function normalizeRsvp(data: RsvpData): RsvpData {
  if (data.attendance === "decline") {
    return {
      guestName: data.guestName,
      attendance: "decline",
      plusOne: false,
    };
  }

  if (!data.plusOne) {
    return {
      ...data,
      plusOneName: undefined,
      plusOneMeal: undefined,
      plusOneDietary: undefined,
    };
  }

  return data;
}
