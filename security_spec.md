# UKAYO Ecosystem Firestore Security Specification

## 1. Data Invariants
1. Only valid document IDs matching `^[a-zA-Z0-9_\-]+$` (specifically `live_state` and `connection`) are permitted in `/ukayo_sync/{docId}`.
2. Every write to `/ukayo_sync/{docId}` must strictly match the `UkayoSyncDoc` schema (`payloadJson`, `updatedAt`, `updatedBy`) with no shadow or unvalidated fields (`hasOnly` + `hasAll`).
3. `payloadJson` must be a valid string between 2 and 950,000 characters, preventing resource-exhaustion payloads.
4. `updatedBy` must be one of `'marketplace'`, `'seller_center'`, or `'admin_ops'`.
5. Document deletion and collection listing are strictly forbidden (`allow list, delete: if false;`).

## 2. The "Dirty Dozen" Payloads
1. **Shadow Field Injection**: `{ payloadJson: "{}", updatedAt: "2026-11-15T00:00:00Z", updatedBy: "marketplace", isAdmin: true }` -> `PERMISSION_DENIED`
2. **Missing Required Key**: `{ payloadJson: "{}" }` -> `PERMISSION_DENIED`
3. **Invalid `updatedBy` Enum**: `{ payloadJson: "{}", updatedAt: "2026-11-15T00:00:00Z", updatedBy: "hacker" }` -> `PERMISSION_DENIED`
4. **Type Poisoning (`payloadJson` as number)**: `{ payloadJson: 12345, updatedAt: "2026-11-15T00:00:00Z", updatedBy: "marketplace" }` -> `PERMISSION_DENIED`
5. **Type Poisoning (`updatedAt` as boolean)**: `{ payloadJson: "{}", updatedAt: true, updatedBy: "marketplace" }` -> `PERMISSION_DENIED`
6. **Oversized `updatedAt`**: `{ payloadJson: "{}", updatedAt: "A".repeat(200), updatedBy: "marketplace" }` -> `PERMISSION_DENIED`
7. **Empty `payloadJson`**: `{ payloadJson: "", updatedAt: "2026-11-15T00:00:00Z", updatedBy: "marketplace" }` -> `PERMISSION_DENIED`
8. **ID Poisoning**: Path `/ukayo_sync/invalid$id!` -> `PERMISSION_DENIED`
9. **Unauthorized Collection Path**: Path `/random_collection/doc1` -> `PERMISSION_DENIED`
10. **Unauthorized Delete**: `deleteDoc(doc(db, 'ukayo_sync', 'live_state'))` -> `PERMISSION_DENIED`
11. **Unauthorized List Query**: `getDocs(collection(db, 'ukayo_sync'))` -> `PERMISSION_DENIED`
12. **Partial Update With Ghost Key**: `updateDoc(doc(db, 'ukayo_sync', 'live_state'), { ghost: 1 })` -> `PERMISSION_DENIED`
