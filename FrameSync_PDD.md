# FrameSync (v1.3) — Product Design Document (PDD)

**Project Name:** FrameSync  
**Document Type:** Product Design Document (PDD) / Technical Specification  
**Version:** 1.3.0  
**Status:** Approved / In Implementation  
**Primary Author:** Google DeepMind / Antigravity Engineering  
**Target Audience:** Engineering Leads, Full-Stack Developers, Product Managers, Technical Interviewers  
**Repository:** `framesync`  

---

## Table of Contents

1. [Executive Summary & Vision](#1-executive-summary--vision)
2. [Target Audience & User Personas](#2-target-audience--user-personas)
3. [User Journeys & Workflow Diagrams](#3-user-journeys--workflow-diagrams)
4. [System Architecture & Tech Stack](#4-system-architecture--tech-stack)
5. [Core Functional Requirements](#5-core-functional-requirements)
   - [5.1 Authentication & Magic Link Security](#51-authentication--magic-link-security)
   - [5.2 Media Ingestion & WebAssembly Compression](#52-media-ingestion--webassembly-compression)
   - [5.3 Interactive Canvas Annotation & Vector Sync](#53-interactive-canvas-annotation--vector-sync)
   - [5.4 Agency Kanban Pipeline](#54-agency-kanban-pipeline)
   - [5.5 Conditional Master Asset Delivery ("Level Lock")](#55-conditional-master-asset-delivery-level-lock)
   - [5.6 Real-Time Collaboration & Presence](#56-real-time-collaboration--presence)
6. [Non-Functional Requirements & Performance Budgets](#6-non-functional-requirements--performance-budgets)
7. [Database Architecture & Data Models](#7-database-architecture--data-models)
8. [API Specifications & Socket.io Contracts](#8-api-specifications--socketio-contracts)
9. [UI/UX & Canvas Coordinate Normalization](#9-uiux--canvas-coordinate-normalization)
10. [Security & Storage Architecture](#10-security--storage-architecture)
11. [Technical Risk Analysis & Architectural Tradeoffs](#11-technical-risk-analysis--architectural-tradeoffs)
12. [Implementation Roadmap](#12-implementation-roadmap)

---

## 1. Executive Summary & Vision

### 1.1 Problem Statement
Creative post-production studios and digital media agencies serving luxury hospitality brands (hotels, resorts, destination brands) suffer from chronic operational inefficiencies during video review and sign-off cycles:
* **Fragmented Feedback:** Clients communicate feedback through disjointed email threads, timestamped text spreadsheets, and vague notes (e.g., *"change the color of the towel at 01:14"*).
* **Massive Cloud Ingestion Costs:** Raw uncompressed masters (ProRes, DNxHR, 4K H.264) uploaded to cloud platforms incur crippling compute transcoding and egress storage costs.
* **Premature Asset Theft / Unauthorized Distribution:** Agencies frequently struggle with clients downloading unapproved rough cuts or high-res masters before contract settlement or final milestone sign-off.
* **Resolution Skew on Frame Markups:** Freehand drawing tools that output raster images distort across varying viewport resolutions (e.g., 4K editor display vs. 13-inch laptop screen).

### 1.2 The FrameSync Solution
**FrameSync** is an enterprise-grade, full-stack video collaboration and conditional asset delivery platform. It bridges post-production suites directly to brand clients through:
1. **Client-Side Edge Transcoding (`ffmpeg.wasm`):** Automatic browser-level compression reducing 100MB+ proxy files to target bitrates before network transit, eliminating server compute loads.
2. **Precision Vector Annotation Engine:** A transparent HTML5 Canvas layer capturing normalized mathematical vector coordinates ($[0.0, 1.0]$) at sub-second timestamps, rendering 100% resolution-independent scribbles at $<5\text{ KB}$ per frame markup (compared to $5\text{ MB}$ raw Base64 PNGs).
3. **Cryptographically Sealed Conditional Delivery ("Level Lock"):** High-resolution master assets remain air-gapped on private S3 storage until an immutable digital approval record is signed.
4. **Real-Time Synchronized War-Room:** Socket.io bidirectional sync powering instant comment broadcast, live user presence indicators, and Kanban stage synchronization.

---

## 2. Target Audience & User Personas

### Persona A: The Creative Director / Agency Editor (Internal)
* **Name:** Marcus Vance (Post-Production Supervisor)
* **Needs:** 
  - Manage multiple client campaigns through an intuitive Kanban interface.
  - Review client frame scribbles with millisecond accuracy.
  - Mark action items as resolved.
  - Gate master media delivery until contracts and milestones are approved.
* **Pain Points:** Wasting hours decoding ambiguous client emails and redrawing fixes across incorrect timecodes.

### Persona B: The Luxury Brand Executive (External Reviewer)
* **Name:** Sophia Chen (Global VP of Marketing, Azure Resorts)
* **Needs:**
  - Frictionless, zero-login access via secure magic links.
  - Clean, distraction-free viewing room.
  - Ability to pause playback and circle/sketch directly on the visual defect.
  - One-click legal digital sign-off with audit logging.
* **Pain Points:** Complicated software logins, clunky video download requirements, and lack of visual precision when explaining creative revisions.

---

## 3. User Journeys & Workflow Diagrams

```
+-----------------------------------------------------------------------------------+
|                            AGENCY WORKFLOW (Marcus)                               |
|                                                                                   |
|  [Create Project] -> [Select Video] -> [Client-Side WASM Compress] -> [Upload S3]  |
|                                                                         |         |
|  [Kanban Review Board] <--------- [Generate Secure Magic Link] <--------+         |
|         |                                                                         |
|         v                                                                         |
|  [Inspect Frame Scribbles] -> [Resolve Notes] -> [Upload Master] -> [Delivery]    |
+-----------------------------------------------------------------------------------+
                                       |
                           (Secure Magic Review Link)
                                       v
+-----------------------------------------------------------------------------------+
|                            CLIENT WORKFLOW (Sophia)                               |
|                                                                                   |
|  [Open Magic Link] -> [Stream Proxy Video] -> [Pause Video at Timecode]           |
|                                                        |                          |
|  [Submit Final Approval] <- [Submit Comment] <- [Vector Sketch on Canvas]         |
|         |                                                                         |
|         v                                                                         |
|  [Unlock & Download Master 4K Asset]                                              |
+-----------------------------------------------------------------------------------+
```

---

## 4. System Architecture & Tech Stack

```
+-------------------------------------------------------------------------------+
|                                 CLIENT TIER                                   |
|                                                                               |
|  React 18 (Vite SPA) + Tailwind CSS + Lucide Icons                            |
|  +---------------------------+  +------------------------+  +---------------+ |
|  | HTML5 Video Player        |  | Vector Canvas Engine   |  | @dnd-kit      | |
|  | Responsive 16:9 Container |  | 2D Context + Path2D    |  | Kanban Board  | |
|  +---------------------------+  +------------------------+  +---------------+ |
|  +---------------------------+  +------------------------+  +---------------+ |
|  | @ffmpeg/ffmpeg (v0.12)    |  | Socket.io Client       |  | Axios HTTP    | |
|  | WASM Single-Thread Core   |  | Real-Time Presence/Sync|  | Interceptors  | |
|  +---------------------------+  +------------------------+  +---------------+ |
+-------------------------------------------------------------------------------+
                                | (HTTPS / WSS / REST)
+-------------------------------------------------------------------------------+
|                             APPLICATION TIER                                  |
|                                                                               |
|  Node.js (v20+) & Express.js Engine                                           |
|  +-------------------------------------------------------------------------+  |
|  | Middleware: JWT Auth, RBAC Policy, Zod Validator, Rate Limiter          |  |
|  +-------------------------------------------------------------------------+  |
|  +-------------------+  +--------------------+  +--------------------------+  |
|  | S3 Presigned URL  |  | Magic Link Crypto  |  | Socket.io Event Gateway  |  |
|  | Generator Engine  |  | SHA-256 Token Auth |  | Room Broadcasting        |  |
|  +-------------------+  +--------------------+  +--------------------------+  |
+-------------------------------------------------------------------------------+
                       |                                     |
                       v                                     v
+------------------------------------+  +---------------------------------------+
|          PERSISTENCE TIER          |  |            OBJECT STORAGE             |
|                                    |  |                                       |
|  MongoDB Atlas / Community 8.0     |  |  AWS S3 / MinIO (S3 Compatible)       |
|  - Users & Clients                 |  |  - Proxy Media Bucket (Presigned GET) |
|  - Projects & Status Pipeline      |  |  - Master Media Bucket (Gated Lock)   |
|  - Vector Scribble Comments        |  |  - Project Poster Frame Thumbnails    |
|  - Approval Audit Logs             |  |                                       |
+------------------------------------+  +---------------------------------------+
```

### Stack Specification Table

| Layer | Component | Selection | Version | Key Justification |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | Framework | React + Vite | `^18.3` | Instant HMR, high performance, robust ecosystem |
| **Styling** | Utility CSS | Tailwind CSS | `^3.4` | Responsive layout, dark mode styling, utility classes |
| **Kanban DnD**| Drag-and-Drop | `@dnd-kit/core` | `^6.3` | Modern, headless, React 18 compatible, multi-container |
| **WASM Video**| Edge Encoding | `@ffmpeg/ffmpeg` | `^0.12.15` | Modern async execution, memory cleanup API |
| **WASM Core** | Single-Thread | `@ffmpeg/core` | `^0.12.10` | Eliminates COOP/COEP isolation breaks on S3 & CDNs |
| **Backend** | Runtime/Server| Node.js / Express | `^4.21` | Lightweight, non-blocking I/O, rapid API prototyping |
| **Database** | NoSQL ODM | MongoDB / Mongoose| `^8.6` | Flexible document schemas for vector arrays & history |
| **Real-Time** | WebSockets | Socket.io | `^4.7` | Auto-reconnection, room clustering, fallback transports |
| **Storage** | Object Store | AWS S3 / MinIO | AWS SDK v3 | Presigned URL capability, zero server bandwidth costs |
| **Validation**| Schema Guard | Zod | `^3.23` | Runtime type safety & strict API payload sanitation |

---

## 5. Core Functional Requirements

### 5.1 Authentication & Magic Link Security
* **FR-5.1.1 (Admin Auth):** Agency admins register and authenticate via email and bcrypt-hashed passwords ($12\text{ rounds}$), receiving signed JSON Web Tokens (JWT) with 7-day TTLs.
* **FR-5.1.2 (Client Magic Links):** Client users receive cryptographically secure URL tokens generated via `crypto.randomBytes(32).toString('hex')`.
* **FR-5.1.3 (Token Expiry & Isolation):** Magic links are scoped strictly to individual project entities and expire automatically after 7 calendar days.
* **FR-5.1.4 (Role-Based Access Control):** Express middleware enforces discrete access levels:
  - `admin`: Full CRUD permissions across clients, projects, master assets, and review links.
  - `client`: Read-only access to assigned project proxies, write access to comments/scribbles, and execute access to approvals.

### 5.2 Media Ingestion & WebAssembly Compression
* **FR-5.2.1 (Size Evaluation):** The frontend inspects incoming video file blobs prior to upload. Assets under $100\text{ MB}$ proceed directly to S3 presigned PUT ingestion.
* **FR-5.2.2 (Dynamic Bitrate Calculation):** For files $\ge 100\text{ MB}$, the browser computes the target video bitrate based on duration:
  $$\text{Target Bitrate (kbps)} = \left( \frac{100\text{ MB} \times 8192\text{ kbits}}{\text{Duration (seconds)}} \right) \times 0.90\text{ (safety margin)}$$
* **FR-5.2.3 (WASM Transcoding Pipeline):** `@ffmpeg/ffmpeg` runs locally in-browser with:
  ```bash
  -i input.mp4 -c:v libx264 -b:v [TargetBitrate]k -preset ultrafast -movflags +faststart -c:a aac -b:a 128k output.mp4
  ```
* **FR-5.2.4 (Memory Reclamation):** Upon transcode completion, the client explicitly calls `ffmpeg.deleteFile()` on both virtual input and output MEMFS structures to prevent browser memory leaks.

### 5.3 Interactive Canvas Annotation & Vector Sync
* **FR-5.3.1 (Overlay Synchronization):** An HTML5 `<canvas>` element sits positioned over the `<video>` container, bound to a locked $16:9$ aspect ratio.
* **FR-5.3.2 (Playback Event Triggers):**
  - **Playing State:** Canvas sets `pointer-events: none`, preserving native HTML5 player interactions.
  - **Paused State:** Canvas switches to `pointer-events: auto` and cursor transforms to `crosshair`.
* **FR-5.3.3 (Vector Path Normalization):** Mouse and touch coordinates are mathematically projected to normalized floats $[0.0, 1.0]$:
  $$x_{\text{norm}} = \frac{x_{\text{client}} - \text{rect.left}}{\text{rect.width}}, \quad y_{\text{norm}} = \frac{y_{\text{client}} - \text{rect.top}}{\text{rect.height}}$$
* **FR-5.3.4 (Annotation History & Undo Stack):** The drawing engine maintains an in-memory stroke stack supporting undo operations, clear canvas, 5 preset colors, and 3 stroke widths.
* **FR-5.3.5 (Seek & Redraw Engine):** Selecting a comment jumps video playback to the exact timestamp, extracts the stroke coordinate array, and draws the vector paths across the current canvas dimensions using `Path2D`.

### 5.4 Agency Kanban Pipeline
* **FR-5.4.1 (Workflow Columns):** Projects transition across four sequential stages:
  1. `Pre-Production`
  2. `Rough Cut`
  3. `Client Review`
  4. `Approved`
* **FR-5.4.2 (Interactive Drag & Drop):** Powered by `@dnd-kit/core`, dragging a project card between status columns triggers an optimistic UI update followed by an atomic `PATCH /api/projects/:id/status` API call.
* **FR-5.4.3 (Real-Time Stage Broadcasting):** Status shifts trigger `project:statusChanged` events via Socket.io, synchronizing all active dashboard sessions without manual browser refreshes.

### 5.5 Conditional Master Asset Delivery ("Level Lock")
* **FR-5.5.1 (Master Gating):** While a project status is `Pre-Production`, `Rough Cut`, or `Client Review`:
  - Master upload forms are disabled in the Agency UI.
  - Master download controls are hidden in the Client Portal.
  - API endpoint `GET /api/uploads/presigned-download/master/:projectId` returns `403 Forbidden`.
* **FR-5.5.2 (Approval Execution):** Client submits approval along with a typed legal digital signature. The system generates an immutable `Approval` audit document containing:
  - Reviewer User ID
  - Timestamp (ISO 8601)
  - Remote IP Address
  - Client User-Agent string
  - Digital Signature text
* **FR-5.5.3 (Asset Unlocking):** MongoDB updates `Project.status` to `Approved`. The master asset slot unlocks, enabling the Agency to upload the final 4K master, and issuing temporary 15-minute presigned S3 download tokens to authorized clients.

### 5.6 Real-Time Collaboration & Presence
* **FR-5.6.1 (Live Room Channels):** Reviewers automatically join project-specific Socket.io rooms: `project:${projectId}`.
* **FR-5.6.2 (Presence Tracking):** Active participants broadcast heartbeat events, rendering live avatars in the toolbar (e.g., *"Sophia Chen is reviewing"*).
* **FR-5.6.3 (Instant Comment Ingestion):** Newly posted comments with vector scribble payloads stream immediately to all connected collaborators in the room.

---

## 6. Non-Functional Requirements & Performance Budgets

| Metric | Requirement / Target | Engineering Solution |
| :--- | :--- | :--- |
| **Edge Compute Offload** | Zero CPU usage on API server for video compression | 100% client-side `@ffmpeg/ffmpeg` WebAssembly execution |
| **Annotation Payload Size** | $< 5\text{ KB}$ per comment record | Normalized 2D vector coordinate arrays instead of Base64 PNGs |
| **API Latency (p95)** | $< 120\text{ ms}$ on standard queries | Indexed MongoDB fields (`projectId`, `email`, `clientId`) |
| **Video Playback Latency** | $< 800\text{ ms}$ initial buffer time | `faststart` MP4 moov atom placement at file header |
| **Storage Security** | 0% public S3 bucket exposure | 100% private buckets accessed via short-lived Presigned URLs (15m TTL) |
| **Cross-Origin Stability** | 0% CORS/CORP breakage on S3/CDNs | Single-threaded WASM core avoiding strict COEP isolation dependencies |
| **Responsive Visual Fidelity**| Zero coordinate drift across resolutions | Canvas `devicePixelRatio` scaling + normalized $[0.0, 1.0]$ projection |

---

## 7. Database Architecture & Data Models

```
+--------------------------------------------------------------------+
|                             DATABASE SCHEMA                        |
+--------------------------------------------------------------------+

  +-----------------------+              +-----------------------+
  |         USERS         |              |        CLIENTS        |
  +-----------------------+              +-----------------------+
  | _id: ObjectId         |              | _id: ObjectId         |
  | email: String (UQ)    |              | clientName: String    |
  | passwordHash: String  |              | industryType: String  |
  | role: 'admin'|'client'|              | contactEmail: String  |
  | name: String          |              | logoUrl: String       |
  | clientId: ObjectId    |---+          +-----------------------+
  +-----------------------+   |                      ^
              ^               +----------------------+
              |                                      |
              |                                      |
  +-----------------------+              +-----------------------+
  |       APPROVALS       |              |       PROJECTS        |
  +-----------------------+              +-----------------------+
  | _id: ObjectId         |              | _id: ObjectId         |
  | projectId: ObjectId   |-----+        | title: String         |
  | approvedBy: ObjectId  |--+  |        | clientId: ObjectId    |-----+
  | approvedAt: Date      |  |  |        | status: Enum          |     |
  | ipAddress: String     |  |  |        | proxyMediaKey: String |     |
  | userAgent: String     |  |  |        | masterMediaKey: String|     |
  | digitalSig: String    |  |  |        | version: Number       |     |
  +-----------------------+  |  |        | thumbnailKey: String  |     |
                             |  |        +-----------------------+     |
                             |  |                    ^                 |
                             |  +--------------------+                 |
                             |                       |                 |
  +-----------------------+  |           +-----------------------+     |
  |       COMMENTS        |  |           |     REVIEW_LINKS      |     |
  +-----------------------+  |           +-----------------------+     |
  | _id: ObjectId         |  |           | _id: ObjectId         |     |
  | text: String          |  |           | projectId: ObjectId   |-----+
  | timestamp: Number     |  |           | token: String (UQ)    |
  | projectId: ObjectId   |--+           | expiresAt: Date       |
  | authorId: ObjectId    |----+         | usedAt: Date          |
  | scribbleData: Object  |    |         | active: Boolean       |
  | resolved: Boolean     |    |         +-----------------------+
  +-----------------------+    |
                               +---> (User Ref)
```

---

## 8. API Specifications & Socket.io Contracts

### 8.1 Key REST Endpoints

```
AUTH MODULE (/api/auth)
  POST   /register                    -> Create admin user account
  POST   /login                       -> Authenticate admin, return JWT
  POST   /magic-link/generate         -> Create client magic access token
  POST   /magic-link/verify/:token    -> Exchange token for client session
  GET    /me                          -> Return authenticated user profile

PROJECTS MODULE (/api/projects)
  GET    /                            -> List projects (supports ?status= & ?clientId=)
  POST   /                            -> Create new project
  GET    /:id                         -> Fetch project details & media metadata
  PUT    /:id                         -> Update title/client
  PATCH  /:id/status                  -> Update workflow stage (Kanban drag)
  DELETE /:id                         -> Remove project & associated comments

COMMENTS MODULE (/api/comments)
  GET    /project/:projectId          -> List all timestamped comments + vector data
  POST   /                            -> Create comment with stroke array
  PATCH  /:id/resolve                 -> Toggle comment resolved status
  DELETE /:id                         -> Delete comment record

UPLOADS MODULE (/api/uploads)
  POST   /presigned-upload            -> Generate S3 PUT URL for proxy media
  POST   /presigned-upload/master     -> Generate S3 PUT URL for master (if Approved)
  GET    /presigned-download/:key     -> Generate S3 GET URL for proxy playback
  GET    /presigned-download/master/:id -> Generate master download URL (if Approved)

APPROVALS MODULE (/api/approvals)
  POST   /:projectId/approve          -> Create legal approval & transition status
  GET    /:projectId                  -> Fetch approval audit record
```

### 8.2 Socket.io Real-Time Protocol

| Event Channel | Payload Schema | Action / Trigger |
| :--- | :--- | :--- |
| `join:project` | `{ projectId: string }` | Joins socket to the project room cluster |
| `leave:project`| `{ projectId: string }` | Leaves room and broadcasts disconnect presence |
| `user:presence`| `{ userId: string, name: string, active: boolean }` | Broadcasts active collaborators in room |
| `comment:new` | `CommentDocument` | Broadcasts newly submitted comment + vector data |
| `comment:resolved` | `{ commentId: string, resolved: boolean }` | Synchronizes checkbox status across viewers |
| `project:statusChanged` | `{ projectId: string, newStatus: string }` | Updates cards on Kanban boards in real time |
| `project:approved` | `{ projectId: string, approvedBy: string }` | Triggers Level Lock unlock across all clients |

---

## 9. UI/UX & Canvas Coordinate Normalization

### 9.1 Aspect-Locked Video Viewport
The video player and canvas overlay are wrapped in a responsive CSS container enforcing a strict `16:9` ratio (`aspect-video`):

```jsx
<div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
  {/* Native HTML5 Video Element */}
  <video ref={videoRef} src={presignedUrl} className="w-full h-full object-contain" />

  {/* Vector Overlay Layer */}
  <canvas
    ref={canvasRef}
    className={`absolute inset-0 w-full h-full ${
      isPaused ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
    }`}
  />
</div>
```

### 9.2 High-DPI Retina Display Handling
To ensure pixel-crisp line rendering without blurriness on Retina/4K screens:

$$\text{canvas.width} = \text{container.clientWidth} \times \text{window.devicePixelRatio}$$
$$\text{canvas.height} = \text{container.clientHeight} \times \text{window.devicePixelRatio}$$
$$\text{context.scale}(\text{devicePixelRatio}, \text{devicePixelRatio})$$

---

## 10. Security & Storage Architecture

### 10.1 Private S3 Bucket Configuration
All media files reside in private AWS S3 buckets with public access fully blocked. All client access is mediated by time-limited Presigned URLs:
* **Proxy Uploads:** Presigned `PUT` URL with a 15-minute expiration, bound strictly to the uploaded MIME type.
* **Proxy Streams:** Presigned `GET` URL with a 1-hour expiration.
* **Master Downloads:** Presigned `GET` URL generated dynamically **only** after verifying `project.status === 'Approved'`.

### 10.2 S3 Cross-Origin Resource Sharing (CORS) Policy
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": ["http://localhost:5173", "https://*.yourdomain.com"],
    "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"],
    "MaxAgeSeconds": 3600
  }
]
```

### 10.3 Pluggable Storage Backends (Dev Mode)
The storage engine is a facade (`utils/storage.js`) selected by `STORAGE_MODE`:
* **`s3` (default, production):** presigned URLs against AWS S3 / MinIO — the API never touches media bytes.
* **`local` (dev/testing):** disk-backed backend (`utils/localStore.js`) that reimplements the presigned contract — HMAC-SHA256-signed, expiring, content-type-bound URLs — served by `routes/localMediaRoutes.js` with full HTTP `Range` support (video seeking) and streamed reads/writes (constant memory). Media lands in `server/storage/` on the machine's SSD; the API proxies bytes in this mode, which is acceptable for local testing only.

---

## 11. Technical Risk Analysis & Architectural Tradeoffs

| Component | Identified Risk | Impact | Architectural Mitigation |
| :--- | :--- | :--- | :--- |
| **`ffmpeg.wasm` Memory Limit** | 500MB+ inputs crash browser tab | High | Lower threshold to $100\text{ MB}$; apply dynamic bitrate calculation; use `-preset ultrafast` |
| **Canvas Annotation Storage** | Base64 PNGs bloat MongoDB ($5\text{ MB}$/ea) | Critical | Replaced with normalized vector stroke arrays ($< 5\text{ KB}$/ea) rendered via `Path2D` |
| **COEP/COOP Header Breakage** | Strict isolation blocks S3/Google Fonts | High | Selected single-threaded WASM core (`@ffmpeg/core`), eliminating COOP/COEP requirements |
| **Unauthorized Asset Access** | Direct S3 links leaked/indexed | High | 100% private buckets with short-lived Presigned URLs (15m TTL) |
| **Screen Resolution Drift** | Markups misaligned on different screens | Medium | Normalized $[0.0, 1.0]$ coordinate floats scaled dynamically on redraw |

---

## 12. Implementation Roadmap

```
PHASE 1: Scaffolding & Database [COMPLETED]
├── Mongoose Models & Schemas
├── Express + Socket.io Server Skeleton
└── Vite + React + Tailwind Client Scaffolding

PHASE 2: Authentication & Access Control
├── JWT Admin Authentication & Bcrypt Password Hashing
├── Secure Magic Link Generator & Verification
└── Express RBAC Middleware

PHASE 3: Kanban Workflow & Project Management
├── Client & Project CRUD Endpoints
├── @dnd-kit Drag-and-Drop Kanban Interface
└── Atomic Status Patching

PHASE 4: S3 Integration & Media Pipeline
├── AWS SDK v3 Presigned URL Engine
├── Direct-to-S3 Multipart & Single Upload Flows
└── Video Playback URL Resolvers

PHASE 5: Video Player & Vector Annotations
├── HTML5 Custom Video Controls & Aspect-Ratio Lock
├── Canvas Drawing Engine (Colors, Stroke Widths, Undo Stack)
└── Timestamped Comment Ingestion & Seek/Redraw

PHASE 6: Client Review Portal & Level Lock
├── External Magic Link Viewing Portal
├── Immutable Digital Approval Workflow
└── Master Asset Conditional Delivery Gating

PHASE 7: Real-Time Sync & Notifications [COMPLETED]
├── Socket.io Room Clustering & Live Presence Avatars
├── Real-Time Comment Streaming & Status Broadcasts
└── Automated Nodemailer Event Notifications
    (SMTP via server/.env; emails: review link → client, new feedback &
     digital sign-off → agency admins; degrades to log-only without SMTP)

PHASE 8: ffmpeg.wasm Compression & Polish [COMPLETED]
├── In-Browser WASM Transcoding Engine & Progress Bar
├── Dark/Light Theme System (CSS-variable tokens, persisted toggle,
│   system-preference default)
└── Production Build & Docker Compose Containerization
    (docker-compose.yml: nginx web + api + mongo, optional MinIO profile)
```

---

*Document generated and maintained for the **FrameSync** Project.*
