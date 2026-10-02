# Context & Objective
Build a production-ready **Appointment Booking API** mini-service in TypeScript. This is a technical assessment for a Senior/Mid Full-Stack Backend role.

The primary evaluation criteria are:
1. **40% Concurrency & Race Condition Prevention** (handling simultaneous requests for the same slot without double booking).
2. **20% Code Quality & Clean Architecture** (maintainable structure, strong schema design).
3. **20% OpenAPI / Swagger Accuracy** (complete schemas, status codes, query/body params, error types).
4. **15% Automated Tests & Ease of Setup** (comprehensive integration/concurrency tests, docker setup).
5. **5% Real-Time Updates** (Socket.IO events on booking and cancellation).

---

# Tech Stack Requirements
- **Runtime & Language:** Node.js, TypeScript.
- **Framework:** NestJS (preferred) or Express.js with a modular clean architecture.
- **Database & ORM:** PostgreSQL with Prisma ORM.
- **Documentation:** OpenAPI 3.0 via `@nestjs/swagger` or `swagger-ui-express` / `scalar`.
- **Real-Time:** Socket.IO.
- **Testing:** Vitest or Jest, Supertest.
- **Containerization:** `docker-compose.yml` for PostgreSQL.

---

# Functional Requirements

### 1. Database Schema (`prisma/schema.prisma`)
Design a clean relational model for:
- `Slot` or `TimeSlot`:
  - `id` (UUID / CUID)
  - `startTime` (DateTime)
  - `endTime` (DateTime)
  - `isBooked` (Boolean, default: false)
  - `version` (Int, for optimistic locking if chosen)
  - `createdAt`, `updatedAt`
- `Appointment`:
  - `id` (UUID / CUID)
  - `slotId` (Unique relation to Slot)
  - `clientName` (String)
  - `clientEmail` (String)
  - `status` (Enum: `CONFIRMED`, `CANCELLED`)
  - `createdAt`, `updatedAt`
- *Constraints:* Ensure database-level unique constraints where appropriate (e.g., no two active appointments for the same slot).

### 2. Core API Endpoints
1. `GET /api/v1/slots`
   - List available time slots (filter by date range or availability).
   - Documented query params and 200 response schema.
2. `POST /api/v1/appointments`
   - Book an available slot.
   - Body: `{ slotId: string, clientName: string, clientEmail: string }`.
   - **Crucial:** Must handle concurrent booking attempts safely.
   - Return `201 Created` on success.
   - Return `409 Conflict` if the slot is already taken.
   - Return `400 Bad Request` on invalid input.
   - Return `404 Not Found` if the slot does not exist.
3. `PATCH /api/v1/appointments/:id/cancel`
   - Cancel an existing booking.
   - Mark appointment as `CANCELLED` and free the associated slot (`isBooked: false`).
   - Return `200 OK` with updated status.
   - Return `404 Not Found` or `400 Bad Request` if already cancelled.

### 3. Concurrency & Race Condition Handling (Strict Requirement)
To prevent double booking when two or more requests arrive at the exact same millisecond:
- Implement a transactional lock inside Prisma:
  - **Pessimistic Locking:** Use raw SQL `SELECT ... FOR UPDATE` inside `prisma.$transaction(...)`, **OR**
  - **Optimistic Locking:** Use version checking inside `prisma.$transaction(...)`, **OR**
  - **Atomic Conditional Updates:** `prisma.slot.updateMany({ where: { id: slotId, isBooked: false }, data: { isBooked: true } })` checking affected count.
- If a conflict occurs, rollback cleanly and return HTTP `409 Conflict` with a descriptive error message.

### 4. Real-Time Layer (Socket.IO)
- Emit WebSocket events to connected clients:
  - `appointment.created`: Emitted when an appointment is successfully booked, broadcasting the updated slot availability.
  - `appointment.cancelled`: Emitted when an appointment is cancelled, notifying that the slot is available again.
- Provide a simple namespace or room if applicable, or broadcast globally.

### 5. API Documentation (OpenAPI / Swagger)
- Every endpoint must be decorated with:
  - Operation summary and description.
  - Parameter types, DTO validation decorators (`class-validator` / `zod`).
  - Response schemas for all status codes (`200`, `201`, `400`, `404`, `409`, `500`).
- Expose Swagger UI at `/api/docs`.

### 6. Automated Testing (Vitest or Jest)
Include an automated test suite verifying:
- **Unit/Service Logic:** Validation and cancellation state transitions.
- **Concurrency Integration Test (Mandatory):**
  - Seed one available slot.
  - Fire 5-10 concurrent booking requests simultaneously using `Promise.all()`.
  - Assert that **exactly one** request returns `201 Created` and all others return `409 Conflict`.
  - Verify database state confirms only 1 appointment was saved.

---

# Deliverables & File Structure
Ensure the project includes the following structure ready for packaging:

```text
├── docker-compose.yml       # Local PostgreSQL container setup
├── prisma/
│   ├── schema.prisma        # Schema definition with constraints
│   ├── migrations/          # Baseline migrations
│   └── seed.ts              # Seeding initial sample slots
├── src/
│   ├── modules/
│   │   ├── appointments/    # Controller, Service, DTOs
│   │   ├── slots/           # Controller, Service, DTOs
│   │   └── websocket/       # Socket.IO Gateway / Event emitter
│   ├── common/              # Filters, interceptors, error handling
│   ├── main.ts
│   └── app.module.ts
├── test/
│   └── concurrency.e2e-spec.ts # Race condition stress test
├── .env.example             # Clean environment template (NO secrets)
├── package.json
├── tsconfig.json
└── README.md                # Comprehensive setup and documentation guide