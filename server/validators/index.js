const { z } = require('zod');

// Runtime payload schemas (PDD §4 / §8). Kept in one place so the API contract
// is easy to audit.

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// ---- Auth ----
const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// The Google Identity Services ID token (a JWT). Its length floor is a cheap
// shape check only — real verification happens against GOOGLE_CLIENT_ID.
const googleAuthSchema = z.object({
  credential: z.string().min(20),
});

const magicLinkGenerateSchema = z.object({
  projectId: objectId,
});

// ---- Clients ----
const createClientSchema = z.object({
  clientName: z.string().min(1).max(160),
  contactEmail: z.string().email(),
  industryType: z.string().max(120).optional(),
  logoUrl: z.string().url().optional(),
});

// ---- Projects ----
const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  clientId: objectId,
});

const updateProjectSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    clientId: objectId.optional(),
    proxyMediaKey: z.string().optional(),
    thumbnailKey: z.string().optional(),
    version: z.number().int().positive().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'No updatable fields provided',
  });

const STATUSES = ['Pre-Production', 'Rough Cut', 'Client Review', 'Approved'];
const updateStatusSchema = z.object({
  status: z.enum(STATUSES),
});

// ---- Comments ----
const pointSchema = z.object({ x: z.number(), y: z.number() });
const strokeSchema = z.object({
  color: z.string().max(32).optional(),
  width: z.number().positive().max(64).optional(),
  points: z.array(pointSchema).max(5000),
});
const scribbleDataSchema = z
  .object({ strokes: z.array(strokeSchema).max(200) })
  .optional();

const createCommentSchema = z.object({
  projectId: objectId,
  text: z.string().min(1).max(4000),
  timestamp: z.number().min(0).optional(),
  scribbleData: scribbleDataSchema,
});

const resolveCommentSchema = z.object({
  resolved: z.boolean(),
});

// ---- Uploads ----
const presignUploadSchema = z.object({
  projectId: objectId,
  filename: z.string().min(1).max(300),
  contentType: z.string().min(1).max(120),
});

const masterConfirmSchema = z.object({
  projectId: objectId,
  key: z.string().min(1).max(400),
});

// ---- Approvals ----
const approveSchema = z.object({
  digitalSig: z.string().min(2, 'A typed signature is required').max(160),
});

module.exports = {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  magicLinkGenerateSchema,
  createClientSchema,
  createProjectSchema,
  updateProjectSchema,
  updateStatusSchema,
  createCommentSchema,
  resolveCommentSchema,
  presignUploadSchema,
  masterConfirmSchema,
  approveSchema,
  STATUSES,
};
