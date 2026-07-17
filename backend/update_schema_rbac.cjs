const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Remove enum Role
schema = schema.replace(/enum Role \{[\s\S]*?\}/, '');

// Change fields that used Role to String
schema = schema.replace(/role\s+Role/g, 'role String');

// Add new Normalized Models at the end
const newModels = `
// =========================================================
// NORMALIZED ENTERPRISE RBAC (PHASE 45)
// =========================================================
model Module {
  id          BigInt       @id @default(autoincrement())
  name        String       @unique
  description String?
  permissions Permission[]
}

model Permission {
  id          BigInt           @id @default(autoincrement())
  moduleId    BigInt
  action      String           @unique // e.g., USER_VIEW, PROJECT_CREATE
  description String?
  module      Module           @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  roles       RolePermission[]
}

model Role {
  id               BigInt             @id @default(autoincrement())
  name             String             @unique // e.g., SUPER_ADMIN
  description      String?
  permissions      RolePermission[]
  permissionHistory PermissionHistory[]
}

model RolePermission {
  roleId       BigInt
  permissionId BigInt
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
}

model UserSession {
  id        BigInt   @id @default(autoincrement())
  userId    BigInt
  token     String   @unique
  ipAddress String?
  device    String?
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model LoginHistory {
  id        BigInt   @id @default(autoincrement())
  userId    BigInt
  ipAddress String?
  device    String?
  browser   String?
  status    String   // SUCCESS, FAILED
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model PermissionHistory {
  id           BigInt   @id @default(autoincrement())
  roleId       BigInt
  changedBy    BigInt
  action       String   // ADDED, REMOVED
  permission   String
  reason       String?
  createdAt    DateTime @default(now())
  role         Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  changedByUser User    @relation(fields: [changedBy], references: [id], onDelete: Restrict)
}

model FeatureFlag {
  id          BigInt   @id @default(autoincrement())
  name        String   @unique
  isEnabled   Boolean  @default(false)
  description String?
  updatedAt   DateTime @updatedAt
}
`;

fs.writeFileSync('prisma/schema.prisma', schema + newModels);
