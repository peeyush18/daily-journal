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

export const DEFAULT_SETTINGS: CustomDailyNotesSettings = {
    dailyNotesFolder: 'Daily Notes',
    dailyNotesPrefix: '',
    defaultTags: ['daily'],
    useYamlFrontmatter: true,
    showTitle: true,
    titleFormat: 'YYYY-MM-DD dddd',
    inheritTasks: true,
    taskInheritanceTag: '@incomplete',
    sections: [
        {
            id: 'tasks',
            heading: 'Tasks',
            content: '- [ ] ',
            weekdays: [],
            enabled: true
        },
        {
            id: 'journal',
            heading: 'Journal',
            content: 'What happened today?\n\nHow do I feel about it?',
            weekdays: [],
            enabled: true
        },
        {
            id: 'meetings',
            heading: 'Meetings',
            content: '### 9:00 AM\n- ',
            weekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            enabled: true
        }
    ],
    mobileOptions: {
        enableSwipeNavigation: true,
        defaultOpenOnStartup: true,
        quickEntryEnabled: true,
        quickEntrySections: ['tasks', 'journal']
    }
};