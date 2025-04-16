import { Plugin, App, PluginManifest } from 'obsidian';
import { CustomDailyNotesSettings } from './interfaces';
export default class CustomDailyNotesPlugin extends Plugin {
    settings: CustomDailyNotesSettings;
    constructor(app: App, manifest: PluginManifest);
    onload(): Promise<void>;
    createOrOpenDailyNote(): Promise<void>;
    ensureFolderExists(folderPath: string): Promise<void>;
    generateDailyNoteContent(): Promise<string>;
    getIncompleteTasksFromPreviousDay(): Promise<string[]>;
    setupMobileFeatures(): void;
    registerMobileGestures(): void;
    navigateToAdjacentDay(offset: number): Promise<void>;
    generateDailyNoteContentForDate(date: moment.Moment): Promise<string>;
    mobileCreateDailyNote(): Promise<void>;
    loadSettings(): Promise<void>;
    saveSettings(): Promise<void>;
}
