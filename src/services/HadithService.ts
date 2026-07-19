const API_KEY = '$2y$10$3E7xbcPPMZhHGBAIdyZHubkRR5CmQjNCGbyLBdYIj6Lw3mpHYW';
const BASE_URL = 'https://hadithapi.com/api/hadiths';
const VERSION_URL = 'https://hadithapi.com/api/version'; // Example URL for version manifest

export interface Hadith {
  id: number;
  text: string;
  narrator: string;
  book: string;
  grade?: string;
}

interface VersionManifest {
  version: number;
}

export class HadithService {
  private static instance: HadithService;
  private readonly LOCAL_VERSION_KEY = 'hadith_data_version';
  private readonly LOCAL_DATA_KEY = 'hadith_data_cache';

  private constructor() {}

  public static getInstance(): HadithService {
    if (!HadithService.instance) {
      HadithService.instance = new HadithService();
    }
    return HadithService.instance;
  }

  /**
   * Initializes the service by checking the remote version and syncing data if necessary.
   */
  public async initialize(): Promise<void> {
    try {
      const remoteVersion = await this.fetchRemoteVersion();
      const localVersion = this.getLocalVersion();

      if (remoteVersion > localVersion || !this.getLocalData()) {
        console.log(`[HadithService] Updating data from version ${localVersion} to ${remoteVersion}...`);
        await this.syncData(remoteVersion);
      } else {
        console.log(`[HadithService] Local data is up to date (version ${localVersion}).`);
      }
    } catch (error) {
      console.error('[HadithService] Initialization failed:', error);
      // Even if init fails (e.g. offline), we can still serve local data if available
    }
  }

  /**
   * Retrieves hadiths, prioritizing local cache to ensure offline functionality.
   */
  public async getHadiths(): Promise<Hadith[]> {
    const localData = this.getLocalData();
    if (localData) {
      return localData;
    }

    // Fallback to fetch if local data somehow doesn't exist despite init
    console.warn('[HadithService] Local data not found, fetching directly...');
    return await this.fetchAndParseHadiths();
  }

  private async fetchRemoteVersion(): Promise<number> {
    // Note: Since this is a hypothetical endpoint based on requirements, 
    // we use a mocked version check if the endpoint doesn't exist or fails.
    try {
      const response = await fetch(`${VERSION_URL}?apiKey=${API_KEY}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch version manifest');
      const data: VersionManifest = await response.json();
      return data.version;
    } catch (e) {
      console.warn('[HadithService] Version check failed, defaulting to version 1.', e);
      return 1; // Default version if endpoint doesn't exist
    }
  }

  private async syncData(newVersion: number): Promise<void> {
    const hadiths = await this.fetchAndParseHadiths();
    this.saveLocalData(hadiths);
    this.saveLocalVersion(newVersion);
  }

  private async fetchAndParseHadiths(): Promise<Hadith[]> {
    try {
      const response = await fetch(`${BASE_URL}?apiKey=${API_KEY}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'x-api-key': API_KEY, // Providing in common header formats
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Unauthorized access. Please check the API key.');
        }
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      const rawData = await response.json();
      return this.parseResponse(rawData);
    } catch (error) {
      console.error('[HadithService] Error fetching data:', error);
      throw error;
    }
  }

  private parseResponse(data: any): Hadith[] {
    // Accommodating typical API wrapper structures
    let items: any[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (Array.isArray(data?.data)) {
      items = data.data;
    } else if (Array.isArray(data?.hadiths?.data)) {
      items = data.hadiths.data;
    } else if (Array.isArray(data?.hadiths)) {
      items = data.hadiths;
    }
    
    return items.map((item: any) => ({
      id: item.id || item.hadithNumber || Math.random(),
      text: item.hadithEnglish || item.text || item.arabic || '',
      narrator: item.englishNarrator || item.narrator || 'Unknown',
      book: item.bookSlug || item.book || 'Unknown',
      grade: item.status || item.grade || 'Unknown'
    }));
  }

  private getLocalVersion(): number {
    const version = localStorage.getItem(this.LOCAL_VERSION_KEY);
    return version ? parseInt(version, 10) : 0;
  }

  private saveLocalVersion(version: number): void {
    localStorage.setItem(this.LOCAL_VERSION_KEY, version.toString());
  }

  private getLocalData(): Hadith[] | null {
    const data = localStorage.getItem(this.LOCAL_DATA_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('[HadithService] Error parsing local data', e);
      return null;
    }
  }

  private saveLocalData(hadiths: Hadith[]): void {
    try {
      localStorage.setItem(this.LOCAL_DATA_KEY, JSON.stringify(hadiths));
    } catch (e) {
      console.error('[HadithService] Storage quota exceeded or other error saving local data', e);
    }
  }
}

export const hadithService = HadithService.getInstance();
