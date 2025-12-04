import { google } from "googleapis";
export const GOOGLE_CALENDAR_CONFIG = {
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
  ],
  oauth2: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3000/api/calendar/auth/callback",
  },
  calendar: {
    primaryCalendarId: "primary",
    syncSettings: {
      timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: 100,
    },
  },
};
export function createOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CALENDAR_CONFIG.oauth2.clientId,
    GOOGLE_CALENDAR_CONFIG.oauth2.clientSecret,
    GOOGLE_CALENDAR_CONFIG.oauth2.redirectUri
  );
  return oauth2Client;
}
export function generateAuthUrl(oauth2Client: any) {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_CALENDAR_CONFIG.scopes,
    prompt: "consent",
  });
}
export async function getTokensFromCode(oauth2Client: any, code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}