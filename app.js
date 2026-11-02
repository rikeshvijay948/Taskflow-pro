/**
 * ============================================================================
 * Taskflow Pro - Advanced Dynamic To-Do Application Engine
 * Pure Vanilla JavaScript with Rich DOM Manipulation & Reactive Store
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Initial State & Storage Keys
  // --------------------------------------------------------------------------
  const STORAGE_KEY_TASKS = 'taskflow_tasks_v2';
  const STORAGE_KEY_CATEGORIES = 'taskflow_categories_v2';
  const STORAGE_KEY_THEME = 'taskflow_theme_v2';
  const STORAGE_KEY_SOUND = 'taskflow_sound_v2';

  const DEFAULT_CATEGORIES = [
    { id: 'general', name: 'General', color: '#64748b', isDefault: true },
    { id: 'work', name: 'Work', color: '#4f46e5' },
    { id: 'personal', name: 'Personal', color: '#10b981' },
    { id: 'study', name: 'Study', color: '#f59e0b' },
    { id: 'health', name: 'Health', color: '#ec4899' },
  ];

  function getRelativeDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }

  const INITIAL_DEMO_TASKS = [
    {
      id: 'demo-1',
      title: 'Review Project Roadmap & Sprint Backlog',
      description: 'Align with the design and engineering teams on quarterly deliverables.',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '11:00',
      priority: 'urgent',
      category: 'work',
      tags: ['roadmap', 'planning'],
      completed: false,
      completedAt: null,
      starred: true,
      subtasks: [
        { id: 'st-1', title: 'Check ticket backlog', completed: true },
        { id: 'st-2', title: 'Draft sprint goals', completed: false },
        { id: 'st-3', title: 'Schedule sync call', completed: false }
      ],
      order: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-2',
      title: 'Complete 30-minute cardio & stretch workout',
      description: 'Morning HIIT or jogging session followed by hydration.',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '07:30',
      priority: 'high',
      category: 'health',
      tags: ['fitness', 'routine'],
      completed: true,
      completedAt: new Date().toISOString(),
      starred: false,
      subtasks: [],
      order: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-3',
      title: 'Study Advanced JavaScript DOM APIs',
      description: 'Deep-dive into MutationObserver, Drag and Drop API, and Custom Events.',
      dueDate: getRelativeDate(1),
      dueTime: '15:00',
      priority: 'medium',
      category: 'study',
      tags: ['javascript', 'frontend'],
      completed: false,
      completedAt: null,
      starred: true,
      subtasks: [
        { id: 'st-4', title: 'Read MDN Drag and Drop specification', completed: true },
        { id: 'st-5', title: 'Practice DocumentFragment rendering', completed: true }
      ],
      order: 2,
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-4',
      title: 'Grocery shopping for weekly meal prep',
      description: 'Fresh vegetables, oats, almond milk, and Greek yogurt.',
      dueDate: getRelativeDate(2),
      dueTime: '18:00',
      priority: 'low',
      category: 'personal',
      tags: ['errands', 'shopping'],
      completed: false,
      completedAt: null,
      starred: false,
      subtasks: [],
      order: 3,
      createdAt: new Date().toISOString()
    }
  ];

  // Application State Store
  const state = {
    tasks: [],
    categories: [],
    activeFilter: 'all', // 'all' | 'today' | 'tomorrow' | 'upcoming' | 'overdue' | 'starred' | 'completed' | categoryId
    activeTag: null,
    activeView: 'list', // 'list' | 'kanban' | 'calendar' | 'matrix' | 'analytics'
    searchQuery: '',
    sortBy: 'custom',
    priorityFilter: 'all',
    calendarMonthDate: new Date(),
    soundEnabled: true,
    editingTaskId: null,
    undoStack: [],
    modalSubtasks: []
  };

  // --------------------------------------------------------------------------
  // 2. Sound Effects Engine (Web Audio API Synthesizer)
  // --------------------------------------------------------------------------
  const SoundFX = {
    ctx: null,

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    },

    play(type) {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        if (type === 'complete') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);
          osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else if (type === 'add') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
        } else if (type === 'delete') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
        } else if (type === 'bell' || type === 'timer') {
          // Harmonic chime alert
          [523.25, 659.25, 783.99].forEach((freq, idx) => {
            const subOsc = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(freq, now + idx * 0.12);
            subGain.gain.setValueAtTime(0.2, now + idx * 0.12);
            subGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.38);
            subOsc.connect(subGain);
            subGain.connect(this.ctx.destination);
            subOsc.start(now + idx * 0.12);
            subOsc.stop(now + idx * 0.12 + 0.4);
          });
        }
      } catch (err) {
        // Ignore audio errors silently
      }
    }
  };

  // --------------------------------------------------------------------------
  // 3. Canvas Confetti Particle Celebration Engine
  // --------------------------------------------------------------------------
  const ConfettiEngine = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,

    init() {
      try {
        this.canvas = document.getElementById('confetti-canvas');
        if (!this.canvas || typeof this.canvas.getContext !== 'function') return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
      } catch (e) {
        this.ctx = null;
      }
    },

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth || 800;
      this.canvas.height = window.innerHeight || 600;
    },

    burst(originX = window.innerWidth / 2, originY = window.innerHeight / 2) {
      if (!this.ctx) this.init();
      if (!this.ctx) return;
      const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#38bdf8', '#a855f7'];
      const count = 60;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 4 + Math.random() * 8;
        this.particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 2,
          size: 4 + Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          gravity: 0.18,
          opacity: 1,
          decay: 0.015 + Math.random() * 0.015
        });
      }

      if (!this.animationId) {
        this.loop();
      }
    },

    loop() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        if (p.opacity <= 0 || p.y > this.canvas.height) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animationId = requestAnimationFrame(() => this.loop());
      } else {
        this.animationId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  };

  // --------------------------------------------------------------------------
  // 4. State Store & LocalStorage Persistence
  // --------------------------------------------------------------------------
  const Store = {
    load() {
      try {
        const savedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
        state.tasks = savedTasks ? JSON.parse(savedTasks) : INITIAL_DEMO_TASKS;

        const savedCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES);
        state.categories = savedCategories ? JSON.parse(savedCategories) : DEFAULT_CATEGORIES;

        const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'light';
        state.theme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);

        const savedSound = localStorage.getItem(STORAGE_KEY_SOUND);
        state.soundEnabled = savedSound !== null ? JSON.parse(savedSound) : true;
      } catch (err) {
        console.error('Error loading state from localStorage:', err);
        state.tasks = INITIAL_DEMO_TASKS;
        state.categories = DEFAULT_CATEGORIES;
      }
    },

    save(pushUndo = true) {
      if (pushUndo) {
        this.pushUndoSnapshot();
      }
      try {
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(state.tasks));
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(state.categories));
        localStorage.setItem(STORAGE_KEY_THEME, state.theme);
        localStorage.setItem(STORAGE_KEY_SOUND, JSON.stringify(state.soundEnabled));
      } catch (err) {
        console.error('Error saving state to localStorage:', err);
      }
      AppRenderer.updateSidebarCounts();
      AppRenderer.updateProductivityWidget();
      AppRenderer.renderSidebarTags();
    },

    pushUndoSnapshot() {
      const snapshot = JSON.stringify(state.tasks);
      state.undoStack.push(snapshot);
      if (state.undoStack.length > 20) {
        state.undoStack.shift();
      }
    },

    undo() {
      if (state.undoStack.length === 0) {
        UI.showToast('No actions to undo', 'info');
        return;
      }
      const previous = state.undoStack.pop();
      try {
        state.tasks = JSON.parse(previous);
        this.save(false);
        AppRenderer.renderCurrentView();
        UI.showToast('Action undone!', 'success');
        SoundFX.play('add');
      } catch (e) {
        console.error('Undo parse error', e);
      }
    },

    addTask(taskData) {
      const newTask = {
        id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        title: taskData.title.trim(),
        description: (taskData.description || '').trim(),
        dueDate: taskData.dueDate || '',
        dueTime: taskData.dueTime || '',
        priority: taskData.priority || 'medium',
        category: taskData.category || 'general',
        tags: Array.isArray(taskData.tags) ? taskData.tags : parseTags(taskData.tags || ''),
        completed: false,
        completedAt: null,
        starred: !!taskData.starred,
        subtasks: taskData.subtasks || [],
        order: state.tasks.length,
        createdAt: new Date().toISOString()
      };

      state.tasks.unshift(newTask);
      this.save();
      SoundFX.play('add');
      UI.showToast(`Task created!`, 'success');
      AppRenderer.renderCurrentView();
      return newTask;
    },

    updateTask(id, updates) {
      const index = state.tasks.findIndex(t => t.id === id);
      if (index === -1) return;

      state.tasks[index] = { ...state.tasks[index], ...updates };
      this.save();
      AppRenderer.renderCurrentView();
    },

    toggleTaskCompletion(id, originEvent = null) {
      const task = state.tasks.find(t => t.id === id);
      if (!task) return;

      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;

      if (task.completed) {
        SoundFX.play('complete');
        const x = originEvent ? originEvent.clientX : window.innerWidth / 2;
        const y = originEvent ? originEvent.clientY : window.innerHeight / 2;
        ConfettiEngine.burst(x, y);
        UI.showToast('Task marked complete!', 'success', true);
      }

      this.save();
      AppRenderer.renderCurrentView();
    },

    toggleTaskStarred(id) {
      const task = state.tasks.find(t => t.id === id);
      if (!task) return;
      task.starred = !task.starred;
      this.save();
      AppRenderer.renderCurrentView();
      SoundFX.play('add');
    },

    deleteTask(id) {
      const task = state.tasks.find(t => t.id === id);
      if (!task) return;

      const title = task.title;
      state.tasks = state.tasks.filter(t => t.id !== id);
      this.save();
      SoundFX.play('delete');
      UI.showToast(`Deleted "${title.slice(0, 25)}"`, 'info', true);
      AppRenderer.renderCurrentView();
    },

    toggleSubtask(taskId, subtaskId) {
      const task = state.tasks.find(t => t.id === taskId);
      if (!task || !task.subtasks) return;

      const subtask = task.subtasks.find(st => st.id === subtaskId);
      if (subtask) {
        subtask.completed = !subtask.completed;
        SoundFX.play('add');
        this.save();
        AppRenderer.renderCurrentView();
      }
    },

    reorderTasks(sourceIndex, targetIndex) {
      if (sourceIndex === targetIndex) return;
      const movedItem = state.tasks.splice(sourceIndex, 1)[0];
      state.tasks.splice(targetIndex, 0, movedItem);

      state.tasks.forEach((t, idx) => (t.order = idx));
      this.save();
      AppRenderer.renderCurrentView();
    },

    addCategory(name, color) {
      const id = 'cat-' + Date.now();
      const newCat = { id, name: name.trim(), color: color || '#4f46e5' };
      state.categories.push(newCat);
      this.save();
      AppRenderer.populateCategoryDropdowns();
      AppRenderer.renderSidebarCategories();
      UI.showToast(`Category "${newCat.name}" added!`, 'success');
      return newCat;
    },

    deleteCategory(id) {
      if (id === 'general') {
        UI.showToast('Cannot delete default category', 'warning');
        return;
      }
      state.categories = state.categories.filter(c => c.id !== id);
      state.tasks.forEach(t => {
        if (t.category === id) t.category = 'general';
      });
      if (state.activeFilter === id) {
        state.activeFilter = 'all';
      }
      this.save();
      AppRenderer.populateCategoryDropdowns();
      AppRenderer.renderSidebarCategories();
      AppRenderer.renderCurrentView();
      UI.showToast('Category removed', 'info');
    }
  };

  function parseTags(tagStr) {
    if (!tagStr) return [];
    return tagStr
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(t => t.length > 0);
  }

  // --------------------------------------------------------------------------
  // 5. Querying & Filtering Engine
  // --------------------------------------------------------------------------
  function getFilteredTasks() {
    let result = [...state.tasks];
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = getRelativeDate(1);

    // 1. Navigation Filter
    if (state.activeFilter === 'today') {
      result = result.filter(t => t.dueDate === todayStr);
    } else if (state.activeFilter === 'tomorrow') {
      result = result.filter(t => t.dueDate === tomorrowStr);
    } else if (state.activeFilter === 'upcoming') {
      result = result.filter(t => t.dueDate && t.dueDate > todayStr && !t.completed);
    } else if (state.activeFilter === 'overdue') {
      result = result.filter(t => t.dueDate && t.dueDate < todayStr && !t.completed);
    } else if (state.activeFilter === 'starred') {
      result = result.filter(t => t.starred);
    } else if (state.activeFilter === 'completed') {
      result = result.filter(t => t.completed);
    } else if (state.activeFilter !== 'all') {
      result = result.filter(t => t.category === state.activeFilter);
    }

    // 2. Priority Filter
    if (state.priorityFilter !== 'all') {
      result = result.filter(t => t.priority === state.priorityFilter);
    }

    // 2b. Tag Cloud Filter
    if (state.activeTag) {
      result = result.filter(t => (t.tags || []).some(tg => tg.toLowerCase() === state.activeTag.toLowerCase()));
    }

    // 3. Search Query Filter
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      result = result.filter(t => {
        const titleMatch = t.title.toLowerCase().includes(q);
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const tagMatch = (t.tags || []).some(tag => tag.toLowerCase().includes(q));
        const catMatch = (getCategoryName(t.category) || '').toLowerCase().includes(q);
        return titleMatch || descMatch || tagMatch || catMatch;
      });
    }

    // 4. Sorting
    const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
    if (state.sortBy === 'dueDateAsc') {
      result.sort((a, b) => (a.dueDate || '9999') > (b.dueDate || '9999') ? 1 : -1);
    } else if (state.sortBy === 'dueDateDesc') {
      result.sort((a, b) => (a.dueDate || '') < (b.dueDate || '') ? 1 : -1);
    } else if (state.sortBy === 'priorityDesc') {
      result.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
    } else if (state.sortBy === 'priorityAsc') {
      result.sort((a, b) => (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0));
    } else if (state.sortBy === 'titleAsc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return result;
  }

  function getCategoryName(catId) {
    const cat = state.categories.find(c => c.id === catId);
    return cat ? cat.name : 'General';
  }

  function getCategoryColor(catId) {
    const cat = state.categories.find(c => c.id === catId);
    return cat ? cat.color : '#64748b';
  }

  // --------------------------------------------------------------------------
  // 6. Dynamic DOM Renderer & View Builders
  // --------------------------------------------------------------------------
  const AppRenderer = {
    container: document.getElementById('viewContentArea'),

    renderCurrentView() {
      if (!this.container) {
        this.container = document.getElementById('viewContentArea');
      }
      if (!this.container) return;

      this.updateViewHeader();
      this.container.innerHTML = '';

      if (state.activeView === 'list') {
        this.renderListView();
      } else if (state.activeView === 'kanban') {
        this.renderKanbanView();
      } else if (state.activeView === 'calendar') {
        this.renderCalendarView();
      } else if (state.activeView === 'matrix') {
        this.renderMatrixView();
      } else if (state.activeView === 'analytics') {
        this.renderAnalyticsView();
      }
    },

    updateViewHeader() {
      const headingEl = document.getElementById('activeViewHeading');
      const subtitleEl = document.getElementById('activeViewSubtitle');
      const filtered = getFilteredTasks();

      const filterNames = {
        all: 'All Tasks',
        today: 'Today’s Tasks',
        tomorrow: 'Tomorrow',
        upcoming: 'Upcoming Schedule',
        overdue: 'Overdue Tasks',
        starred: 'Important & Starred',
        completed: 'Completed Tasks'
      };

      let title = filterNames[state.activeFilter] || getCategoryName(state.activeFilter);
      if (state.activeTag) {
        title += ` • #${state.activeTag}`;
      }
      if (state.activeView === 'analytics') title = 'Productivity & Analytics';
      if (state.activeView === 'calendar') title = 'Calendar Schedule';
      if (state.activeView === 'matrix') title = 'Eisenhower Priority Matrix';

      if (headingEl) headingEl.textContent = title;
      if (subtitleEl) {
        const activeCount = filtered.filter(t => !t.completed).length;
        subtitleEl.textContent = `${filtered.length} total (${activeCount} active)`;
      }
    },

    updateSidebarCounts() {
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrowStr = getRelativeDate(1);

      const counts = {
        all: state.tasks.length,
        today: state.tasks.filter(t => t.dueDate === todayStr).length,
        tomorrow: state.tasks.filter(t => t.dueDate === tomorrowStr).length,
        upcoming: state.tasks.filter(t => t.dueDate && t.dueDate > todayStr && !t.completed).length,
        overdue: state.tasks.filter(t => t.dueDate && t.dueDate < todayStr && !t.completed).length,
        starred: state.tasks.filter(t => t.starred).length,
        completed: state.tasks.filter(t => t.completed).length
      };

      Object.keys(counts).forEach(key => {
        const el = document.getElementById(`count-${key}`);
        if (el) el.textContent = counts[key];
      });
    },

    renderSidebarCategories() {
      const navContainer = document.getElementById('categoriesListNav');
      if (!navContainer) return;

      navContainer.innerHTML = '';
      const fragment = document.createDocumentFragment();

      state.categories.forEach(cat => {
        const catCount = state.tasks.filter(t => t.category === cat.id).length;
        const btn = document.createElement('button');
        btn.className = `nav-btn ${state.activeFilter === cat.id ? 'active' : ''}`;
        btn.dataset.filter = cat.id;

        const dot = document.createElement('span');
        dot.className = 'category-dot';
        dot.style.backgroundColor = cat.color;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = cat.name;

        const countSpan = document.createElement('span');
        countSpan.className = 'badge-count';
        countSpan.textContent = catCount;

        btn.appendChild(dot);
        btn.appendChild(nameSpan);
        btn.appendChild(countSpan);

        if (!cat.isDefault) {
          const deleteBtn = document.createElement('span');
          deleteBtn.innerHTML = '&times;';
          deleteBtn.style.marginLeft = '4px';
          deleteBtn.style.color = 'var(--text-muted)';
          deleteBtn.style.fontSize = '14px';
          deleteBtn.title = 'Delete category';
          deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Delete category "${cat.name}"?`)) {
              Store.deleteCategory(cat.id);
            }
          };
          btn.appendChild(deleteBtn);
        }

        fragment.appendChild(btn);
      });

      navContainer.appendChild(fragment);
    },

    renderSidebarTags() {
      const navContainer = document.getElementById('tagsListNav');
      if (!navContainer) return;
      navContainer.innerHTML = '';

      const tagCounts = {};
      state.tasks.forEach(task => {
        (task.tags || []).forEach(tag => {
          if (tag && tag.trim()) {
            const clean = tag.trim().toLowerCase();
            tagCounts[clean] = (tagCounts[clean] || 0) + 1;
          }
        });
      });

      const tags = Object.keys(tagCounts).sort();
      if (tags.length === 0) {
        navContainer.innerHTML = '<span style="font-size: 0.78rem; color: var(--text-muted); padding: 4px 10px;">No tags added yet</span>';
        return;
      }

      const wrap = document.createElement('div');
      wrap.className = 'tags-cloud-wrap';

      tags.forEach(tag => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `tag-cloud-chip ${state.activeTag === tag ? 'active' : ''}`;
        btn.innerHTML = `#${escapeHTML(tag)} <span class="tag-cloud-count">${tagCounts[tag]}</span>`;
        btn.onclick = () => {
          state.activeTag = (state.activeTag === tag) ? null : tag;
          AppRenderer.renderSidebarTags();
          AppRenderer.renderCurrentView();
        };
        wrap.appendChild(btn);
      });

      navContainer.appendChild(wrap);
    },

    populateCategoryDropdowns() {
      const selects = [
        document.getElementById('quickTaskCategory'),
        document.getElementById('modalTaskCategory')
      ];

      selects.forEach(select => {
        if (!select) return;
        const currVal = select.value;
        select.innerHTML = '';
        state.categories.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.name;
          select.appendChild(opt);
        });
        if (currVal) select.value = currVal;
      });
    },

    updateProductivityWidget() {
      const total = state.tasks.length;
      const completed = state.tasks.filter(t => t.completed).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      const percentEl = document.getElementById('productivityPercent');
      const barEl = document.getElementById('productivityProgressBar');
      const ratioEl = document.getElementById('productivityRatio');

      if (percentEl) percentEl.textContent = `${percent}%`;
      if (barEl) barEl.style.width = `${percent}%`;
      if (ratioEl) ratioEl.textContent = `${completed}/${total} completed`;
    },

    // ------------------------------------------------------------------------
    // Dynamic Task Card Node Builder
    // ------------------------------------------------------------------------
    createTaskCardElement(task) {
      const card = document.createElement('div');
      card.className = `task-card ${task.completed ? 'completed' : ''}`;
      card.dataset.taskId = task.id;
      card.setAttribute('draggable', 'true');

      // Main Row
      const mainRow = document.createElement('div');
      mainRow.className = 'task-card-main';

      // Drag Handle
      const dragHandle = document.createElement('div');
      dragHandle.className = 'drag-handle';
      dragHandle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>`;
      mainRow.appendChild(dragHandle);

      // Checkbox container
      const checkContainer = document.createElement('div');
      checkContainer.className = 'task-checkbox-container';
      const checkbox = document.createElement('button');
      checkbox.type = 'button';
      checkbox.className = 'custom-checkbox';
      checkbox.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
      checkbox.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>`;
      checkbox.onclick = (e) => {
        e.stopPropagation();
        Store.toggleTaskCompletion(task.id, e);
      };
      checkContainer.appendChild(checkbox);
      mainRow.appendChild(checkContainer);

      // Body (Title, Notes, Metadata)
      const body = document.createElement('div');
      body.className = 'task-body';

      // Title row
      const titleRow = document.createElement('div');
      titleRow.className = 'task-title-row';
      const title = document.createElement('span');
      title.className = 'task-title';
      title.innerHTML = highlightMatch(task.title, state.searchQuery);
      
      // Inline edit on double-click
      title.ondblclick = (e) => {
        e.stopPropagation();
        enableInlineEdit(task, title, 'title');
      };
      titleRow.appendChild(title);
      body.appendChild(titleRow);

      // Description
      if (task.description) {
        const desc = document.createElement('p');
        desc.className = 'task-desc';
        desc.innerHTML = highlightMatch(task.description, state.searchQuery);
        desc.ondblclick = (e) => {
          e.stopPropagation();
          enableInlineEdit(task, desc, 'description');
        };
        body.appendChild(desc);
      }

      // Metadata Row
      const metaRow = document.createElement('div');
      metaRow.className = 'task-meta-row';

      // Priority Badge
      const pBadge = document.createElement('span');
      pBadge.className = `task-badge badge-priority-${task.priority}`;
      pBadge.textContent = task.priority.toUpperCase();
      metaRow.appendChild(pBadge);

      // Category Badge
      const catBadge = document.createElement('span');
      catBadge.className = 'task-badge badge-category';
      catBadge.innerHTML = `<span class="category-dot" style="background-color: ${getCategoryColor(task.category)}"></span> ${getCategoryName(task.category)}`;
      metaRow.appendChild(catBadge);

      // Due Date Badge
      if (task.dueDate) {
        const dateBadge = document.createElement('span');
        const todayStr = new Date().toISOString().split('T')[0];
        const isOverdue = task.dueDate < todayStr && !task.completed;
        const isToday = task.dueDate === todayStr;

        dateBadge.className = `task-badge badge-date ${isOverdue ? 'is-overdue' : ''} ${isToday ? 'is-today' : ''}`;
        const timeStr = task.dueTime ? ` at ${task.dueTime}` : '';
        dateBadge.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg> ${formatDateDisplay(task.dueDate)}${timeStr}`;
        metaRow.appendChild(dateBadge);
      }

      // Tags Badges
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tag => {
          const tagBadge = document.createElement('span');
          const isTagActive = state.activeTag && state.activeTag.toLowerCase() === tag.toLowerCase();
          tagBadge.className = `task-badge badge-tag ${isTagActive ? 'active' : ''}`;
          tagBadge.textContent = `#${tag}`;
          tagBadge.title = `Click to filter by #${tag}`;
          tagBadge.onclick = (e) => {
            e.stopPropagation();
            state.activeTag = isTagActive ? null : tag.toLowerCase();
            AppRenderer.renderSidebarTags();
            AppRenderer.renderCurrentView();
          };
          metaRow.appendChild(tagBadge);
        });
      }

      // Subtasks count badge
      if (task.subtasks && task.subtasks.length > 0) {
        const completedSub = task.subtasks.filter(st => st.completed).length;
        const subBadge = document.createElement('span');
        subBadge.className = 'task-badge badge-subtasks';
        subBadge.innerHTML = `☑ ${completedSub}/${task.subtasks.length}`;
        metaRow.appendChild(subBadge);
      }

      body.appendChild(metaRow);
      mainRow.appendChild(body);

      // Action toolbar (Star, Edit, Delete)
      const actions = document.createElement('div');
      actions.className = 'task-actions';

      // Star button
      const starBtn = document.createElement('button');
      starBtn.className = `task-action-btn btn-star ${task.starred ? 'starred' : ''}`;
      starBtn.title = task.starred ? 'Unstar' : 'Star';
      starBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="${task.starred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      starBtn.onclick = (e) => {
        e.stopPropagation();
        Store.toggleTaskStarred(task.id);
      };
      actions.appendChild(starBtn);

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'task-action-btn';
      editBtn.title = 'Edit task';
      editBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
      editBtn.onclick = (e) => {
        e.stopPropagation();
        UI.openTaskModal(task);
      };
      actions.appendChild(editBtn);

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'task-action-btn btn-delete';
      deleteBtn.title = 'Delete task';
      deleteBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        Store.deleteTask(task.id);
      };
      actions.appendChild(deleteBtn);

      mainRow.appendChild(actions);
      card.appendChild(mainRow);

      // Subtasks Preview & Inline Toggling
      if (task.subtasks && task.subtasks.length > 0) {
        const subtasksBox = document.createElement('div');
        subtasksBox.className = 'task-subtasks-preview';

        task.subtasks.forEach(st => {
          const stItem = document.createElement('div');
          stItem.className = `subtask-item ${st.completed ? 'completed' : ''}`;

          const stCheck = document.createElement('input');
          stCheck.type = 'checkbox';
          stCheck.className = 'subtask-checkbox';
          stCheck.checked = st.completed;
          stCheck.onclick = (e) => {
            e.stopPropagation();
            Store.toggleSubtask(task.id, st.id);
          };

          const stTitle = document.createElement('span');
          stTitle.textContent = st.title;

          stItem.appendChild(stCheck);
          stItem.appendChild(stTitle);
          subtasksBox.appendChild(stItem);
        });

        card.appendChild(subtasksBox);
      }

      DragDropEngine.attachCardEvents(card, task);
      return card;
    },

    // ------------------------------------------------------------------------
    // View 1: List View
    // ------------------------------------------------------------------------
    renderListView() {
      const filtered = getFilteredTasks();
      const listContainer = document.createElement('div');
      listContainer.className = 'tasks-container';

      if (filtered.length === 0) {
        listContainer.appendChild(createEmptyState('No tasks found', 'Create a new task or adjust your filters to see tasks here.'));
        this.container.appendChild(listContainer);
        return;
      }

      if (state.activeFilter === 'all' && !state.searchQuery) {
        const todayStr = new Date().toISOString().split('T')[0];
        const overdueTasks = filtered.filter(t => t.dueDate && t.dueDate < todayStr && !t.completed);
        const todayTasks = filtered.filter(t => t.dueDate === todayStr && !t.completed);
        const upcomingTasks = filtered.filter(t => (!t.dueDate || t.dueDate > todayStr) && !t.completed);
        const completedTasks = filtered.filter(t => t.completed);

        const groups = [
          { title: 'Overdue', tasks: overdueTasks, isOverdue: true },
          { title: 'Today', tasks: todayTasks },
          { title: 'Upcoming & Other', tasks: upcomingTasks },
          { title: 'Completed', tasks: completedTasks }
        ];

        groups.forEach(grp => {
          if (grp.tasks.length > 0) {
            const groupEl = document.createElement('div');
            groupEl.className = 'task-group';

            const header = document.createElement('div');
            header.className = 'task-group-header';
            header.innerHTML = `
              <span class="task-group-title ${grp.isOverdue ? 'overdue' : ''}">
                ${grp.title}
              </span>
              <span class="task-group-count">${grp.tasks.length}</span>
            `;
            groupEl.appendChild(header);

            grp.tasks.forEach(task => {
              groupEl.appendChild(this.createTaskCardElement(task));
            });

            listContainer.appendChild(groupEl);
          }
        });
      } else {
        filtered.forEach(task => {
          listContainer.appendChild(this.createTaskCardElement(task));
        });
      }

      this.container.appendChild(listContainer);
    },

    // ------------------------------------------------------------------------
    // View 2: Kanban Board View
    // ------------------------------------------------------------------------
    renderKanbanView() {
      const filtered = getFilteredTasks();
      const board = document.createElement('div');
      board.className = 'kanban-board';

      const columns = [
        { id: 'todo', title: 'To Do', icon: '📋', filter: t => !t.completed && (!t.subtasks || t.subtasks.every(st => !st.completed)) },
        { id: 'inprogress', title: 'In Progress', icon: '⏳', filter: t => !t.completed && t.subtasks && t.subtasks.some(st => st.completed) && t.subtasks.some(st => !st.completed) },
        { id: 'done', title: 'Completed', icon: '✅', filter: t => t.completed }
      ];

      columns.forEach(col => {
        const colTasks = filtered.filter(col.filter);
        const colEl = document.createElement('div');
        colEl.className = 'kanban-column';
        colEl.dataset.columnId = col.id;

        const header = document.createElement('div');
        header.className = 'kanban-column-header';
        header.innerHTML = `
          <div class="kanban-column-title">
            <span>${col.icon}</span>
            <span>${col.title}</span>
          </div>
          <span class="kanban-column-badge">${colTasks.length}</span>
        `;
        colEl.appendChild(header);

        const body = document.createElement('div');
        body.className = 'kanban-column-body';
        body.dataset.columnId = col.id;

        colTasks.forEach(task => {
          body.appendChild(this.createTaskCardElement(task));
        });

        DragDropEngine.attachColumnEvents(body, col.id);
        colEl.appendChild(body);
        board.appendChild(colEl);
      });

      this.container.appendChild(board);
    },

    // ------------------------------------------------------------------------
    // View 3: Calendar View
    // ------------------------------------------------------------------------
    renderCalendarView() {
      const viewWrapper = document.createElement('div');
      viewWrapper.className = 'calendar-view';

      const currentYear = state.calendarMonthDate.getFullYear();
      const currentMonth = state.calendarMonthDate.getMonth();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      const header = document.createElement('div');
      header.className = 'calendar-header';
      header.innerHTML = `
        <div class="calendar-nav-title">${monthNames[currentMonth]} ${currentYear}</div>
        <div class="calendar-nav-controls">
          <button class="btn-secondary" id="calPrevBtn">◀</button>
          <button class="btn-secondary" id="calTodayBtn">Today</button>
          <button class="btn-secondary" id="calNextBtn">▶</button>
        </div>
      `;
      viewWrapper.appendChild(header);

      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekdaysRow = document.createElement('div');
      weekdaysRow.className = 'calendar-grid-weekdays';
      weekdays.forEach(day => {
        const dEl = document.createElement('div');
        dEl.textContent = day;
        weekdaysRow.appendChild(dEl);
      });
      viewWrapper.appendChild(weekdaysRow);

      const daysGrid = document.createElement('div');
      daysGrid.className = 'calendar-grid-days';

      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
      const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
      const todayIso = new Date().toISOString().split('T')[0];

      for (let i = firstDay - 1; i >= 0; i--) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell other-month';
        cell.innerHTML = `<div class="day-cell-top"><span class="day-number">${prevMonthDays - i}</span></div>`;
        daysGrid.appendChild(cell);
      }

      for (let day = 1; day <= totalDays; day++) {
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        const dateIso = `${currentYear}-${monthStr}-${dayStr}`;

        const cell = document.createElement('div');
        cell.className = `calendar-day-cell ${dateIso === todayIso ? 'today' : ''}`;
        cell.dataset.date = dateIso;

        const cellTop = document.createElement('div');
        cellTop.className = 'day-cell-top';
        cellTop.innerHTML = `
          <span class="day-number">${day}</span>
          <button class="day-add-btn" title="Add task on this date">+</button>
        `;
        cell.appendChild(cellTop);

        const addBtn = cellTop.querySelector('.day-add-btn');
        addBtn.onclick = () => {
          UI.openTaskModal({ dueDate: dateIso });
        };

        const dayTasks = state.tasks.filter(t => t.dueDate === dateIso);
        if (dayTasks.length > 0) {
          const chipsContainer = document.createElement('div');
          chipsContainer.className = 'calendar-task-chips';

          dayTasks.forEach(task => {
            const chip = document.createElement('div');
            chip.className = `calendar-chip ${task.completed ? 'completed' : ''}`;
            chip.style.borderLeftColor = getCategoryColor(task.category);
            chip.textContent = task.title;
            chip.title = `${task.title} (${task.priority})`;
            chip.onclick = (e) => {
              e.stopPropagation();
              UI.openTaskModal(task);
            };
            chipsContainer.appendChild(chip);
          });

          cell.appendChild(chipsContainer);
        }

        daysGrid.appendChild(cell);
      }

      viewWrapper.appendChild(daysGrid);
      this.container.appendChild(viewWrapper);

      const prevBtn = document.getElementById('calPrevBtn');
      const nextBtn = document.getElementById('calNextBtn');
      const todayBtn = document.getElementById('calTodayBtn');

      if (prevBtn) {
        prevBtn.onclick = () => {
          state.calendarMonthDate.setMonth(state.calendarMonthDate.getMonth() - 1);
          AppRenderer.renderCalendarView();
        };
      }
      if (nextBtn) {
        nextBtn.onclick = () => {
          state.calendarMonthDate.setMonth(state.calendarMonthDate.getMonth() + 1);
          AppRenderer.renderCalendarView();
        };
      }
      if (todayBtn) {
        todayBtn.onclick = () => {
          state.calendarMonthDate = new Date();
          AppRenderer.renderCalendarView();
        };
      }
    },

    // ------------------------------------------------------------------------
    // View 4: Eisenhower Priority Matrix View
    // ------------------------------------------------------------------------
    renderMatrixView() {
      const filtered = getFilteredTasks();
      const matrix = document.createElement('div');
      matrix.className = 'matrix-view';

      const quadrants = [
        { id: 'q1', priority: 'urgent', title: '🔴 Urgent & Important', subtitle: 'Do Immediately' },
        { id: 'q2', priority: 'high', title: '🟠 Important (Not Urgent)', subtitle: 'Plan & Schedule' },
        { id: 'q3', priority: 'medium', title: '🟡 Urgent (Not Important)', subtitle: 'Delegate / Quick Win' },
        { id: 'q4', priority: 'low', title: '🟢 Neither (Low Priority)', subtitle: 'Drop or Do Later' }
      ];

      quadrants.forEach((q, idx) => {
        const qTasks = filtered.filter(t => t.priority === q.priority);
        const quadEl = document.createElement('div');
        quadEl.className = `matrix-quadrant matrix-q${idx + 1}`;

        const header = document.createElement('div');
        header.className = 'matrix-quadrant-header';
        header.innerHTML = `
          <div>
            <h3 class="matrix-quadrant-title">${q.title}</h3>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${q.subtitle}</span>
          </div>
          <span class="task-group-count">${qTasks.length}</span>
        `;
        quadEl.appendChild(header);

        const body = document.createElement('div');
        body.className = 'matrix-quadrant-body';
        body.dataset.matrixPriority = q.priority;

        qTasks.forEach(task => {
          body.appendChild(this.createTaskCardElement(task));
        });

        DragDropEngine.attachMatrixEvents(body, q.priority);
        quadEl.appendChild(body);
        matrix.appendChild(quadEl);
      });

      this.container.appendChild(matrix);
    },

    // ------------------------------------------------------------------------
    // View 5: Productivity & Analytics View
    // ------------------------------------------------------------------------
    renderAnalyticsView() {
      const total = state.tasks.length;
      const completed = state.tasks.filter(t => t.completed).length;
      const active = total - completed;
      const starred = state.tasks.filter(t => t.starred).length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const viewWrapper = document.createElement('div');
      viewWrapper.className = 'analytics-view';

      const statsGrid = document.createElement('div');
      statsGrid.className = 'stats-grid';
      statsGrid.innerHTML = `
        <div class="stat-card">
          <div class="stat-card-header"><span>Completion Rate</span> 🎯</div>
          <div class="stat-value">${completionRate}%</div>
          <div class="stat-label">${completed} of ${total} tasks finished</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><span>Active Tasks</span> ⏳</div>
          <div class="stat-value">${active}</div>
          <div class="stat-label">Pending in pipeline</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><span>Important Tasks</span> ⭐</div>
          <div class="stat-value">${starred}</div>
          <div class="stat-label">Starred priorities</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><span>Categories</span> 🏷️</div>
          <div class="stat-value">${state.categories.length}</div>
          <div class="stat-label">Active workspaces</div>
        </div>
      `;
      viewWrapper.appendChild(statsGrid);

      const breakdownGrid = document.createElement('div');
      breakdownGrid.className = 'analytics-charts-grid';

      // 1. Category Distribution Card
      const catCard = document.createElement('div');
      catCard.className = 'chart-card';
      catCard.innerHTML = `<h3 class="chart-card-title">Category Distribution</h3>`;
      const catList = document.createElement('div');
      catList.className = 'progress-breakdown-list';

      state.categories.forEach(cat => {
        const count = state.tasks.filter(t => t.category === cat.id).length;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const item = document.createElement('div');
        item.className = 'progress-item';
        item.innerHTML = `
          <div class="progress-item-label">
            <span>${cat.name}</span>
            <span>${count} (${pct}%)</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${pct}%; background: ${cat.color}"></div>
          </div>
        `;
        catList.appendChild(item);
      });
      catCard.appendChild(catList);
      breakdownGrid.appendChild(catCard);

      // 2. Priority Breakdown Card
      const pCard = document.createElement('div');
      pCard.className = 'chart-card';
      pCard.innerHTML = `<h3 class="chart-card-title">Priority Breakdown</h3>`;
      const pList = document.createElement('div');
      pList.className = 'progress-breakdown-list';

      const priorities = [
        { id: 'urgent', name: 'Urgent', color: 'var(--priority-urgent)' },
        { id: 'high', name: 'High', color: 'var(--priority-high)' },
        { id: 'medium', name: 'Medium', color: 'var(--priority-medium)' },
        { id: 'low', name: 'Low', color: 'var(--priority-low)' }
      ];

      priorities.forEach(p => {
        const count = state.tasks.filter(t => t.priority === p.id).length;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const item = document.createElement('div');
        item.className = 'progress-item';
        item.innerHTML = `
          <div class="progress-item-label">
            <span>${p.name}</span>
            <span>${count} (${pct}%)</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${pct}%; background: ${p.color}"></div>
          </div>
        `;
        pList.appendChild(item);
      });
      pCard.appendChild(pList);
      breakdownGrid.appendChild(pCard);

      viewWrapper.appendChild(breakdownGrid);
      this.container.appendChild(viewWrapper);
    }
  };

  // --------------------------------------------------------------------------
  // 7. Inline Dynamic Editing Helper
  // --------------------------------------------------------------------------
  function enableInlineEdit(task, targetElement, fieldKey) {
    const originalText = task[fieldKey] || '';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-edit-input';
    input.value = originalText;

    const commitEdit = () => {
      const newVal = input.value.trim();
      if (newVal && newVal !== originalText) {
        Store.updateTask(task.id, { [fieldKey]: newVal });
        UI.showToast('Task updated!', 'success');
      } else {
        AppRenderer.renderCurrentView();
      }
    };

    input.onblur = commitEdit;
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        input.blur();
      } else if (e.key === 'Escape') {
        input.value = originalText;
        input.blur();
      }
    };

    targetElement.replaceWith(input);
    input.focus();
    input.select();
  }

  // --------------------------------------------------------------------------
  // 8. HTML5 Native Drag & Drop Engine
  // --------------------------------------------------------------------------
  const DragDropEngine = {
    draggedTaskId: null,

    attachCardEvents(card, task) {
      card.addEventListener('dragstart', (e) => {
        this.draggedTaskId = task.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over'));
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (this.draggedTaskId && this.draggedTaskId !== task.id) {
          const sourceIdx = state.tasks.findIndex(t => t.id === this.draggedTaskId);
          const targetIdx = state.tasks.findIndex(t => t.id === task.id);
          if (sourceIdx !== -1 && targetIdx !== -1) {
            Store.reorderTasks(sourceIdx, targetIdx);
          }
        }
      });
    },

    attachColumnEvents(columnBody, columnId) {
      columnBody.addEventListener('dragover', (e) => {
        e.preventDefault();
        columnBody.classList.add('drag-target-active');
      });

      columnBody.addEventListener('dragleave', () => {
        columnBody.classList.remove('drag-target-active');
      });

      columnBody.addEventListener('drop', (e) => {
        e.preventDefault();
        columnBody.classList.remove('drag-target-active');
        const taskId = e.dataTransfer.getData('text/plain') || this.draggedTaskId;
        if (!taskId) return;

        if (columnId === 'done') {
          Store.updateTask(taskId, { completed: true, completedAt: new Date().toISOString() });
          SoundFX.play('complete');
        } else {
          Store.updateTask(taskId, { completed: false, completedAt: null });
          SoundFX.play('add');
        }
      });
    },

    attachMatrixEvents(quadrantBody, priority) {
      quadrantBody.addEventListener('dragover', (e) => {
        e.preventDefault();
        quadrantBody.style.background = 'var(--bg-surface-active)';
      });

      quadrantBody.addEventListener('dragleave', () => {
        quadrantBody.style.background = '';
      });

      quadrantBody.addEventListener('drop', (e) => {
        e.preventDefault();
        quadrantBody.style.background = '';
        const taskId = e.dataTransfer.getData('text/plain') || this.draggedTaskId;
        if (taskId) {
          Store.updateTask(taskId, { priority });
          SoundFX.play('add');
          UI.showToast(`Moved to ${priority.toUpperCase()} priority`, 'success');
        }
      });
    }
  };

  // --------------------------------------------------------------------------
  // 9. UI Modals, Toast Notifications & Dialog Manager
  // --------------------------------------------------------------------------
  const UI = {
    showToast(message, type = 'info', showUndo = false) {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = 'toast';

      const iconMap = {
        success: '✅',
        info: 'ℹ️',
        warning: '⚠️',
        danger: '❌'
      };

      toast.innerHTML = `
        <span class="toast-icon">${iconMap[type] || '✨'}</span>
        <span class="toast-message">${message}</span>
        ${showUndo ? '<button class="toast-btn-undo">Undo</button>' : ''}
        <div class="toast-progress"></div>
      `;

      if (showUndo) {
        const undoBtn = toast.querySelector('.toast-btn-undo');
        undoBtn.onclick = () => {
          Store.undo();
          toast.remove();
        };
      }

      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 250);
      }, 4000);
    },

    openTaskModal(task = null) {
      const modal = document.getElementById('taskModal');
      const form = document.getElementById('taskModalForm');
      const titleEl = document.getElementById('taskModalTitle');
      const idInput = document.getElementById('modalTaskId');
      const titleInput = document.getElementById('modalTaskTitle');
      const descInput = document.getElementById('modalTaskDescription');
      const dateInput = document.getElementById('modalTaskDueDate');
      const timeInput = document.getElementById('modalTaskDueTime');
      const priorityInput = document.getElementById('modalTaskPriority');
      const catInput = document.getElementById('modalTaskCategory');
      const tagsInput = document.getElementById('modalTaskTags');

      AppRenderer.populateCategoryDropdowns();
      state.modalSubtasks = [];

      if (task && task.id) {
        titleEl.textContent = 'Edit Task';
        idInput.value = task.id;
        titleInput.value = task.title || '';
        descInput.value = task.description || '';
        dateInput.value = task.dueDate || '';
        timeInput.value = task.dueTime || '';
        priorityInput.value = task.priority || 'medium';
        catInput.value = task.category || 'general';
        tagsInput.value = (task.tags || []).join(', ');
        state.modalSubtasks = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
      } else {
        titleEl.textContent = 'New Task';
        form.reset();
        idInput.value = '';
        if (task && task.dueDate) {
          dateInput.value = task.dueDate;
        } else if (state.activeFilter === 'today') {
          dateInput.value = new Date().toISOString().split('T')[0];
        } else if (state.activeFilter === 'tomorrow') {
          dateInput.value = getRelativeDate(1);
        }
      }

      this.renderModalSubtasks();
      modal.classList.add('active');
      setTimeout(() => titleInput.focus(), 50);
    },

    closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('active');
    },

    renderModalSubtasks() {
      const listEl = document.getElementById('modalSubtasksList');
      if (!listEl) return;
      listEl.innerHTML = '';

      state.modalSubtasks.forEach((st, idx) => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        item.style.padding = '4px 8px';
        item.style.background = 'var(--bg-surface-hover)';
        item.style.borderRadius = 'var(--radius-xs)';

        const textSpan = document.createElement('span');
        textSpan.textContent = st.title;
        textSpan.style.fontSize = '0.85rem';

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.innerHTML = '&times;';
        delBtn.style.color = 'var(--accent-danger)';
        delBtn.onclick = () => {
          state.modalSubtasks.splice(idx, 1);
          UI.renderModalSubtasks();
        };

        item.appendChild(textSpan);
        item.appendChild(delBtn);
        listEl.appendChild(item);
      });
    }
  };

  // --------------------------------------------------------------------------
  // 10. Data Backup / JSON / CSV Engine
  // --------------------------------------------------------------------------
  const DataPortability = {
    exportJson() {
      const data = {
        version: 2,
        exportedAt: new Date().toISOString(),
        tasks: state.tasks,
        categories: state.categories
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      UI.showToast('JSON backup downloaded!', 'success');
    },

    exportCsv() {
      const headers = ['ID', 'Title', 'Description', 'Due Date', 'Due Time', 'Priority', 'Category', 'Completed', 'Tags'];
      const rows = state.tasks.map(t => [
        t.id,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.dueDate || '',
        t.dueTime || '',
        t.priority,
        getCategoryName(t.category),
        t.completed ? 'Yes' : 'No',
        `"${(t.tags || []).join(', ')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taskflow-tasks-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      UI.showToast('CSV export downloaded!', 'success');
    },

    importJson(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (parsed && Array.isArray(parsed.tasks)) {
            state.tasks = parsed.tasks;
            if (Array.isArray(parsed.categories)) {
              state.categories = parsed.categories;
            }
            Store.save();
            AppRenderer.populateCategoryDropdowns();
            AppRenderer.renderSidebarCategories();
            AppRenderer.renderCurrentView();
            UI.closeModal('dataModal');
            UI.showToast('Data imported successfully!', 'success');
          } else {
            alert('Invalid Taskflow backup JSON format.');
          }
        } catch (err) {
          alert('Failed to parse JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  // --------------------------------------------------------------------------
  // 10b. Pomodoro Focus Timer Engine
  // --------------------------------------------------------------------------
  const STORAGE_KEY_POMODORO = 'taskflow_pomodoro_v2';

  const FocusTimer = {
    duration: 25 * 60,
    timeLeft: 25 * 60,
    mode: 'focus', // 'focus' | 'shortBreak' | 'longBreak'
    isRunning: false,
    timerId: null,
    sessionsToday: 0,
    totalMinutesFocused: 0,

    init() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_POMODORO) || '{}');
        const todayStr = new Date().toISOString().split('T')[0];
        if (saved.date === todayStr) {
          this.sessionsToday = saved.sessionsToday || 0;
          this.totalMinutesFocused = saved.totalMinutesFocused || 0;
        } else {
          this.sessionsToday = 0;
          this.totalMinutesFocused = 0;
        }
      } catch (e) {
        this.sessionsToday = 0;
        this.totalMinutesFocused = 0;
      }
      this.updateUI();
    },

    saveStats() {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem(STORAGE_KEY_POMODORO, JSON.stringify({
          date: todayStr,
          sessionsToday: this.sessionsToday,
          totalMinutesFocused: this.totalMinutesFocused
        }));
      } catch (e) {}
    },

    setMode(mode) {
      this.pause();
      this.mode = mode;
      if (mode === 'focus') {
        this.duration = 25 * 60;
      } else if (mode === 'shortBreak') {
        this.duration = 5 * 60;
      } else if (mode === 'longBreak') {
        this.duration = 15 * 60;
      }
      this.timeLeft = this.duration;

      document.querySelectorAll('.focus-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.focusMode === mode);
      });

      const statusEl = document.getElementById('focusTimerStatus');
      if (statusEl) {
        statusEl.textContent = mode === 'focus' ? 'Ready to focus' : (mode === 'shortBreak' ? 'Short break time' : 'Long break time');
      }

      this.updateUI();
    },

    toggle() {
      if (this.isRunning) {
        this.pause();
      } else {
        this.start();
      }
    },

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      SoundFX.play('add');

      const startBtnText = document.getElementById('focusStartBtnText');
      const startIcon = document.getElementById('focusStartIcon');
      const toggleBtn = document.getElementById('focusTimerToggleBtn');

      if (startBtnText) startBtnText.textContent = 'Pause';
      if (startIcon) startIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
      if (toggleBtn) toggleBtn.classList.add('running');

      const statusEl = document.getElementById('focusTimerStatus');
      if (statusEl) {
        statusEl.textContent = this.mode === 'focus' ? '🔥 Focusing...' : '☕ Recharging...';
      }

      this.timerId = setInterval(() => this.tick(), 1000);
      this.updateUI();
    },

    pause() {
      this.isRunning = false;
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }

      const startBtnText = document.getElementById('focusStartBtnText');
      const startIcon = document.getElementById('focusStartIcon');
      const toggleBtn = document.getElementById('focusTimerToggleBtn');

      if (startBtnText) startBtnText.textContent = 'Resume';
      if (startIcon) startIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
      if (toggleBtn) toggleBtn.classList.remove('running');

      const statusEl = document.getElementById('focusTimerStatus');
      if (statusEl) {
        statusEl.textContent = 'Paused';
      }

      this.updateUI();
    },

    reset() {
      this.pause();
      this.timeLeft = this.duration;
      const startBtnText = document.getElementById('focusStartBtnText');
      if (startBtnText) startBtnText.textContent = this.mode === 'focus' ? 'Start Focus' : 'Start Break';
      const statusEl = document.getElementById('focusTimerStatus');
      if (statusEl) {
        statusEl.textContent = this.mode === 'focus' ? 'Ready to focus' : 'Ready for break';
      }
      this.updateUI();
    },

    tick() {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        if (this.mode === 'focus' && this.timeLeft % 60 === 0) {
          this.totalMinutesFocused++;
          this.saveStats();
        }
        this.updateUI();
      } else {
        this.completeSession();
      }
    },

    completeSession() {
      this.pause();
      SoundFX.play('bell');
      ConfettiEngine.burst();

      if (this.mode === 'focus') {
        this.sessionsToday++;
        this.totalMinutesFocused += Math.round(this.duration / 60);
        this.saveStats();

        const taskSelect = document.getElementById('focusTaskSelect');
        const selectedTaskId = taskSelect ? taskSelect.value : null;
        if (selectedTaskId) {
          const task = state.tasks.find(t => t.id === selectedTaskId);
          if (task) {
            UI.showToast(`🎯 Focus session finished for "${task.title.slice(0, 20)}"!`, 'success');
          }
        } else {
          UI.showToast('🎉 Focus session complete! Time for a break.', 'success');
        }

        if (this.sessionsToday % 4 === 0) {
          this.setMode('longBreak');
        } else {
          this.setMode('shortBreak');
        }
      } else {
        UI.showToast('☕ Break over! Time to get back in the flow.', 'info');
        this.setMode('focus');
      }
    },

    updateUI() {
      const minutes = Math.floor(this.timeLeft / 60);
      const seconds = this.timeLeft % 60;
      const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      const clockEl = document.getElementById('focusTimerClock');
      if (clockEl) clockEl.textContent = timeStr;

      const headerPill = document.getElementById('focusHeaderPill');
      if (headerPill) {
        headerPill.textContent = timeStr;
        headerPill.style.display = this.isRunning ? 'inline' : 'none';
      }

      const progressFill = document.getElementById('focusProgressFill');
      if (progressFill && this.duration > 0) {
        const pct = Math.max(0, Math.min(100, (this.timeLeft / this.duration) * 100));
        progressFill.style.width = `${pct}%`;
      }

      const sessionsEl = document.getElementById('focusSessionsCount');
      if (sessionsEl) sessionsEl.textContent = this.sessionsToday;

      const minutesEl = document.getElementById('focusMinutesCount');
      if (minutesEl) minutesEl.textContent = this.totalMinutesFocused;

      if (this.isRunning) {
        document.title = `(${timeStr}) Taskflow • Dynamic Productivity`;
      } else {
        document.title = 'Taskflow • Dynamic Productivity & To-Do Suite';
      }
    },

    openModal() {
      const taskSelect = document.getElementById('focusTaskSelect');
      if (taskSelect) {
        const currVal = taskSelect.value;
        taskSelect.innerHTML = '<option value="">-- General Focus Session --</option>';
        state.tasks.filter(t => !t.completed).forEach(t => {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = `${t.priority === 'urgent' ? '🔴' : t.priority === 'high' ? '🟠' : '🔵'} ${t.title}`;
          taskSelect.appendChild(opt);
        });
        if (currVal) taskSelect.value = currVal;
      }
      this.updateUI();
      const modal = document.getElementById('focusModal');
      if (modal) modal.classList.add('active');
    }
  };

  // --------------------------------------------------------------------------
  // 11. Helper Utilities
  // --------------------------------------------------------------------------
  function highlightMatch(text, query) {
    if (!text) return '';
    if (!query || !query.trim()) return escapeHTML(text);

    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    return escapeHTML(text).replace(regex, '<span class="highlight-match">$1</span>');
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDateDisplay(isoDateStr) {
    if (!isoDateStr) return '';
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = getRelativeDate(1);
    const yesterday = getRelativeDate(-1);

    if (isoDateStr === today) return 'Today';
    if (isoDateStr === tomorrow) return 'Tomorrow';
    if (isoDateStr === yesterday) return 'Yesterday';

    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return isoDateStr;
  }

  function parseNaturalTaskText(inputStr) {
    let text = inputStr;
    let dueDate = '';
    let dueTime = '';
    let priority = '';
    let category = '';
    const tags = [];

    // Priority shortcuts: !urgent, !high, !medium, !low, !p1, !p2, !p3, !p4
    if (/\b!(urgent|high|medium|low)\b/i.test(text)) {
      const match = text.match(/\b!(urgent|high|medium|low)\b/i);
      priority = match[1].toLowerCase();
      text = text.replace(match[0], '');
    } else if (/\b!p(1|2|3|4)\b/i.test(text)) {
      const match = text.match(/\b!p([1-4])\b/i);
      const pMap = { '1': 'urgent', '2': 'high', '3': 'medium', '4': 'low' };
      priority = pMap[match[1]] || 'medium';
      text = text.replace(match[0], '');
    }

    // Due Date keywords: today, tomorrow, tmrw, yesterday
    if (/\b(today)\b/i.test(text)) {
      dueDate = new Date().toISOString().split('T')[0];
      text = text.replace(/\b(today)\b/i, '');
    } else if (/\b(tomorrow|tmrw)\b/i.test(text)) {
      dueDate = getRelativeDate(1);
      text = text.replace(/\b(tomorrow|tmrw)\b/i, '');
    } else if (/\b(yesterday)\b/i.test(text)) {
      dueDate = getRelativeDate(-1);
      text = text.replace(/\b(yesterday)\b/i, '');
    }

    // Hashtags
    const tagMatches = text.match(/#([\w-]+)/g);
    if (tagMatches) {
      tagMatches.forEach(t => {
        const cleanTag = t.replace('#', '').toLowerCase();
        tags.push(cleanTag);
        const matchedCat = state.categories.find(c => c.name.toLowerCase() === cleanTag || c.id === cleanTag);
        if (matchedCat && !category) {
          category = matchedCat.id;
        }
        text = text.replace(t, '');
      });
    }

    text = text.replace(/\s+/g, ' ').trim();

    return {
      title: text,
      dueDate,
      dueTime,
      priority,
      category,
      tags
    };
  }

  function createEmptyState(title, desc) {
    const el = document.createElement('div');
    el.className = 'empty-state';
    el.innerHTML = `
      <div class="empty-state-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      </div>
      <h3 class="empty-state-title">${title}</h3>
      <p class="empty-state-desc">${desc}</p>
      <button class="btn-primary" onclick="document.getElementById('quickTaskInput').focus()">+ Add a Task</button>
    `;
    return el;
  }

  // --------------------------------------------------------------------------
  // 12. Event Listeners & Application Initialization
  // --------------------------------------------------------------------------
  function bindGlobalEvents() {
    // 1. Sidebar Navigation (Event Delegation)
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.addEventListener('click', (e) => {
        const btn = e.target.closest('.nav-btn');
        if (btn && btn.dataset.filter) {
          document.querySelectorAll('.sidebar .nav-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.activeFilter = btn.dataset.filter;
          AppRenderer.renderCurrentView();

          if (window.innerWidth <= 900) {
            sidebar.classList.remove('open');
          }
        }
      });
    }

    // 2. View Switcher Tabs
    document.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.segmented-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeView = btn.dataset.view;
        AppRenderer.renderCurrentView();
      });
    });

    // 3. Quick Add Task Form
    const quickForm = document.getElementById('quickAddForm');
    if (quickForm) {
      quickForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('quickTaskInput');
        const dateInput = document.getElementById('quickTaskDate');
        const priorityInput = document.getElementById('quickTaskPriority');
        const catInput = document.getElementById('quickTaskCategory');

        const rawText = input.value.trim();
        if (!rawText) return;

        const parsed = parseNaturalTaskText(rawText);
        const finalTitle = parsed.title || rawText;
        const finalDate = dateInput.value || parsed.dueDate || '';
        const finalPriority = priorityInput.value !== 'medium' ? priorityInput.value : (parsed.priority || 'medium');
        const finalCategory = catInput.value !== 'general' ? catInput.value : (parsed.category || 'general');
        const finalTags = parsed.tags || [];

        Store.addTask({
          title: finalTitle,
          dueDate: finalDate,
          priority: finalPriority,
          category: finalCategory,
          tags: finalTags
        });

        input.value = '';
        dateInput.value = '';
        priorityInput.value = 'medium';
      });
    }

    // 4. Modal Openers
    const newBtn = document.getElementById('openNewTaskModalBtn');
    if (newBtn) newBtn.onclick = () => UI.openTaskModal();

    const catBtn = document.getElementById('openCategoryModalBtn');
    if (catBtn) {
      catBtn.onclick = () => {
        document.getElementById('categoryModal').classList.add('active');
        document.getElementById('newCategoryName').focus();
      };
    }

    const backupBtn = document.getElementById('dataBackupBtn');
    if (backupBtn) backupBtn.onclick = () => document.getElementById('dataModal').classList.add('active');

    const shortcutsBtn = document.getElementById('shortcutsBtn');
    if (shortcutsBtn) shortcutsBtn.onclick = () => document.getElementById('shortcutsModal').classList.add('active');

    // 4b. Pomodoro Focus Timer Controls
    const focusBtn = document.getElementById('focusTimerToggleBtn');
    if (focusBtn) focusBtn.onclick = () => FocusTimer.openModal();

    const focusStart = document.getElementById('focusStartBtn');
    if (focusStart) focusStart.onclick = () => FocusTimer.toggle();

    const focusReset = document.getElementById('focusResetBtn');
    if (focusReset) focusReset.onclick = () => FocusTimer.reset();

    document.querySelectorAll('.focus-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        FocusTimer.setMode(btn.dataset.focusMode);
      });
    });

    // 5. Modal Closers (Data attribute delegate)
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-close-modal]');
      if (closeBtn) {
        UI.closeModal(closeBtn.dataset.closeModal);
      }
      if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
      }
    });

    // 6. Subtask Builder in Modal
    const addSubtaskBtn = document.getElementById('addSubtaskBtn');
    if (addSubtaskBtn) {
      addSubtaskBtn.onclick = () => {
        const input = document.getElementById('newSubtaskInput');
        if (input.value.trim()) {
          state.modalSubtasks.push({
            id: 'st-' + Date.now(),
            title: input.value.trim(),
            completed: false
          });
          input.value = '';
          UI.renderModalSubtasks();
        }
      };
    }

    const subInput = document.getElementById('newSubtaskInput');
    if (subInput) {
      subInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (addSubtaskBtn) addSubtaskBtn.click();
        }
      });
    }

    // 7. Save Task from Modal Form
    const taskModalForm = document.getElementById('taskModalForm');
    if (taskModalForm) {
      taskModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('modalTaskId').value;
        const title = document.getElementById('modalTaskTitle').value;
        const description = document.getElementById('modalTaskDescription').value;
        const dueDate = document.getElementById('modalTaskDueDate').value;
        const dueTime = document.getElementById('modalTaskDueTime').value;
        const priority = document.getElementById('modalTaskPriority').value;
        const category = document.getElementById('modalTaskCategory').value;
        const tags = parseTags(document.getElementById('modalTaskTags').value);

        if (id) {
          Store.updateTask(id, {
            title,
            description,
            dueDate,
            dueTime,
            priority,
            category,
            tags,
            subtasks: state.modalSubtasks
          });
          UI.showToast('Task saved!', 'success');
        } else {
          Store.addTask({
            title,
            description,
            dueDate,
            dueTime,
            priority,
            category,
            tags,
            subtasks: state.modalSubtasks
          });
        }

        UI.closeModal('taskModal');
      });
    }

    // 8. Create Category Form
    const catForm = document.getElementById('categoryModalForm');
    if (catForm) {
      catForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('newCategoryName').value;
        const color = document.getElementById('newCategoryColor').value;
        if (name.trim()) {
          Store.addCategory(name, color);
          document.getElementById('newCategoryName').value = '';
          UI.closeModal('categoryModal');
        }
      });
    }

    // 9. Global Search
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.searchQuery = e.target.value;
          AppRenderer.renderCurrentView();
        }, 100);
      });
    }

    // 10. Sort & Priority Selectors
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        AppRenderer.renderCurrentView();
      });
    }

    const priorityFilterSelect = document.getElementById('priorityFilterSelect');
    if (priorityFilterSelect) {
      priorityFilterSelect.addEventListener('change', (e) => {
        state.priorityFilter = e.target.value;
        AppRenderer.renderCurrentView();
      });
    }

    // 11. Theme & Sound Toggles
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.theme);
        Store.save(false);
        SoundFX.play('add');
      });
    }

    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        soundBtn.style.opacity = state.soundEnabled ? '1' : '0.4';
        Store.save(false);
        UI.showToast(state.soundEnabled ? 'Sound enabled' : 'Sound muted', 'info');
      });
    }

    // 12. Data Import / Export
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) exportJsonBtn.onclick = () => DataPortability.exportJson();

    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) exportCsvBtn.onclick = () => DataPortability.exportCsv();

    const printBtn = document.getElementById('printTasksBtn');
    if (printBtn) printBtn.onclick = () => window.print();

    const importInput = document.getElementById('importJsonInput');
    const triggerImportBtn = document.getElementById('triggerImportBtn');
    if (triggerImportBtn && importInput) {
      triggerImportBtn.onclick = () => importInput.click();
      importInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          DataPortability.importJson(e.target.files[0]);
        }
      });
    }

    const clearAllBtn = document.getElementById('clearAllDataBtn');
    if (clearAllBtn) {
      clearAllBtn.onclick = () => {
        if (confirm('Are you sure you want to clear all tasks and reset? This cannot be undone.')) {
          state.tasks = [];
          state.categories = DEFAULT_CATEGORIES;
          Store.save();
          AppRenderer.populateCategoryDropdowns();
          AppRenderer.renderSidebarCategories();
          AppRenderer.renderCurrentView();
          UI.closeModal('dataModal');
          UI.showToast('All data cleared', 'info');
        }
      };
    }

    // 13. Mobile Sidebar Toggle
    const mobileToggle = document.getElementById('sidebarToggleBtn');
    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // 14. Keyboard Shortcuts Handler
    window.addEventListener('keydown', (e) => {
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

      if (e.key === '/' && !inInput) {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      } else if ((e.key === 'n' || e.key === 'N') && !inInput) {
        e.preventDefault();
        UI.openTaskModal();
      } else if ((e.key === 'f' || e.key === 'F') && !inInput) {
        e.preventDefault();
        FocusTimer.openModal();
      } else if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        if (searchInput && document.activeElement === searchInput) {
          searchInput.value = '';
          state.searchQuery = '';
          searchInput.blur();
          AppRenderer.renderCurrentView();
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'z' && !inInput) {
        e.preventDefault();
        Store.undo();
      } else if (['1', '2', '3', '4', '5'].includes(e.key) && !inInput) {
        const views = ['list', 'kanban', 'calendar', 'matrix', 'analytics'];
        const targetView = views[parseInt(e.key, 10) - 1];
        if (targetView) {
          document.querySelectorAll('.segmented-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.view === targetView);
          });
          state.activeView = targetView;
          AppRenderer.renderCurrentView();
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // Application Bootstrap
  // --------------------------------------------------------------------------
  function init() {
    Store.load();
    ConfettiEngine.init();
    FocusTimer.init();
    AppRenderer.populateCategoryDropdowns();
    AppRenderer.renderSidebarCategories();
    AppRenderer.renderSidebarTags();
    AppRenderer.updateSidebarCounts();
    AppRenderer.updateProductivityWidget();
    AppRenderer.renderCurrentView();
    bindGlobalEvents();

    console.log('✨ Taskflow Pro Initialized.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
