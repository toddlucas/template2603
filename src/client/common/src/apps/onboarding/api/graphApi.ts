import { acquireGraphToken } from '$/features/auth/providers/microsoftProvider';
import type { SpSite, SpDrive, FolderItem } from '#onboarding/types';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

async function graphGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${GRAPH_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Graph API error ${response.status}: ${body}`);
  }
  return response.json() as Promise<T>;
}

interface GraphCollection<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

/**
 * Acquires a fresh Graph access token and returns it.
 * Throws if the user has no active Microsoft session.
 */
export async function getGraphToken(): Promise<string> {
  const result = await acquireGraphToken();
  return result.accessToken;
}

/**
 * Lists all SharePoint sites the user has access to.
 * Uses the search=* query which returns all followed/accessible sites.
 */
export async function listSites(token: string): Promise<SpSite[]> {
  const data = await graphGet<GraphCollection<{
    id: string;
    displayName: string;
    webUrl: string;
    description?: string;
  }>>('/sites?search=*&$select=id,displayName,webUrl,description&$top=50', token);

  return data.value.map((s) => ({
    id: s.id,
    displayName: s.displayName ?? s.webUrl,
    webUrl: s.webUrl,
    description: s.description,
  }));
}

/**
 * Lists the document libraries (drives) for a given SharePoint site.
 */
export async function listDrives(siteId: string, token: string): Promise<SpDrive[]> {
  const data = await graphGet<GraphCollection<{
    id: string;
    name: string;
    driveType: string;
    webUrl: string;
  }>>(`/sites/${siteId}/drives?$select=id,name,driveType,webUrl`, token);

  return data.value.map((d) => ({
    id: d.id,
    name: d.name,
    driveType: d.driveType,
    webUrl: d.webUrl,
  }));
}

/**
 * Lists the root-level children of a drive (folders only).
 */
export async function listDriveRootFolders(
  driveId: string,
  siteId: string | null,
  token: string,
): Promise<FolderItem[]> {
  const data = await graphGet<GraphCollection<{
    id: string;
    name: string;
    webUrl: string;
    folder?: { childCount: number };
  }>>(`/drives/${driveId}/root/children?$select=id,name,webUrl,folder&$filter=folder ne null`, token);

  return data.value
    .filter((item) => item.folder !== undefined)
    .map((item) => ({
      id: item.id,
      name: item.name,
      webUrl: item.webUrl,
      parentDriveId: driveId,
      parentSiteId: siteId,
      isRoot: false,
      childCount: item.folder?.childCount,
    }));
}

/**
 * Lists child folders of a specific folder item.
 */
export async function listChildFolders(
  driveId: string,
  itemId: string,
  siteId: string | null,
  token: string,
): Promise<FolderItem[]> {
  const data = await graphGet<GraphCollection<{
    id: string;
    name: string;
    webUrl: string;
    folder?: { childCount: number };
  }>>(`/drives/${driveId}/items/${itemId}/children?$select=id,name,webUrl,folder&$filter=folder ne null`, token);

  return data.value
    .filter((item) => item.folder !== undefined)
    .map((item) => ({
      id: item.id,
      name: item.name,
      webUrl: item.webUrl,
      parentDriveId: driveId,
      parentSiteId: siteId,
      isRoot: false,
      childCount: item.folder?.childCount,
    }));
}
