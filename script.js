// script.js

const STORAGE_KEY = 'performanceBoard2025Data'; 
const LOG_STORAGE_KEY = 'activityLogs2025'; 
let currentCalendarDate = new Date(); 

// ------------------------------------------------
// メンバーリストの定義
// ------------------------------------------------
const MEMBER_LIST = [
    { id: 'A', name: '金子' },
    { id: 'B', name: '田中' },
    { id: 'C', name: '佐藤' },
    { id: 'D', name: '山田' },
    { id: 'E', name: '鈴木' },
];

// 初期データはメンバーIDを使うように変更
const DEFAULT_TASKS_DATA = [
    { id: "T001", description: "今後のスケジュール組み", currentStatus: "要対応", priority: "高", assignedTo: "A", deadline: "2025-11-15", problemDetails: "リハーサル日程と解決策を統合する。" },
    { id: "T002", description: "出はけ誰先頭でどういう順番か", currentStatus: "要対応", priority: "高", assignedTo: "A", deadline: "2025-11-20", problemDetails: "各曲ハケ時の先頭決定、詰まりやすい箇所を検証。" },
    { id: "T003", description: "WAバルコニー移動タイミング、動線", currentStatus: "要対応", priority: "高", assignedTo: "B", deadline: "要検討", problemDetails: "IN/OUT時の舞台上メンバーとの干渉確認が必須。" },
    { id: "T004", description: "全体的な振り揺れの修正", currentStatus: "進行中", priority: "中", assignedTo: "C", deadline: "2025-12-05", problemDetails: "全曲の振り付けで、グループ間のズレや定着度の確認と修正。" },
    { id: "T005", description: "晴れたらいいね選抜振り", currentStatus: "未着手", priority: "中", assignedTo: "D", deadline: "要検討", problemDetails: "選抜メンバーの振り付けの確定と指導開始。" },
    { id: "T008", description: "遺言並びの確定", currentStatus: "完了", priority: "高", assignedTo: "A", deadline: "2025-10-25", problemDetails: "全員の並び順と位置を確定済み。" }
];

let TASKS = [];
let ACTIVITY_LOGS = [];
let draggedCard = null;

// ------------------------------------------------
// ユーティリティ関数
// ------------------------------------------------

function getMemberName(id) {
    const member = MEMBER_LIST.find(m => m.id === id);
    return member ? member.name : id;
}

// ------------------------------------------------
// データ管理 (LocalStorage)
// ------------------------------------------------
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(TASKS));
}
function saveLogs() {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(ACTIVITY_LOGS));
}

function loadTasks() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        TASKS = JSON.parse(saved);
    } else {
        TASKS = DEFAULT_TASKS_DATA;
    }
    const logsSaved = localStorage.getItem(LOG_STORAGE_KEY);
    if (logsSaved) {
        ACTIVITY_LOGS = JSON.parse(logsSaved);
    } else {
        ACTIVITY_LOGS = [];
    }
}

// ------------------------------------------------
// タスクの描画 (表示)
// ------------------------------------------------

function createTaskCard(task) {
    const priorityClass = `priority-${task.priority.toLowerCase()}`;
    const card = document.createElement('div');
    card.className = `task-card ${priorityClass}`;
    card.setAttribute('data-task-id', task.id);
    card.setAttribute('draggable', true);

    card.innerHTML = `
        <div class="card-header">
            <span class="task-id">${task.id}</span>
            <span class="task-priority">${task.priority}</span>
        </div>
        <h3 class="task-description">${task.description}</h3>
        <div class="card-meta">
            <p>担当: <strong>${getMemberName(task.assignedTo)}</strong></p>
            <p>期限: <span>${task.deadline && task.deadline.length === 10 ? task.deadline.replace(/-/g, '/') : (task.deadline || '未定')}</span></p>
        </div>
    `;
    
    card.addEventListener('click', () => openEditModal(task));
    addDragListeners(card);
    return card;
}

function renderTasks() {
    const filterPriority = document.getElementById('filterPriority').value;
    const filterMemberId = document.getElementById('filterMember').value;

    const columns = {
        '要対応': document.getElementById('column-todo'),
        '未着手': document.getElementById('column-new'),
        '進行中': document.getElementById('column-inprogress'),
        '完了': document.getElementById('column-done')
    };

    Object.values(columns).forEach(column => {
        if (column) {
            const title = column.querySelector('h2').textContent;
            column.innerHTML = `<h2>${title}</h2>`;
        }
    });

    TASKS.forEach(task => {
        const matchesPriority = filterPriority === 'すべて' || task.priority === filterPriority;
        const matchesMember = filterMemberId === 'すべて' || task.assignedTo === filterMemberId;

        if (matchesPriority && matchesMember) {
            const columnElement = columns[task.currentStatus];
            if (columnElement) {
                const card = createTaskCard(task);
                columnElement.appendChild(card);
            }
        }
    });
}

// ------------------------------------------------
// 新規タスク追加機能
// ------------------------------------------------

function generateTaskId() {
    const maxId = TASKS.reduce((max, task) => {
        const num = parseInt(task.id.replace('T', ''));
        return num > max ? num : max;
    }, 0);
    return `T${String(maxId + 1).padStart(3, '0')}`;
}

function handleAddTask(event) {
    event.preventDefault();

    const desc = document.getElementById('taskDesc').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const assignedTo = document.getElementById('taskAssignedTo').value; // IDを取得
    
    if (!desc || !priority || !assignedTo) return;

    const newTask = {
        id: generateTaskId(),
        description: desc,
        currentStatus: '未着手',
        priority: priority,
        assignedTo: assignedTo,
        deadline: '要検討',
        problemDetails: ''
    };

    TASKS.push(newTask);
    saveTasks();
    renderTasks();
    
    document.getElementById('addTaskForm').reset();
}

// ------------------------------------------------
// 編集モーダル機能
// ------------------------------------------------

function openEditModal(task) {
    closeEditModal(); 
    
    const deadlineValue = (task.deadline && task.deadline.match(/^\d{4}-\d{2}-\d{2}$/)) ? task.deadline : '';
    
    const memberOptions = MEMBER_LIST.map(m => 
        `<option value="${m.id}">${m.name}</option>`
    ).join('');

    const modalHTML = `
        <div id="edit-modal-backdrop">
            <div id="edit-modal-content">
                <h3>タスク編集: ${task.id} - ${task.description}</h3>
                <form id="editTaskForm">
                    <input type="hidden" id="editTaskId" value="${task.id}">
                    <label>説明:</label><input id="editDescription" value="${task.description}" required>
                    <label>詳細:</label><textarea id="editProblemDetails" rows="3">${task.problemDetails || ''}</textarea>
                    
                    <label>優先度:</label>
                    <select id="editPriority" required>
                        <option value="高">高</option>
                        <option value="中">中</option>
                        <option value="低">低</option>
                    </select>
                    
                    <label>担当:</label>
                    <select id="editAssignedTo" required>${memberOptions}</select>
                    
                    <label>期限:</label><input type="date" id="editDeadline" value="${deadlineValue}">

                    <button type="submit" class="btn-primary">変更を保存</button>
                    <button type="button" id="closeModal" class="btn-secondary">キャンセル</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('editPriority').value = task.priority;
    document.getElementById('editAssignedTo').value = task.assignedTo; // 担当者IDをセット

    document.getElementById('closeModal').addEventListener('click', closeEditModal);
    document.getElementById('editTaskForm').addEventListener('submit', handleEditSave);
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal-backdrop');
    if (modal) modal.remove();
}

function handleEditSave(event) {
    event.preventDefault();
    
    const taskId = document.getElementById('editTaskId').value;
    const taskIndex = TASKS.findIndex(t => t.id === taskId);

    if (taskIndex !== -1) {
        TASKS[taskIndex].description = document.getElementById('editDescription').value;
        TASKS[taskIndex].problemDetails = document.getElementById('editProblemDetails').value;
        TASKS[taskIndex].priority = document.getElementById('editPriority').value;
        TASKS[taskIndex].assignedTo = document.getElementById('editAssignedTo').value;
        
        const newDeadline = document.getElementById('editDeadline').value;
        TASKS[taskIndex].deadline = newDeadline || '要検討'; 

        saveTasks();
        closeEditModal();
        renderTasks();
        renderCalendar(currentCalendarDate); 
    }
}


// ------------------------------------------------
// ドラッグ＆ドロップ (D&D) 機能
// ------------------------------------------------

function addDragListeners(card) {
    card.addEventListener('dragstart', function() {
        draggedCard = card;
        setTimeout(() => card.classList.add('dragging'), 0);
    });

    card.addEventListener('dragend', function() {
        if (draggedCard) draggedCard.classList.remove('dragging');
        draggedCard = null;
    });
}

function addColumnDragListeners(column) {
    column.addEventListener('dragover', function(e) {
        e.preventDefault();
        if (draggedCard) column.classList.add('drag-over');
    });

    column.addEventListener('dragleave', function() {
        column.classList.remove('drag-over');
    });

    column.addEventListener('drop', function() {
        column.classList.remove('drag-over');
        if (draggedCard) {
            const newStatus = column.getAttribute('data-status');
            const taskId = draggedCard.getAttribute('data-task-id');
            
            const taskIndex = TASKS.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                TASKS[taskIndex].currentStatus = newStatus;
                saveTasks();
                column.appendChild(draggedCard);
                renderTasks();
            }
        }
    });
}

// ------------------------------------------------
// カレンダービュー機能
// ------------------------------------------------

function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    document.getElementById('currentMonthYear').textContent = `${year}年 ${month + 1}月`;
    
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = ''; 

    const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
    daysOfWeek.forEach(day => {
        grid.innerHTML += `<div class="day-header">${day}</div>`;
    });

    for (let i = 0; i < firstDayOfMonth; i++) {
        grid.innerHTML += '<div></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let cellHTML = `<div><span class="day-number">${day}</span>`;
        
        const tasksDue = TASKS.filter(task => task.deadline === fullDate);

        tasksDue.forEach(task => {
            cellHTML += `<div class="task-item priority-${task.priority.toLowerCase()}" data-task-id="${task.id}">${task.id}: ${task.description}</div>`;
        });

        cellHTML += '</div>';
        grid.innerHTML += cellHTML;
    }

    document.querySelectorAll('#calendar-grid .task-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const taskId = e.target.getAttribute('data-task-id');
            const task = TASKS.find(t => t.id === taskId);
            if (task) openEditModal(task);
        });
    });
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar(currentCalendarDate);
}


// ------------------------------------------------
// 活動ログ機能
// ------------------------------------------------

function createLogEntry(log) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.setAttribute('data-log-id', log.id);

    const date = new Date(log.timestamp);
    const formattedDate = date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
                          date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

    entry.innerHTML = `
        <div class="log-header">
            <span>投稿者: <strong>${getMemberName(log.authorId)}</strong></span>
            <span>日時: ${formattedDate}</span>
        </div>
        <div class="log-content">${log.content}</div>
        <button class="delete-log-btn" data-log-id="${log.id}">削除</button>
    `;

    entry.querySelector('.delete-log-btn').addEventListener('click', handleDeleteLog);
    return entry;
}

function renderLogs() {
    const filterAuthorId = document.getElementById('logFilterMember').value;
    const logList = document.getElementById('log-list');
    logList.innerHTML = ''; 
    
    // フィルターされたログを最新順に表示
    const filteredLogs = ACTIVITY_LOGS.filter(log => 
        filterAuthorId === 'すべて' || log.authorId === filterAuthorId
    );

    [...filteredLogs].reverse().forEach(log => {
        logList.appendChild(createLogEntry(log));
    });

    if (filteredLogs.length === 0) {
        logList.innerHTML = '<p style="text-align: center; color: #6b7280; margin-top: 50px;">該当する活動ログがありません。</p>';
    }
}

function handleAddLog(event) {
    event.preventDefault();
    
    const content = document.getElementById('logContent').value.trim();
    const authorId = document.getElementById('logAuthor').value; // IDを取得

    if (!content || !authorId) {
        alert('内容と投稿者名は必須です。');
        return;
    }

    const newLog = {
        id: crypto.randomUUID(), 
        content: content,
        authorId: authorId,
        timestamp: new Date().toISOString()
    };

    ACTIVITY_LOGS.push(newLog);
    saveLogs();
    renderLogs();
    
    document.getElementById('addLogForm').reset();
}

function handleDeleteLog(event) {
    if (!confirm('本当にこのログを削除しますか？')) return;
    
    const logId = event.target.getAttribute('data-log-id');
    ACTIVITY_LOGS = ACTIVITY_LOGS.filter(log => log.id !== logId);
    
    saveLogs();
    renderLogs();
}

// ------------------------------------------------
// URL同期機能
// ------------------------------------------------

function updateURL(viewName) {
    history.pushState({ view: viewName }, '', `#${viewName}`);
}

function switchToView(viewName) {
    const boardView = document.getElementById('board-view');
    const calendarView = document.getElementById('calendar-view');
    const logView = document.getElementById('log-view');
    const tabs = document.querySelectorAll('#view-tabs button');

    let targetView = 'board';
    if (viewName === 'calendar') targetView = 'calendar';
    if (viewName === 'log') targetView = 'log';

    tabs.forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('data-view') === targetView) {
            b.classList.add('active');
        }
    });

    boardView.style.display = 'none';
    calendarView.style.display = 'none';
    logView.style.display = 'none';

    if (targetView === 'board') {
        boardView.style.display = 'block';
        renderTasks();
    } else if (targetView === 'calendar') {
        calendarView.style.display = 'block';
        renderCalendar(currentCalendarDate);
    } else if (targetView === 'log') {
        logView.style.display = 'block';
        renderLogs();
    }
    
    updateURL(targetView);
}

window.addEventListener('popstate', function(event) {
    const hash = window.location.hash.slice(1);
    switchToView(hash || 'board');
});


// ------------------------------------------------
// 初期化とイベント設定
// ------------------------------------------------

function populateMemberSelects() {
    const selects = [
        document.getElementById('taskAssignedTo'),
        document.getElementById('filterMember'),
        document.getElementById('logAuthor'),
        document.getElementById('logFilterMember'),
    ];

    // 担当者入力フォームとフィルターにメンバー名を挿入
    MEMBER_LIST.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        
        selects.forEach(select => {
            // フィルター用には「すべて」オプションの後にメンバーを追加
            if (select.id === 'filterMember' || select.id === 'logFilterMember') {
                const filterOption = option.cloneNode(true);
                select.appendChild(filterOption);
            } else {
                // フォーム用にはデフォルトオプションの後にメンバーを追加
                const formOption = option.cloneNode(true);
                select.appendChild(formOption);
            }
        });
    });
}


function setupViewSwitching() {
    const tabs = document.querySelectorAll('#view-tabs button');
    
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            switchToView(view); 
        });
    });
    
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));

    // ページロード時にURLハッシュに基づいて初期ビューを設定
    const initialView = window.location.hash.slice(1) || 'board';
    switchToView(initialView);
}


document.addEventListener('DOMContentLoaded', () => {
    // 1. メンバードロップダウンの準備
    populateMemberSelects();
    
    // 2. データの読み込み
    loadTasks();
    
    // 3. イベントリスナー設定
    document.getElementById('addTaskForm').addEventListener('submit', handleAddTask);
    document.getElementById('addLogForm').addEventListener('submit', handleAddLog);

    // フィルターイベント
    document.getElementById('filterPriority').addEventListener('change', renderTasks);
    document.getElementById('filterMember').addEventListener('change', renderTasks);
    document.getElementById('logFilterMember').addEventListener('change', renderLogs);
    
    // D&Dイベント
    document.querySelectorAll('.task-column').forEach(column => {
        addColumnDragListeners(column);
    });
    
    // 4. 初期描画
    setupViewSwitching();
    renderCalendar(currentCalendarDate);
});
