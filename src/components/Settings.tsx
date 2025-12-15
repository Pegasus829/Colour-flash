import { useGame } from '../contexts/GameContext';

export function Settings() {
  const { settings, toggleSound, toggleDarkMode } = useGame();

  return (
    <div className="card">
      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <span>⚙️</span> Settings
      </h2>

      <div className="space-y-3">
        {/* Sound Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="text-xl">{settings.soundEnabled ? '🔊' : '🔇'}</span>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200">Sound Effects</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {settings.soundEnabled ? 'On' : 'Off'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleSound}
            className={`
              relative w-14 h-8 rounded-full transition-colors duration-200
              ${settings.soundEnabled
                ? 'bg-blue-500'
                : 'bg-slate-300 dark:bg-slate-600'
              }
            `}
            aria-label={settings.soundEnabled ? 'Disable sound' : 'Enable sound'}
          >
            <span
              className={`
                absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200
                ${settings.soundEnabled ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="text-xl">{settings.darkMode ? '🌙' : '☀️'}</span>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200">Dark Mode</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {settings.darkMode ? 'On' : 'Off'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`
              relative w-14 h-8 rounded-full transition-colors duration-200
              ${settings.darkMode
                ? 'bg-blue-500'
                : 'bg-slate-300 dark:bg-slate-600'
              }
            `}
            aria-label={settings.darkMode ? 'Disable dark mode' : 'Enable dark mode'}
          >
            <span
              className={`
                absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200
                ${settings.darkMode ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
