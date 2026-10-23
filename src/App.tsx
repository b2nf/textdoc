import { useState } from 'react'
import { cleanMarkdown, type LinkMode } from './core/cleanMarkdown'
import './App.css'

type Theme = 'light' | 'dark'
type ActionIconName = 'wand-sparkles' | 'trash-2' | 'copy'

function ActionIcon({ name }: { name: ActionIconName }) {
  return (
    <svg
      className="action-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'wand-sparkles' && (
        <>
          {/* Diagonal magic wand */}
          <path d="m4 20 12-12" />
          <path d="m13 7 4 4" />
          <path d="m4 20 2-6 8-8 4 4-8 8-6 2Z" />

          {/* Sparkles */}
          <path d="M18 2.5v4" />
          <path d="M16 4.5h4" />

          <path d="M7 3v3" />
          <path d="M5.5 4.5h3" />

          <path d="M21 12v3" />
          <path d="M19.5 13.5h3" />
        </>
      )}

      {name === 'trash-2' && (
        <>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="m19 6-1 14H6L5 6" />
          <path d="M10 11v5" />
          <path d="M14 11v5" />
        </>
      )}

      {name === 'copy' && (
        <>
          <rect x="8" y="8" width="13" height="13" rx="2" />
          <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
        </>
      )}
    </svg>
  )
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return window.localStorage.getItem('textdoc-theme') === 'dark'
        ? 'dark'
        : 'light'
    } catch {
      return 'light'
    }
  })

  const [hasToggledTheme, setHasToggledTheme] = useState(false)
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [linkMode, setLinkMode] = useState<LinkMode>('text')
  const [copyMessage, setCopyMessage] = useState('')

  function handleThemeToggle() {
    const nextTheme = theme === 'light' ? 'dark' : 'light'

    setTheme(nextTheme)
    setHasToggledTheme(true)
    setIsThemeTransitioning(true)

    window.setTimeout(() => {
      setIsThemeTransitioning(false)
    }, 520)

    try {
      window.localStorage.setItem('textdoc-theme', nextTheme)
    } catch {
      // Saving the appearance preference is optional.
    }
  }

  function handleClean() {
    try {
      setOutput(cleanMarkdown(input, linkMode))
      setCopyMessage('')
    } catch {
      setCopyMessage('Could not process the text. Please check your input.')
    }
  }

  function handleClear() {
    setInput('')
    setOutput('')
    setCopyMessage('')
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(output)
      setCopyMessage('Copied to clipboard')
    } catch {
      setCopyMessage('Copy unavailable. Select the text and copy it manually.')
    }
  }

  return (
    <div
      className={`app-shell ${isThemeTransitioning ? 'theme-changing' : ''}`}
      data-theme={theme}
    >
      <header className="topbar">
        <div className="brand" aria-label="TextDoc">
          <span className="brand-name">
            <span className="brand-text">Text</span>
            <span className="brand-doc">Doc</span>
          </span>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={handleThemeToggle}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-pressed={theme === 'dark'}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span
              className={`theme-icon ${
                hasToggledTheme ? 'theme-icon--animate' : ''
              }`}
              aria-hidden="true"
            >
              <svg className="theme-sun" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="3.75"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>

              <svg className="theme-moon" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.463.402.807a6.5 6.5 0 0 0 8.268 8.268c.344-.215.829-.003.803.397Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>

          <svg
            className="local-processing-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M7.5 18H6.8a4.3 4.3 0 0 1-.4-8.6A6.1 6.1 0 0 1 18 8.3a4.1 4.1 0 0 1 1.1 8.1H17"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 4L20 20"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>

          <span className="privacy-label">LOCAL PROCESSING</span>
        </div>
      </header>

      <main className="main-content">
        <section className="intro">
          <h1>
            Make text <span>plain again.</span>
          </h1>
          <p className="intro-description">
            Remove formatting. Keep the meaning.
          </p>
        </section>

        <section className="workspace" aria-label="Text cleaner">
          <article className="text-panel">
            <div className="panel-header">
              <div className="panel-heading">
                <span className="panel-number">01</span>
                <h2>Input</h2>
              </div>

              <button
                type="button"
                className="primary-button clean-button"
                onClick={handleClean}
                disabled={!input.trim()}
              >
                <ActionIcon name="wand-sparkles" />
                <span>Clean text</span>
              </button>
            </div>

            <p className="field-hint">PASTE YOUR TEXT</p>

            <textarea
              className="text-area"
              aria-label="Input text"
              placeholder="Paste Markdown here…"
              value={input}
              onChange={(event) => {
                setInput(event.target.value)
                setCopyMessage('')
              }}
              spellCheck={false}
            />

            <div className="panel-footer">
              <span>{input.length} characters</span>

              <button
                type="button"
                className="small-button footer-clear-button"
                onClick={handleClear}
                disabled={!input && !output}
              >
                <ActionIcon name="trash-2" />
                <span>Clear</span>
              </button>
            </div>
          </article>

          <article className="text-panel output-panel">
            <div className="panel-header">
              <div className="panel-heading">
                <span className="panel-number">02</span>
                <h2>Output</h2>
              </div>

              <button
                type="button"
                className="small-button copy-button"
                onClick={handleCopy}
                disabled={!output}
              >
                <ActionIcon name="copy" />
                <span>Copy</span>
              </button>
            </div>

            <p className="field-hint">CLEANED TEXT</p>

            <textarea
              className="text-area output-area"
              aria-label="Cleaned output"
              placeholder="Your cleaned text will appear here."
              value={output}
              readOnly
              spellCheck={false}
            />

            <div className="panel-footer">
              <span>{output.length} characters</span>

              {copyMessage && (
                <span className="status-message" role="status">
                  {copyMessage}
                </span>
              )}
            </div>
          </article>
        </section>

        <section className="bottom-controls" aria-label="Cleaning settings">

          <div className="link-settings setting-block">
            <span className="settings-label" id="link-settings-label">
              Link handling
            </span>

            <div
              className="segmented-control link-segmented-control"
              role="group"
              aria-labelledby="link-settings-label"
            >
              <button
                type="button"
                className={`segment-option ${linkMode === 'text' ? 'is-selected' : ''}`}
                aria-pressed={linkMode === 'text'}
                onClick={() => setLinkMode('text')}
              >
                Keep text
              </button>

              <button
                type="button"
                className={`segment-option ${linkMode === 'domain' ? 'is-selected' : ''}`}
                aria-pressed={linkMode === 'domain'}
                onClick={() => setLinkMode('domain')}
              >
                Domain only
              </button>

              <button
                type="button"
                className={`segment-option ${linkMode === 'remove' ? 'is-selected' : ''}`}
                aria-pressed={linkMode === 'remove'}
                onClick={() => setLinkMode('remove')}
              >
                Remove links
              </button>
            </div>

            <p className="link-help">
              Choose how links should appear after cleaning.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App