import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["owner", "agent"])
});

export const taskCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
});

export const setCreateSchema = z.object({
  name: z.string().min(1),
  max_tasks: z.number().int().min(1),
});

export const setTaskAddSchema = z.object({
  task_id: z.number().int().min(1),
});

/* =========================
   MEMBER CREATE VALIDATOR
   ========================= */

export const memberCreateSchema = z.object({
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(3, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  nickname: z.string().min(1, "Nickname is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  security_pin: z.string().min(4, "PIN must be at least 4 characters"),
  ranking: z.enum(["Trial", "V1", "V2", "V3", "V4", "V5", "V6"]),
  withdraw_privilege: z.enum(["Enabled", "Disabled"]),
});
