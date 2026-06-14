import * as vscode from 'vscode';

// ─── State Management ────────────────────────────────────────────────────────

/** Tracks whether Focus Mode is currently active */
let isFocusModeActive = false;

/** Tracks whether the Coffee Break Reminder is currently active */
let isCoffeeBreakActive = false;

/** Interval handle for the coffee break reminder */
let coffeeBreakInterval: ReturnType<typeof setInterval> | undefined;

/** Interval handle for the deep work session timer */
let deepWorkInterval: ReturnType<typeof setInterval> | undefined;

/** Status bar item for the deep work timer countdown */
let deepWorkStatusBarItem: vscode.StatusBarItem | undefined;

/** Status bar item for the coffee break reminder indicator */
let coffeeBreakStatusBarItem: vscode.StatusBarItem | undefined;

// ─── Coffee-themed Messages ──────────────────────────────────────────────────

const coffeeBreakMessages: readonly string[] = [
    "☕ Time for a coffee break! Your code will still be here when you get back.",
    "☕ Hey there, developer! Your eyes need a rest. Go grab an espresso!",
    "☕ You've been coding for an hour — time to stretch and brew some fresh coffee!",
    "☕ Coffee break o'clock! Step away, hydrate, and recharge those brain cells.",
    "☕ Even the best code needs a breather. Pour yourself a nice warm cup!",
    "☕ Attention: Your productivity will increase 42% after a coffee break. Trust the science.",
    "☕ Your IDE misses you, but your coffee mug misses you more. Take five!",
    "☕ Fun fact: Great code is written between coffee breaks. Time for one!",
    "☕ The compiler can wait. The espresso machine cannot. Go!",
    "☕ Reminder: You're a developer, not a robot. Time to refuel with some java ☕ (the drink, not the language)."
];

const deepWorkStartMessages: readonly string[] = [
    "☕ Deep work session started! 25 minutes of pure focus. You've got this!",
    "☕ Entering the zone... 25-minute focus session begins now!",
    "☕ Brew mode activated! 25 minutes of uninterrupted coding ahead.",
];

const deepWorkCompleteMessages: readonly string[] = [
    "🎉 Deep work session complete! Amazing focus. Time for a reward coffee!",
    "🎉 25 minutes done! You crushed it. Take a well-earned break!",
    "🎉 Focus session finished! Great work — go stretch and grab a fresh cup.",
];

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Returns a random message from the provided array of messages.
 */
function getRandomMessage(messages: readonly string[]): string {
    const index = Math.floor(Math.random() * messages.length);
    return messages[index];
}

/**
 * Formats remaining seconds into MM:SS display format.
 */
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ─── Command: Toggle Focus Mode ─────────────────────────────────────────────

/**
 * Toggles Focus Mode on/off.
 * 
 * When enabled:
 * - Hides the minimap
 * - Hides breadcrumbs
 * - Hides the activity bar
 * - Hides the status bar
 * 
 * When disabled:
 * - Restores all hidden UI elements to their previous state
 */
async function toggleFocusMode(context: vscode.ExtensionContext): Promise<void> {
    const config = vscode.workspace.getConfiguration();
    isFocusModeActive = !isFocusModeActive;

    // Save the current state on first activation so we can restore later
    if (isFocusModeActive) {
        await context.workspaceState.update('focusMode.prev.minimap', 
            config.get<boolean>('editor.minimap.enabled'));
        await context.workspaceState.update('focusMode.prev.breadcrumbs', 
            config.get<boolean>('breadcrumbs.enabled'));
        await context.workspaceState.update('focusMode.prev.activityBar', 
            config.get<string>('workbench.activityBar.location'));
        await context.workspaceState.update('focusMode.prev.statusBar', 
            config.get<boolean>('workbench.statusBar.visible'));
    }

    if (isFocusModeActive) {
        // Enter Focus Mode — hide distractions
        await config.update('editor.minimap.enabled', false, vscode.ConfigurationTarget.Global);
        await config.update('breadcrumbs.enabled', false, vscode.ConfigurationTarget.Global);
        await config.update('workbench.activityBar.location', 'hidden', vscode.ConfigurationTarget.Global);
        await config.update('workbench.statusBar.visible', false, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(
            '☕ Focus Mode activated — distractions hidden. Happy coding!'
        );
    } else {
        // Exit Focus Mode — restore previous state
        const prevMinimap = context.workspaceState.get<boolean>('focusMode.prev.minimap', true);
        const prevBreadcrumbs = context.workspaceState.get<boolean>('focusMode.prev.breadcrumbs', true);
        const prevActivityBar = context.workspaceState.get<string>('focusMode.prev.activityBar', 'default');
        const prevStatusBar = context.workspaceState.get<boolean>('focusMode.prev.statusBar', true);

        await config.update('editor.minimap.enabled', prevMinimap, vscode.ConfigurationTarget.Global);
        await config.update('breadcrumbs.enabled', prevBreadcrumbs, vscode.ConfigurationTarget.Global);
        await config.update('workbench.activityBar.location', prevActivityBar, vscode.ConfigurationTarget.Global);
        await config.update('workbench.statusBar.visible', prevStatusBar, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(
            '☕ Focus Mode deactivated — welcome back to the full workspace!'
        );
    }
}

// ─── Command: Start Deep Work Session ────────────────────────────────────────

/**
 * Starts a 25-minute deep work (Pomodoro) session.
 * 
 * Features:
 * - Shows a countdown in the status bar
 * - Sends progress notifications every 5 minutes
 * - Shows a completion notification when done
 * - Only one session can be active at a time
 */
function startDeepWorkSession(): void {
    // Prevent multiple concurrent sessions
    if (deepWorkInterval) {
        vscode.window.showWarningMessage(
            '☕ A deep work session is already in progress! Stay focused!'
        );
        return;
    }

    const totalSeconds = 25 * 60; // 25 minutes
    let remainingSeconds = totalSeconds;

    // Create status bar item for the countdown
    deepWorkStatusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    deepWorkStatusBarItem.text = `$(clock) ☕ ${formatTime(remainingSeconds)}`;
    deepWorkStatusBarItem.tooltip = 'Code & Coffee: Deep Work Session in progress';
    deepWorkStatusBarItem.color = '#C68E5A';
    deepWorkStatusBarItem.show();

    // Show start notification
    vscode.window.showInformationMessage(getRandomMessage(deepWorkStartMessages));

    // Update every second
    deepWorkInterval = setInterval(() => {
        remainingSeconds--;

        if (deepWorkStatusBarItem) {
            deepWorkStatusBarItem.text = `$(clock) ☕ ${formatTime(remainingSeconds)}`;
        }

        // Progress notifications at 5-minute intervals
        if (remainingSeconds > 0 && remainingSeconds % 300 === 0) {
            const minutesLeft = remainingSeconds / 60;
            vscode.window.showInformationMessage(
                `☕ ${minutesLeft} minutes remaining in your deep work session. Keep going!`
            );
        }

        // Session complete
        if (remainingSeconds <= 0) {
            clearInterval(deepWorkInterval!);
            deepWorkInterval = undefined;

            if (deepWorkStatusBarItem) {
                deepWorkStatusBarItem.text = '$(check) ☕ Session Complete!';
                deepWorkStatusBarItem.color = '#98C379';

                // Auto-hide the status bar item after 10 seconds
                setTimeout(() => {
                    if (deepWorkStatusBarItem) {
                        deepWorkStatusBarItem.dispose();
                        deepWorkStatusBarItem = undefined;
                    }
                }, 10000);
            }

            vscode.window.showInformationMessage(
                getRandomMessage(deepWorkCompleteMessages),
                'Start Another'
            ).then(selection => {
                if (selection === 'Start Another') {
                    startDeepWorkSession();
                }
            });
        }
    }, 1000);
}

// ─── Command: Coffee Break Reminder ──────────────────────────────────────────

/**
 * Toggles the coffee break reminder on/off.
 * 
 * When enabled:
 * - Shows a status bar indicator
 * - Sends a friendly reminder every 60 minutes
 * - Uses randomized coffee-themed messages
 * 
 * When disabled:
 * - Clears the interval and hides the indicator
 */
function toggleCoffeeBreakReminder(): void {
    isCoffeeBreakActive = !isCoffeeBreakActive;

    if (isCoffeeBreakActive) {
        // Create status bar indicator
        coffeeBreakStatusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            50
        );
        coffeeBreakStatusBarItem.text = '$(bell) ☕ Break Reminder: ON';
        coffeeBreakStatusBarItem.tooltip = 'Code & Coffee: Coffee break reminder is active (every 60 min)';
        coffeeBreakStatusBarItem.color = '#C68E5A';
        coffeeBreakStatusBarItem.command = 'codeAndCoffee.coffeeBreakReminder';
        coffeeBreakStatusBarItem.show();

        // Set 60-minute interval
        coffeeBreakInterval = setInterval(() => {
            const message = getRandomMessage(coffeeBreakMessages);
            vscode.window.showInformationMessage(message, 'Dismiss', 'Stop Reminders')
                .then(selection => {
                    if (selection === 'Stop Reminders') {
                        // Deactivate reminders if user clicks "Stop Reminders"
                        toggleCoffeeBreakReminder();
                    }
                });
        }, 60 * 60 * 1000); // 60 minutes in milliseconds

        vscode.window.showInformationMessage(
            '☕ Coffee break reminder activated! I\'ll nudge you every 60 minutes.'
        );
    } else {
        // Clear the interval
        if (coffeeBreakInterval) {
            clearInterval(coffeeBreakInterval);
            coffeeBreakInterval = undefined;
        }

        // Remove status bar indicator
        if (coffeeBreakStatusBarItem) {
            coffeeBreakStatusBarItem.dispose();
            coffeeBreakStatusBarItem = undefined;
        }

        vscode.window.showInformationMessage(
            '☕ Coffee break reminder deactivated. Remember to take breaks on your own!'
        );
    }
}

// ─── Extension Lifecycle ─────────────────────────────────────────────────────

/**
 * Called when the extension is activated.
 * Registers all commands and sets up the extension.
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('☕ Code & Coffee Theme extension is now active!');

    // Register: Toggle Focus Mode
    const focusModeCmd = vscode.commands.registerCommand(
        'codeAndCoffee.toggleFocusMode',
        () => toggleFocusMode(context)
    );

    // Register: Start Deep Work Session
    const deepWorkCmd = vscode.commands.registerCommand(
        'codeAndCoffee.startDeepWorkSession',
        () => startDeepWorkSession()
    );

    // Register: Coffee Break Reminder
    const coffeeBreakCmd = vscode.commands.registerCommand(
        'codeAndCoffee.coffeeBreakReminder',
        () => toggleCoffeeBreakReminder()
    );

    // Add all disposables to the context
    context.subscriptions.push(focusModeCmd, deepWorkCmd, coffeeBreakCmd);
}

/**
 * Called when the extension is deactivated.
 * Cleans up all timers and status bar items.
 */
export function deactivate(): void {
    // Clean up deep work timer
    if (deepWorkInterval) {
        clearInterval(deepWorkInterval);
        deepWorkInterval = undefined;
    }
    if (deepWorkStatusBarItem) {
        deepWorkStatusBarItem.dispose();
        deepWorkStatusBarItem = undefined;
    }

    // Clean up coffee break reminder
    if (coffeeBreakInterval) {
        clearInterval(coffeeBreakInterval);
        coffeeBreakInterval = undefined;
    }
    if (coffeeBreakStatusBarItem) {
        coffeeBreakStatusBarItem.dispose();
        coffeeBreakStatusBarItem = undefined;
    }

    console.log('☕ Code & Coffee Theme extension deactivated. See you next brew!');
}
