import { App, Modal, Notice, PluginSettingTab, Setting } from 'obsidian';
import { CustomDailyNotesSettings, DailyNoteSection, DEFAULT_SETTINGS } from './interfaces';

export class CustomDailyNotesSettingTab extends PluginSettingTab {
    plugin: any;

    constructor(app: App, plugin: any) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        const days = [
            { value: "monday", label: "Monday" },
            { value: "tuesday", label: "Tuesday" },
            { value: "wednesday", label: "Wednesday" },
            { value: "thursday", label: "Thursday" },
            { value: "friday", label: "Friday" },
            { value: "saturday", label: "Saturday" },
            { value: "sunday", label: "Sunday" }
          ];



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
            
            // add for adding multi select for weekdays
            sectionDiv.createEl("h3", { text: "Enabled Days" });

            
            days.forEach((day) => {
                new Setting(sectionDiv)
                  .setName(day.label)
                  .addToggle((toggle) => {
                    toggle
                      .setValue(section.weekdays.length == 0 || section.weekdays.includes(day.value))
                      .onChange(async (enabled) => {
                        if (enabled) {
                            section.weekdays.push(day.value);
                        } else {
                            section.weekdays = 
                            section.weekdays.filter((d: string) => d !== day.value);
                        }
                        await this.plugin.saveSettings();
                        });
                    });
                });
            })

         // settings for archiving
        containerEl.createEl('h2', { text: 'Archiving Settings' });
        // Archive Folder Path Setting
        new Setting(containerEl)
        .setName("Archive folder location")
        .addText((text) =>
          text
            .setValue(this.plugin.settings.archiveFolder)
            .onChange(async (value) => {
              this.plugin.settings.archiveFolder = value;
              await this.plugin.saveSettings();
            })
        );
        // Time Range Selector
        new Setting(containerEl)
        .setName("Archive range")
        .setDesc("Select which time period to archive")
        .addDropdown((dropdown) => {
          dropdown
            .addOption("yesterday", "Older than yesterday")
            .addOption("lastWeek", "Previous week and older")
            .addOption("lastMonth", "Previous month and older")
            .setValue(this.plugin.settings.archiveTimeRange)
            .onChange(async (value) => {
              this.plugin.settings.archiveTimeRange = value as any;
              await this.plugin.saveSettings();
            });
        });

            // Archive Button
        new Setting(containerEl)
        .setName("Archive notes")
        .addButton((button) =>
          button
            .setButtonText("Archive Now")
            .setWarning()
            .onClick(async () => {
              const confirmed = await confirmArchive(this.app);
              if (confirmed) {
                await this.plugin.archiveNotesByTimeRange();
              }
            })
        );

    }
}


async function confirmArchive(app: App): Promise<boolean> {
    return new Promise((resolve) => {
      // Create a simple modal instead of using community lib
      const modal = new class extends Modal {
        onOpen() {
          const { contentEl } = this;
          contentEl.createEl('h2', { text: 'Confirm Archive' });
          contentEl.createEl('p', { 
            text: 'This will move matching notes to the archive folder. Continue?' 
          });
          
          new Setting(contentEl)
            .addButton(btn => btn
              .setButtonText('Cancel')
              .onClick(() => {
                this.close();
                resolve(false);
              }))
            .addButton(btn => btn
              .setWarning()
              .setButtonText('Archive')
              .onClick(() => {
                this.close();
                resolve(true);
              }));
        }
      }(app);
      
      modal.open();
    });
  }