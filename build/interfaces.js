export const DEFAULT_SETTINGS = {
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
