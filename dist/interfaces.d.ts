export interface DailyNoteSection {
    id: string;
    heading: string;
    content: string;
    weekdays: string[];
    enabled: boolean;
}
export interface MobileOptions {
    enableSwipeNavigation: boolean;
    defaultOpenOnStartup: boolean;
    quickEntryEnabled: boolean;
    quickEntrySections: string[];
}
export interface CustomDailyNotesSettings {
    dailyNotesFolder: string;
    dailyNotesPrefix: string;
    defaultTags: string[];
    useYamlFrontmatter: boolean;
    showTitle: boolean;
    titleFormat: string;
    sections: DailyNoteSection[];
    mobileOptions: MobileOptions;
    inheritTasks: boolean;
    taskInheritanceTag: string;
}
export declare const DEFAULT_SETTINGS: CustomDailyNotesSettings;
