// ============================================================
// LEARNING CENTER LOCATOR — Google Apps Script Backend
// 10X Digital Economy Programme
//
// SETUP INSTRUCTIONS:
// 1. Go to script.google.com → New project
// 2. Paste this entire file
// 3. Update SHEET_ID below with your Google Sheet ID
// 4. Click Deploy → New deployment → Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Copy the deployment URL → paste into learning-center-locator.html
// ============================================================


const SHEET_ID = "1mA70rAFV-3QnlCTiVzOJmSWbGQF_AY4qhXJYOp3zDtA";
const SHEET_NAME = "Submissions";



function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    // Build the row
    const row = [
      data.timestamp || new Date().toISOString(),
      data.eso_name || "",
      data.contact_name || "",
      data.contact_phone || "",
      data.center_name || "",
      data.region || "",
      data.district || "",
      data.latitude || "",
      data.longitude || "",
      data.coord_method || "",
      data.photos_count || 0,
      // Google Maps link for easy viewing
      data.latitude && data.longitude
        ? `https://maps.google.com/?q=${data.latitude},${data.longitude}`
        : "",
    ];

    sheet.appendRow(row);

    // Handle photo uploads — save to Drive folder
    if (data.photos && data.photos.length > 0) {
      const folder = getOrCreateFolder(data.center_name || "Unnamed Center");
      data.photos.forEach((base64, idx) => {
        try {
          const match = base64.match(/^data:(.+);base64,(.+)$/);
          if (!match) return;
          const mimeType = match[1];
          const ext = mimeType.split("/")[1] || "jpg";
          const blob = Utilities.newBlob(
            Utilities.base64Decode(match[2]),
            mimeType,
            `${data.center_name || "photo"}_${idx + 1}.${ext}`
          );
          folder.createFile(blob);
        } catch (photoErr) {
          console.error("Photo upload error:", photoErr);
        }
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error("doPost error:", err);
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Add headers
    sheet.appendRow([
      "Timestamp",
      "ESO Name",
      "Contact Person",
      "Contact Phone",
      "Learning Center Name",
      "Region",
      "District",
      "Latitude",
      "Longitude",
      "Coord Method",
      "Photos Count",
      "Google Maps Link",
    ]);
    // Style header row
    const headerRange = sheet.getRange(1, 1, 1, 12);
    headerRange.setBackground("#0D1B2A");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function getOrCreateFolder(centerName) {
  const rootName = "10X Learning Center Photos";
  let rootFolder;
  const existing = DriveApp.getFoldersByName(rootName);
  rootFolder = existing.hasNext() ? existing.next() : DriveApp.createFolder(rootName);

  const subName = centerName.replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "Unnamed";
  const subExisting = rootFolder.getFoldersByName(subName);
  return subExisting.hasNext() ? subExisting.next() : rootFolder.createFolder(subName);
}

// Test function — run manually to check sheet connection
function testSheet() {
  const sheet = getOrCreateSheet();
  Logger.log("Sheet ready: " + sheet.getName());
}