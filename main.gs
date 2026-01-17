// --- הגדרות גלובליות (מופיעות רק פעם אחת בפרויקט) ---
const API_KEY = "YOUR_API_KEY_HERE"; 
const TARGET_PACKAGE_ID = "flydata";
const TARGET_CKAN_URL = "https://www.odata.org.il/api/3/action"; 
const SOURCE_URL = "https://data.gov.il/api/3/action/datastore_search?resource_id=e83f763b-b7d7-479e-b172-ae981ddc6de5";
const SHEET_NAME = "Latest_Snapshot";

/**
 * פונקציה 1: הקמה ראשונית (להריץ ידנית פעם אחת)
 */
function initialSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  const data = fetchSourceData();
  sheet.clear();
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

  const timestamp = Utilities.formatDate(new Date(), "GMT+2", "yyyy-MM-dd HH:mm:ss");
  const headers = [...data[0], "log_timestamp", "log_action"];
  const firstRowWithMeta = [...data[1], timestamp, "INITIAL_IMPORT"];
  
  const csvContent = headers.join(",") + "\n" + 
                     firstRowWithMeta.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",");

  const options = {
    "method": "post",
    "headers": { "Authorization": API_KEY },
    "payload": {
      "package_id": TARGET_PACKAGE_ID,
      "name": "flydata_log.csv",
      "format": "csv",
      "upload": Utilities.newBlob(csvContent, 'text/csv', 'flydata_log.csv')
    }
  };

  UrlFetchApp.fetch(TARGET_CKAN_URL + "/resource_create", options);
  Logger.log("Setup Complete!");
}

/**
 * פונקציה 2: עדכון שוטף (להגדיר לטריגר של 5 דקות)
 */
function appendUpdatesToCkan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return Logger.log("נא להריץ setup תחילה");

  const currentSourceData = fetchSourceData();
  const oldData = sheet.getDataRange().getValues();
  
  const oldKeys = new Set(oldData.map(row => JSON.stringify(row)));
  const newRows = currentSourceData.filter(row => !oldKeys.has(JSON.stringify(row)));

  if (newRows.length === 0) return Logger.log("אין חדש.");

  const timestamp = Utilities.formatDate(new Date(), "GMT+2", "yyyy-MM-dd HH:mm:ss");
  const rowsWithMetadata = newRows.map(row => [...row, timestamp, "INSERT"]);

  // שליפת המשאב הקיים
  const pkgResponse = UrlFetchApp.fetch(TARGET_CKAN_URL + "/package_show?id=" + TARGET_PACKAGE_ID, {
    "headers": { "Authorization": API_KEY }
  });
  const pkgInfo = JSON.parse(pkgResponse.getContentText());
  const resource = pkgInfo.result.resources.find(r => r.name === 'flydata_log.csv');

  let updatedCsvContent = "";
  const newCsvPart = rowsWithMetadata.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

  if (resource) {
    const existingContent = UrlFetchApp.fetch(resource.url).getContentText();
    updatedCsvContent = existingContent + "\n" + newCsvPart;
  }

  UrlFetchApp.fetch(TARGET_CKAN_URL + "/resource_update", {
    "method": "post",
    "headers": { "Authorization": API_KEY },
    "payload": {
      "id": resource.id,
      "upload": Utilities.newBlob(updatedCsvContent, 'text/csv', 'flydata_log.csv')
    }
  });

  sheet.clear().getRange(1, 1, currentSourceData.length, currentSourceData[0].length).setValues(currentSourceData);
  Logger.log("עודכן בהצלחה.");
}

// פונקציית עזר משותפת
function fetchSourceData() {
  const res = UrlFetchApp.fetch(SOURCE_URL);
  const json = JSON.parse(res.getContentText());
  const records = json.result.records;
  const headers = Object.keys(records[0]);
  return [headers, ...records.map(rec => headers.map(h => rec[h]))];
}
