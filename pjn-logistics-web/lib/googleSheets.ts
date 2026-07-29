import { google } from 'googleapis';

const SPREADSHEET_ID = '1YqHWgtaAG8kBTP05UPJ5PEVd3eyQLFKZtfoQWcjEM58';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// 1. Ambil Semua Data dari Sheet
export async function getSheetData(range: string) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return response.data.values;
}

// 2. Tambah Baris Transaksi Baru (Barang Masuk / Pasang / RMA)
export async function appendSheetData(range: string, values: any[]) {
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values],
    },
  });
  return response.data;
}