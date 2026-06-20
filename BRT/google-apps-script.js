/**
 * AgroSync Google Sheets Sync Proxy
 * 
 * 1. Open your Google Sheet.
 * 2. Click "Extensions" > "Apps Script".
 * 3. Delete any default code and paste this script.
 * 4. Click "Deploy" > "New deployment".
 * 5. Select type: "Web app".
 * 6. Set Description: "AgroSync Proxy API".
 * 7. Set Execute as: "Me" (your email).
 * 8. Set Who has access: "Anyone".
 * 9. Click "Deploy", authorize permissions, and COPY the "Web app URL".
 * 10. Paste this URL into the AgroSync settings page.
 */

const SHEET_NAME = "Ledger";

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Initialize headers (including column 11 for Rate Reason, 12 for Locked By)
    sheet.appendRow([
      "Timestamp", 
      "Transaction ID", 
      "Date", 
      "Lot", 
      "Bags", 
      "Rate", 
      "Total Value", 
      "Agent", 
      "Mark", 
      "Weight",
      "Rate Reason",
      "Locked By"
    ]);
    // Format headers
    sheet.getRange("A1:L1").setFontWeight("bold").setBackground("#d1fae5").setFontColor("#065f46");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Enable CORS for client-side fetches
function handleResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const record = {};
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j].toString().replace(/\s+/g, '');
        // format header names to match JS camelCase
        const key = header.charAt(0).toLowerCase() + header.slice(1);
        record[key] = row[j];
      }
      data.push(record);
    }
    
    return handleResponse({ status: "success", data: data });
  } catch (error) {
    return handleResponse({ status: "error", message: error.toString() });
  }
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const sheet = getOrCreateSheet();
    
    if (action === "create") {
      const record = postData.data;
      
      // Check if Transaction ID already exists to prevent duplicate submission
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === record.transactionId) {
          return handleResponse({ status: "error", message: "Transaction ID already exists" });
        }
      }
      
      sheet.appendRow([
        record.timestamp,
        record.transactionId,
        record.date,
        record.lot.toString(),
        parseInt(record.bags),
        parseFloat(record.rate),
        parseFloat(record.totalValue),
        record.agent,
        record.mark,
        record.weight || "",
        record.rateReason || "",
        record.lockedBy || ""
      ]);
      
      return handleResponse({ status: "success", message: "Record added successfully" });
      
    } else if (action === "updateWeight") {
      const transactionId = postData.transactionId;
      const weight = postData.weight;
      const rate = postData.rate; // Optional sub-user adjusted rate
      const rateReason = postData.rateReason || ""; // Optional rate change reason
      const bags = postData.bags; // Optional sub-user adjusted bags count
      const mark = postData.mark; // Optional sub-user adjusted mark
      const totalValue = postData.totalValue; // Optional client-calculated Gross Amount
      const lockedBy = postData.lockedBy; // Optional sub-user cooperative lock status
      
      const rows = sheet.getDataRange().getValues();
      let rowIndex = -1;
      
      // Find row index (1-based index, row 1 is header, so rows start at index 2)
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === transactionId) {
          rowIndex = i + 1; // Apps Script row numbers are 1-indexed
          break;
        }
      }
      
      if (rowIndex === -1) {
        return handleResponse({ status: "error", message: "Transaction ID not found: " + transactionId });
      }
      
      // Update Column 10 (Weight) if passed
      if (weight !== undefined && weight !== null) {
        sheet.getRange(rowIndex, 10).setValue(weight);
      }
      
      // Update Column 5 (Bags) if passed
      if (bags !== undefined && bags !== null && bags !== "") {
        sheet.getRange(rowIndex, 5).setValue(parseInt(bags, 10));
      }
      
      // Update Column 9 (Mark) if passed
      if (mark !== undefined && mark !== null && mark !== "") {
        sheet.getRange(rowIndex, 9).setValue(mark);
      }
      
      // Update Column 6 (Rate)
      const finalRate = (rate !== undefined && rate !== null && rate !== "") ? parseFloat(rate) : parseFloat(rows[rowIndex - 1][5]);
      sheet.getRange(rowIndex, 6).setValue(finalRate);

      // Update Column 7 (Total Value)
      if (totalValue !== undefined && totalValue !== null && totalValue !== "") {
        sheet.getRange(rowIndex, 7).setValue(parseFloat(totalValue));
      } else {
        const finalBags = (bags !== undefined && bags !== null && bags !== "") ? parseInt(bags, 10) : parseInt(rows[rowIndex - 1][4]);
        sheet.getRange(rowIndex, 7).setValue(finalBags * finalRate);
      }
      
      // Update Column 11 (Rate Reason)
      sheet.getRange(rowIndex, 11).setValue(rateReason);

      // Update Column 12 (Locked By) if passed
      if (lockedBy !== undefined && lockedBy !== null) {
        sheet.getRange(rowIndex, 12).setValue(lockedBy);
      }
      
      return handleResponse({ status: "success", message: "Weight and Ledger details updated successfully" });
    }
    
    return handleResponse({ status: "error", message: "Invalid action" });
  } catch (error) {
    return handleResponse({ status: "error", message: error.toString() });
  }
}
