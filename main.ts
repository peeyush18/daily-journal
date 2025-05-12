import { Plugin, App, Notice, TFile, TFolder, MarkdownView, PluginManifest, TAbstractFile } from 'obsidian';
import { CustomDailyNotesSettings, DEFAULT_SETTINGS } from './interfaces';
import { CustomDailyNotesSettingTab } from './settings';
import { parseDateFromFilename } from './util'
import moment from 'moment';

const isMobile = () => {
    return document.body.classList.contains('is-mobile');
};

export default class CustomDailyNotesPlugin extends Plugin {
    settings: CustomDailyNotesSettings;


    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
        // Initialize settings with defaults
        this.settings = DEFAULT_SETTINGS;
    }

    async onload() {
        await this.loadSettings();
        await this.handleCorePluginState()
        
        // Register commands
        this.addCommand({
            id: 'open-custom-daily-note',
            name: 'Open today\'s custom daily note',
            callback: () => this.createOrOpenDailyNote()
        });

        this.addCommand({
            id: 'quick-daily-note-mobile',
            name: 'Quick Daily Note (Mobile Optimized)',
            callback: () => this.mobileCreateDailyNote(),
            mobileOnly: true
        });

        // Add settings tab
        this.addSettingTab(new CustomDailyNotesSettingTab(this.app, this));

        // Setup mobile features if on mobile
        if (isMobile()) {
            this.setupMobileFeatures();
        }

        // Open today's note on startup if enabled (mobile only)
        if (isMobile() && this.settings.mobileOptions.defaultOpenOnStartup) {
            this.app.workspace.onLayoutReady(() => {
                setTimeout(() => this.mobileCreateDailyNote(), 500);
            });
        }
    }

    async createOrOpenDailyNote() {
        const { vault } = this.app;
        const dateStr = window.moment().format('YYYY-MM-DD');
        const fileName = `${this.settings.dailyNotesPrefix}${dateStr}.md`;
        const folderPath = this.settings.dailyNotesFolder;
        
        try {
            // Ensure folder exists
            await this.ensureFolderExists(folderPath);
            
            // Check if file exists
            const filePath = `${folderPath}/${fileName}`;
            let file = vault.getAbstractFileByPath(filePath) as TFile;
            if (!file) {
                // Create new file with template
                const content = await this.generateDailyNoteContent();
                file = await vault.create(filePath, content);
                new Notice(`Created new daily note: ${fileName}`);
            }
            
            // Open the file
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(file);
            
        } catch (error) {
            new Notice(`Error creating daily note: ${error}`);
            console.error(error);
        }
    }
    
    async ensureFolderExists(folderPath: string) {
        const { vault } = this.app;
        const folder = vault.getAbstractFileByPath(folderPath);
        
        if (!folder || !(folder instanceof TFolder)) {
            await vault.createFolder(folderPath);
        }
    }
    
    async generateDailyNoteContent(): Promise<string> {
        const date = window.moment();
        let content = '';
        
        // Add YAML frontmatter if enabled
        if (this.settings.useYamlFrontmatter) {
            content += '---\n';
            // date and day are added as tags
            // content += `date: ${date.format('YYYY-MM-DD')}\n`;
            // content += `day: ${date.format('dddd')}\n`;
            // code for tags start
            // add date and day as tags alongwith defauult tags
            content += `tags: [${date.format('YYYY-MM-DD')}, ${date.format('dddd')}`;
            if (this.settings.defaultTags.length > 0) {
                content += `, ${this.settings.defaultTags.join(', ')}`;
            }
            content += ']\n';
            // code for tags end

            content += '---\n\n';
        }
        
        // Add title if configured
        if (this.settings.showTitle) {
            content += `# ${date.format(this.settings.titleFormat)}\n\n`;
        }
        
        // Add each section
        for (const section of this.settings.sections) {
            if (!section.enabled) continue;
            
            // Skip section if it's conditionally hidden
            if (section.weekdays && section.weekdays.length > 0) {
                const currentWeekday = date.format('dddd').toLowerCase();
                if (!section.weekdays.includes(currentWeekday)) {
                    continue;
                }
            }
            
            content += `## ${section.heading}\n`;
            
            // Special handling for tasks section
            if (section.id === 'tasks' && this.settings.inheritTasks) {
                const previousTasks = await this.getIncompleteTasksFromPreviousDay();
                if (previousTasks.length > 0) {
                    content += '<!-- Inherited from previous day -->\n';
                    for (const task of previousTasks) {
                        content += `${task}\n`;
                    }
                    content += '\n';
                }
            }
            
            let sectionContent = `${section.content}\n\n`;
            // Use template if specified, otherwise use default content
            if (section.templatePath) { 
                const templateContent = await this.getTemplateContent(section.templatePath);
                sectionContent = await this.parseTemplate(templateContent, date);
            }        
            content += sectionContent;
        }
        
        return content;
    }

    async getIncompleteTasksFromPreviousDay(): Promise<string[]> {
        if (!this.settings.inheritTasks) return [];
        // search for last 120 days return empty if no found
        let previousDate = window.moment().subtract(1, 'day');
        const maxDaysToSearch = 120;
        let prevFile: TAbstractFile|null = null;
        debugger;
        for (let i = 0; i < maxDaysToSearch; i++) {
            const dateStr = previousDate.format('YYYY-MM-DD');
            const fileName = `${this.settings.dailyNotesPrefix}${dateStr}.md`;
            const filePath = `${this.settings.dailyNotesFolder}/${fileName}`;
            prevFile = this.app.vault.getAbstractFileByPath(filePath);
            if (prevFile && prevFile instanceof TFile) {
                // File exists, break the loop
                break;
            }
            // If file not found, go back one more day
            previousDate = previousDate.subtract(1, 'day');
        }
        
        try {
            if (!prevFile) return [];
            
            const content = await this.app.vault.read(prevFile as TFile);
            const tasks: string[] = [];
            
            // Parse tasks section
            const tasksSectionMatch = content.match(/## Tasks\n([\s\S]*?)(?=\n## \w+|\n*$)/i);
            if (tasksSectionMatch) {
                const tasksContent = tasksSectionMatch[1];
                const taskLines = tasksContent.split('\n');
                const incompleteTaskPattern = '- [ ] ';
                for (const line of taskLines) {
                    if (line.includes(incompleteTaskPattern) &&
                        line.trim().length > incompleteTaskPattern.length + 3 && 
                        !line.includes(this.settings.taskInheritanceTag)) {
                        tasks.push(line.trim());
                    }
                }
            }
            
            return tasks;
        } catch (error) {
            console.error('Error reading previous day tasks:', error);
            return [];
        }
    }

    setupMobileFeatures() {
        // Add mobile header button
        this.addRibbonIcon('calendar-days', 'Daily Note', () => {
            this.mobileCreateDailyNote();
        });

        // Setup swipe gestures if enabled
        if (this.settings.mobileOptions.enableSwipeNavigation) {
            this.registerMobileGestures();
        }
    }

    registerMobileGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        const SWIPE_THRESHOLD = 50;
        const VERTICAL_THRESHOLD = 30;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            
            // Only horizontal swipes with minimal vertical movement
            if (Math.abs(diffY) > VERTICAL_THRESHOLD) return;
            
            if (Math.abs(diffX) > SWIPE_THRESHOLD) {
                if (diffX > 0) {
                    this.navigateToAdjacentDay(1); // Swipe left - next day
                } else {
                    this.navigateToAdjacentDay(-1); // Swipe right - previous day
                }
            }
        }, { passive: true });
    }

    async navigateToAdjacentDay(offset: number) {
        const currentFile = this.app.workspace.getActiveFile();
        if (!currentFile) return;
        
        // Parse date from current file name
        const dateMatch = currentFile.basename.match(/(\d{4}-\d{2}-\d{2})/);
        if (!dateMatch) return;
        
        const currentDate = window.moment(dateMatch[1]);
        const targetDate = currentDate.add(offset, 'days');
        // if target date is in future return
        if (targetDate.isAfter(window.moment())) {
            new Notice("Cannot navigate to future dates");
            return;
        }

        const targetDateStr = targetDate.format('YYYY-MM-DD');
        const targetFileName = `${this.settings.dailyNotesPrefix}${targetDateStr}.md`;
        const targetFilePath = `${this.settings.dailyNotesFolder}/${targetFileName}`;
        
        try {
            let targetFile = this.app.vault.getAbstractFileByPath(targetFilePath) as TFile;
            
            if (!targetFile) {
                // lets returm from here with a notice of file not found
                new Notice(`File not found: ${targetFileName}`);
                return;
            }
            
            // Open the file
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(targetFile);
            
        } catch (error) {
            new Notice(`Error navigating to day: ${error}`);
            console.error(error);
        }
    }

    async mobileCreateDailyNote() {
        try {
            await this.createOrOpenDailyNote();
            
            if (isMobile()) {
                const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
                if (editor) {
                    editor.focus();
                    
                    // Position cursor at first empty task if available
                    const content = editor.getValue();
                    const emptyTaskPos = content.indexOf('- [ ] ');
                    if (emptyTaskPos > -1) {
                        editor.setCursor(editor.offsetToPos(emptyTaskPos + 6));
                    }
                }
            }
        } catch (error) {
            new Notice(`Mobile error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }


    async getTemplateContent(templatePath: string): Promise<string> {
        try {
            const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
            if (templateFile && templateFile instanceof TFile) {
                return await this.app.vault.read(templateFile);
            }
        } catch (error) {
            console.error("Error reading template:", error);
        }
        return ""; // Return empty string if template not found
    }

    async parseTemplate(templateContent: string, date: moment.Moment): Promise<string> {
        // Simple template variables replacement
        return templateContent
            .replace(/{{date}}/g, date.format("YYYY-MM-DD"))
            .replace(/{{time}}/g, date.format("HH:mm"))
            .replace(/{{day}}/g, date.format("dddd"))
            .replace(/{{title}}/g, date.format(this.settings.titleFormat));
    }

    private async handleCorePluginState(): Promise<void> {
        if (this.settings.disableCoreDailyNotes) {
            await this.toggleCorePlugin(false);
        }
    }

    private async toggleCorePlugin(enable: boolean): Promise<void> {
        try {
            const corePlugins = (this.app as any).internalPlugins?.plugins;
            if (!corePlugins) return;
    
            const dailyNotesPlugin = corePlugins['daily-notes'];
            if (!dailyNotesPlugin) return;
    
            if (enable) {
                if (!dailyNotesPlugin.enabled) {
                    await dailyNotesPlugin.enable();
                }
            } else {
                if (dailyNotesPlugin.enabled) {
                    await dailyNotesPlugin.disable();
                }
            }
        } catch (error) {
            console.error('Error toggling core Daily Notes plugin:', error);
        }
    }

    // functions for archiving
    async archiveNotesByTimeRange(): Promise<void> {
        const { vault, fileManager } = this.app;
        const { archiveFolder, archiveTimeRange } = this.settings;
        
        const archiveFolderPath = `${this.settings.dailyNotesFolder}/${archiveFolder}_${moment().format('DD-MM-YYYY')}`;        

        // Ensure archive folder exists
        await vault.createFolder(archiveFolderPath).catch(() => {});
      
        // Get cutoff date based on selected range
        const cutoffDate = this.getCutoffDate(archiveTimeRange);
        
        // Get all markdown files
        const files = vault.getMarkdownFiles();
        let archivedCount = 0;
      
        for (const file of files) {
          const fileDate = parseDateFromFilename(file.basename);
          if (!fileDate || fileDate.isSameOrAfter(cutoffDate)) continue;
      
          const newPath = `${archiveFolderPath}/${file.name}`;
          
          try {
            await fileManager.renameFile(file, newPath);
            archivedCount++;
          } catch (error) {
            console.error(`Failed to archive ${file.path}:`, error);
          }
        }
      
        new Notice(`Archived ${archivedCount} notes to ${archiveFolderPath}`);
      }
      
      private getCutoffDate(range: string): moment.Moment {
        const now = moment();
        switch (range) {
          case "yesterday":
            return now.subtract(1, 'day').startOf('day');
          case "lastWeek":
            return now.subtract(1, 'week').endOf('week');
          case "lastMonth":
            return now.subtract(1, 'month').endOf('month');
          default:
            return now; // Fallback (shouldn't happen)
        }
      }


}