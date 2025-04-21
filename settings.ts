import { App, PluginSettingTab, Setting } from 'obsidian';
import { CustomDailyNotesSettings, DailyNoteSection, DEFAULT_SETTINGS } from './interfaces';

export class CustomDailyNotesSettingTab extends PluginSettingTab {
    plugin: any;

    constructor(app: App, plugin: any) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Basic Settings
        containerEl.createEl('h2', { text: 'Basic Settings' });
        
        new Setting(containerEl)
            .setName('Daily notes folder')
            .setDesc('Folder where daily notes will be stored')
            .addText(text => text
                .setValue(this.plugin.settings.dailyNotesFolder)
                .onChange(async (value) => {
                    this.plugin.settings.dailyNotesFolder = value;
                    await this.plugin.saveSettings();
                }));
        // In settings.ts, add to display():
        new Setting(containerEl)
            .setName('Disable core Daily Notes plugin')
            .setDesc('Automatically disable Obsidian\'s built-in Daily Notes when this plugin is active')
            .addToggle(toggle => toggle
            .setValue(this.plugin.settings.disableCoreDailyNotes)
            .onChange(async (value) => {
                this.plugin.settings.disableCoreDailyNotes = value;
                await this.plugin.saveSettings();
                await this.plugin.handleCorePluginState(); // Immediate effect
        }));

        // Task Inheritance Settings
        containerEl.createEl('h2', { text: 'Task Inheritance' });
        
        new Setting(containerEl)
            .setName('Enable task inheritance')
            .setDesc('Automatically carry over incomplete tasks from previous day')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.inheritTasks)
                .onChange(async (value) => {
                    this.plugin.settings.inheritTasks = value;
                    await this.plugin.saveSettings();
                }));

        // Mobile Settings
        containerEl.createEl('h2', { text: 'Mobile Settings' });
        
        new Setting(containerEl)
            .setName('Enable mobile swipe navigation')
            .setDesc('Swipe left/right to navigate between days')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.mobileOptions.enableSwipeNavigation)
                .onChange(async (value) => {
                    this.plugin.settings.mobileOptions.enableSwipeNavigation = value;
                    await this.plugin.saveSettings();
                }));

        // Sections Configuration
        containerEl.createEl('h2', { text: 'Note Sections' });
        
        this.plugin.settings.sections.forEach((section: DailyNoteSection, index: number) => {
            const sectionDiv = containerEl.createDiv('section-setting');
            
            new Setting(sectionDiv)
                .setName(`Section ${index + 1}: ${section.heading}`)
                .setHeading();
                
            new Setting(sectionDiv)
                .setName('Enabled')
                .addToggle(toggle => toggle
                    .setValue(section.enabled)
                    .onChange(async (value) => {
                        section.enabled = value;
                        await this.plugin.saveSettings();
                    }));
                    
            new Setting(sectionDiv)
                .setName('Heading')
                .addText(text => text
                    .setValue(section.heading)
                    .onChange(async (value) => {
                        section.heading = value;
                        await this.plugin.saveSettings();
                    }));
                    
            new Setting(sectionDiv)
                .setName('Default content')
                .addTextArea(text => text
                    .setValue(section.content)
                    .onChange(async (value) => {
                        section.content = value;
                        await this.plugin.saveSettings();
                    }));
        
            new Setting(sectionDiv)
                .setName('Template Path')
                .setDesc('Optional path to template file (e.g., "Templates/Daily Journal.md")')
                .addText(text => text
                    .setValue(section.templatePath || '')
                    .onChange(async (value) => {
                        section.templatePath = value.trim() || undefined;
                        await this.plugin.saveSettings();
                    }));                    
                    
            
        });
    }
}