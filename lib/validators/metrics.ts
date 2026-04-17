import { z } from "zod"

export const bloodPressureSchema = z.object({
  systolic: z.coerce.number().min(60).max(300).int(),
  diastolic: z.coerce.number().min(40).max(200).int(),
  pulse: z.coerce.number().min(30).max(250).int().optional(),
  recorded_at: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
})

export const bloodSugarSchema = z.object({
  glucose_value: z.coerce.number().min(1).max(50),
  glucose_context: z.enum(["fasting", "before_meal", "after_meal_1h", "after_meal_2h", "before_sleep", "random"]),
  recorded_at: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
})

export const bloodLipidsSchema = z.object({
  total_cholesterol: z.coerce.number().min(0.5).max(20).optional(),
  ldl: z.coerce.number().min(0.1).max(20).optional(),
  hdl: z.coerce.number().min(0.1).max(5).optional(),
  triglycerides: z.coerce.number().min(0.1).max(50).optional(),
  recorded_at: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => data.total_cholesterol || data.ldl || data.hdl || data.triglycerides,
  { message: "至少需填寫一項血脂數值" }
)

export type BloodPressureInput = z.infer<typeof bloodPressureSchema>
export type BloodSugarInput = z.infer<typeof bloodSugarSchema>
export type BloodLipidsInput = z.infer<typeof bloodLipidsSchema>
