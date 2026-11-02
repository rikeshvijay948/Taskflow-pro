# Taskflow Pro — Advanced Dynamic To-Do List Application

A responsive, feature-rich task and productivity management suite built with pure Vanilla JavaScript (DOM manipulation), modern CSS, and local persistence.

## 🌟 Key Features

- **Multi-View System**:
  - **List View**: Grouped task management (Overdue, Today, Upcoming, Completed) with priority badges, custom tags, and inline checklist counters.
  - **Kanban Board**: Drag-and-drop workflow across *To Do*, *In Progress*, and *Done* columns.
  - **Interactive Calendar View**: Month calendar with day chips, overdue alerts, and direct click-to-add scheduling.
  - **Eisenhower Priority Matrix**: 4-quadrant decision matrix (*Urgent & Important*, *Important Not Urgent*, *Urgent Not Important*, *Low Priority*).
  - **Productivity Analytics & Stats**: Completion rate gauge, active workload statistics, category distribution, and priority breakdowns.

- **Integrated Pomodoro Focus Timer**:
  - Customizable intervals: *Focus (25m)*, *Short Break (5m)*, *Long Break (15m)*.
  - Active task linking to focus sessions.
  - Live progress countdown in UI, header pill, and browser tab title.
  - Harmonic chime notifications and celebration confetti upon completion.
  - Daily session tracker (🍅) and total focus minutes persistence.
  - Global keyboard shortcut: Press <kbd>F</kbd> anytime to open the focus timer.

- **Dynamic DOM Manipulation Engine**:
  - Programmatic DOM lifecycle (`document.createElement`, `DocumentFragment`, dataset bindings).
  - Native HTML5 Drag & Drop reordering and board column moves.
  - Inline instant editing on double-click.
  - Interactive subtasks checklist with dynamic progress calculation.
  - Toast notifications with progress timers and in-memory Undo stack.
  - Canvas confetti particle engine and Web Audio API synthesized sound effects.

- **Smart Organization & Natural Language Parsing**:
  - Smart Quick-Add bar that parses commands like `Team retrospective tomorrow #work !urgent`.
  - Color-coded project categories.
  - Real-time search with keyword highlighting.
  - Multi-criteria sorting (Due Date, Priority, Title, Manual Order).

- **Data Portability**:
  - Automatic `localStorage` offline sync.
  - One-click JSON backup export & restore.
  - CSV export for spreadsheet analysis.
  - Print / PDF stylesheet.

## 🚀 Getting Started

### Option 1: Direct File
Double-click `index.html` to open directly in any modern browser.

### Option 2: Local Server
```bash
node server.js
```
Then visit [http://localhost:3000](http://localhost:3000).

## 🛠️ Tech Stack
- Vanilla JavaScript (ES6+)
- CSS3 Custom Properties & Modern Flexbox/Grid
- HTML5 Semantic Markup
- Node.js (Static Server)
