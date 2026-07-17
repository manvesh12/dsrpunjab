import * as xlsx from "xlsx";
import { ApiError } from "../common/exceptions/api-error.js";

export class UserSpreadsheetService {
  exportRoster(users: any[], invitations: any[]) {
    const registeredRows = users.map(user => ({
      "Login ID (Email)": user.email,
      "Full Name": user.fullName,
      Role: user.role,
      District: user.district || "",
      Block: user.blockName || "",
      Section: user.sectionName || "",
      "Account Status": user.active ? "Active" : "Inactive",
      "Password / Login": "User sets password securely via invitation or reset email",
      "Created At": user.createdAt.toISOString()
    }));
    const invitationRows = invitations.map(invitation => ({
      "Login ID (Email)": invitation.email,
      "Full Name": invitation.fullName || "",
      Role: invitation.role,
      District: invitation.district || "",
      Department: invitation.department || "",
      Designation: invitation.designation || "",
      "Invite Status": invitation.status,
      "Invite Expires": invitation.expiresAt.toISOString(),
      "Password / Login": "Password is set by the invitee; it is never stored or exported"
    }));
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(registeredRows), "Registered Users");
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(invitationRows), "Pending Invitations");
    return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  }

  invitationTemplate() {
    const rows = [{
      "Full Name": "Example District Officer", Email: "officer@example.gov.in", "Phone/Mobile": "9876543210",
      Role: "OFFICER", District: "Jalandhar", Department: "Department of Mines & Geology",
      Designation: "District Mining Officer", State: "Punjab"
    }];
    const workbook = xlsx.utils.book_new();
    const sheet = xlsx.utils.json_to_sheet(rows);
    sheet["!cols"] = [20, 30, 18, 18, 28, 32, 28, 14].map(width => ({ wch: width }));
    xlsx.utils.book_append_sheet(workbook, sheet, "District Invitations");
    return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  }

  invitationRows(buffer: Buffer): any[] {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    if (!workbook.SheetNames?.length) throw new ApiError(400, "INVITATION_SHEET_MISSING", "Uploaded file contains no sheets.");
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!worksheet) throw new ApiError(400, "INVITATION_SHEET_EMPTY", "First sheet of the uploaded file is empty.");
    return xlsx.utils.sheet_to_json(worksheet) as any[];
  }
}

export const userSpreadsheetService = new UserSpreadsheetService();
