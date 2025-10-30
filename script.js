// script.js

// ------------------------------------------------
// 🔥 Firebase 設定（ここをあなたの情報に書き換えてください）
// ------------------------------------------------
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", 
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID", // YOUR_PROJECT_ID を書き換える
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebaseサービスの初期化とエラーハンドリング
let db = null;
const TASKS_COLLECTION = 'tasks';
const LOGS_COLLECTION = 'logs';

try {
    const app = firebase.initializeApp(firebaseConfig);
    db = app.firestore();
} catch (e) {
    console.error("Firebaseの初期化に失敗しました。apiKeyなどが正しいか確認してください。:\n", e);
    // 初期化失敗時はdbがnullのままになる
}

// ------------------------------------------------
// メンバーリストの定義
// ------------------------------------------------
const MEMBER_LIST = [
    { id: 'J', name: 'じゅんぺい' },
    { id: 'M', name: 'まお' },
    { id: 'S', name: 'さくひろ' },
    { id: 'N', name: 'ののか' },
    { id: 'E', name: 'えま' },
    { id: 'K', name: 'かなえ' },
    { id: 'A', name: 'あおい' },
    { id: 'T', name: 'みと' },
];

let currentCalendarDate = new Date(); 
let TASKS_DATA = []; 
let ACTIVITY_LOGS_DATA = []; 


// ------------------------------------------------
// ユーティリティ関数
// ------------------------------------------------

function getMemberName(id) {
    const member = MEMBER_LIST.find(m => m.id === id);
    return member ? member.name : id;
}

function getMemberNames(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return '未定';
    
    return ids.map(getMemberName).join(', ');
}

// ------------------------------------------------
// リアルタイムリスナー (Firestore)
// ------------------------------------------------

function setupRealtimeListeners() {
    if (!db) {
        console.warn("Firestoreが初期化されていないため、データ同期をスキップします。");
        return;
    }

    db.collection(TASKS_COLLECTION).onSnapshot(snapshot => {
        TASKS_DATA = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // 現在表示中のビューに合わせた再描画
        const currentView = window.location.hash.slice(1) || 'board';
        if (currentView === 'board') renderTasks();
        if (currentView === 'calendar') renderCalendar(currentCalendarDate);
    }, error => {
        console.error("タスクのリアルタイム同期エラー:", error);
    });

    db.collection(LOGS_COLLECTION).orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        ACTIVITY_LOGS_DATA = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // 現在表示中のビューがログの場合のみ再描画
        const currentView = window.location.hash.slice(1) || 'board';
        if (currentView === 'log') renderLogs();
    }, error => {
        console.error("ログのリアルタイム同期エラー:", error);
    });
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

    const assignedNames = getMemberNames(task.assignedTo); // 複数名表示

    card.innerHTML = `
        <div class="card-header">
            <span class="task-id">${task.id.slice(0, 5)}...</span>
            <span class="task-priority">${task.priority}</span>
        </div>
        <h3 class="task-description">${task.description}</h3>
        <div class="card-meta">
            <p>担当: <strong>${assignedNames}</strong></p>
            <p>期限: <span>${task.deadline && task.deadline.length === 10 ? task.deadline.replace(/-/g, '/') : (task.deadline || '未定')}</span></p>
        </div>
    `;
    
    card.addEventListener('click', () => openEditModal(task));
    addDragListeners(card);
    return card;
}

function renderTasks() {
    const filterPriorityElement = document.getElementById('filterPriority');
    const filterMemberElement = document.getElementById('filterMember');
    
    const filterPriority = filterPriorityElement ? filterPriorityElement.value : 'すべて';
    const filterMemberId = filterMemberElement ? filterMemberElement.value : 'すべて';

    const columns = {
        '要対応': document.getElementById('column-todo'),
        '未着手': document.getElementById('column-new'),
        '進行中': document.getElementById('column-inprogress'),
        '完了': document.getElementById('column-done')
    };

    // カラム内の既存コンテンツをクリアし、ヘッダーを再設定
    Object.values(columns).forEach(column => {
        if (column) {
            const title = column.querySelector('h2') ? column.querySelector('h2').textContent : column.getAttribute('data-status');
            column.innerHTML = `<h2>${title}</h2>`;
        }
    });

    TASKS_DATA.forEach(task => {
        const matchesPriority = filterPriority === 'すべて' || task.priority === filterPriority;
        const matchesMember = filterMemberId === 'すべて' || (Array.isArray(task.assignedTo) && task.assignedTo.includes(filterMemberId));

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
// タスク追加（Firestore書き込み）
// ------------------------------------------------

function getSelectedOptions(selectElement) {
    if (!selectElement) return [];
    return Array.from(selectElement.options)
                .filter(option => option.selected)
                .map(option => option.value);
}

function handleAddTask(event) {
    event.preventDefault();

    if (!db) {
        alert("Firestoreが初期化されていないため、タスクを追加できません。");
        return;
    }

    const desc = document.getElementById('taskDesc').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const assignedToIds = getSelectedOptions(document.getElementById('taskAssignedTo')); 
    
    if (!desc || !priority || assignedToIds.length === 0) {
        alert('タスクの内容、優先度、担当者は必須です。');
        return;
    }

    db.collection(TASKS_COLLECTION).add({
        description: desc,
        currentStatus: '未着手',
        priority: priority,
        assignedTo: assignedToIds, 
        deadline: '要検討',
        problemDetails: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        document.getElementById('addTaskForm').reset();
    })
    .catch(error => {
        console.error("タスク追加エラー:", error);
        alert("タスクの追加に失敗しました。コンソールを確認してください。");
    });
}

// ------------------------------------------------
// 編集モーダル機能 (Firestore更新)
// ------------------------------------------------

function openEditModal(task) {
    closeEditModal(); 
    
    const deadlineValue = (task.deadline && task.deadline.match(/^\d{4}-\d{2}-\d{2}$/)) ? task.deadline : '';
    
    const memberOptions = MEMBER_LIST.map(m => {
        const isSelected = Array.isArray(task.assignedTo) && task.assignedTo.includes(m.id) ? 'selected' : '';
        return `<option value="${m.id}" ${isSelected}>${m.name}</option>`;
    }).join('');

    const modalHTML = `
        <div id="edit-modal-backdrop">
            <div id="edit-modal-content">
                <h3>タスク編集: ${task.id.slice(0, 5)}... - ${task.description}</h3>
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
                    
                    <label>担当 (複数選択可):</label>
                    <select id="editAssignedTo" multiple required size="5">${memberOptions}</select>
                    
                    <label>期限:</label><input type="date" id="editDeadline" value="${deadlineValue}">

                    <button type="submit" class="btn-primary">変更を保存</button>
                    <button type="button" id="closeModal" class="btn-secondary">キャンセル</button>
                    <button type="button" id="deleteTask" class="btn-secondary" style="background-color: #ef4444; color: white;">タスク削除</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('editPriority').value = task.priority;

    document.getElementById('closeModal').addEventListener('click', closeEditModal);
    document.getElementById('editTaskForm').addEventListener('submit', handleEditSave);
    document.getElementById('deleteTask').addEventListener('click', handleDeleteTask);
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal-backdrop');
    if (modal) modal.remove();
}

function handleEditSave(event) {
    event.preventDefault();
    
    if (!db) {
        alert("Firestoreが初期化されていないため、更新できません。");
        return;
    }
    
    const taskId = document.getElementById('editTaskId').value;
    const newAssignedToIds = getSelectedOptions(document.getElementById('editAssignedTo')); 
    
    if (newAssignedToIds.length === 0) {
        alert('担当者は最低1人選択してください。');
        return;
    }
    
    db.collection(TASKS_COLLECTION).doc(taskId).update({
        description: document.getElementById('editDescription').value,
        problemDetails: document.getElementById('editProblemDetails').value,
        priority: document.getElementById('editPriority').value,
        assignedTo: newAssignedToIds, 
        deadline: document.getElementById('editDeadline').value || '要検討', 
    })
    .then(() => {
        closeEditModal();
    })
    .catch(error => {
        console.error("タスク更新エラー:", error);
        alert("タスクの更新に失敗しました。");
    });
}

function handleDeleteTask() {
    if (!db) {
        alert("Firestoreが初期化されていないため、削除できません。");
        return;
    }

    if (!confirm('本当にこのタスクを削除しますか？')) return;
    
    const taskId = document.getElementById('editTaskId').value;
    
    db.collection(TASKS_COLLECTION).doc(taskId).delete()
    .catch(error => {
        console.error("タスク削除エラー:", error);
        alert("タスクの削除に失敗しました。");
    });
}


// ------------------------------------------------
// ドラッグ＆ドロップ (D&D) 機能 (Firestore更新)
// ------------------------------------------------

let draggedCard = null; // ドラッグ中のカードを保持するグローバル変数（または外部スコープ）

function addDragListeners(card) {
    card.addEventListener('dragstart', function() {
        // グローバル変数を設定し、クラスを追加
        draggedCard = card;
        setTimeout(() => card.classList.add('dragging'), 0);
    });

    card.addEventListener('dragend', function() {
        // グローバル変数をリセットし、クラスを削除
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
        
        if (!db) {
            console.warn("Firestoreが初期化されていないため、ステータスを更新できません。");
            return;
        }

        if (draggedCard) {
            const newStatus = column.getAttribute('data-status');
            const taskId = draggedCard.getAttribute('data-task-id');
            
            db.collection(TASKS_COLLECTION).doc(taskId).update({
                currentStatus: newStatus
            })
            .then(() => {
                // onSnapshotが画面を更新
            })
            .catch(error => {
                console.error("ステータス更新エラー:", error);
            });
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
    
    const currentMonthYearElement = document.getElementById('currentMonthYear');
    if (currentMonthYearElement) {
        currentMonthYearElement.textContent = `${year}年 ${month + 1}月`;
    }
    
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    
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
        
        const tasksDue = TASKS_DATA.filter(task => task.deadline === fullDate);

        tasksDue.forEach(task => {
            cellHTML += `<div class="task-item priority-${task.priority.toLowerCase()}" data-task-id="${task.id}">${task.id.slice(0, 5)}: ${task.description}</div>`;
        });

        cellHTML += '</div>';
        grid.innerHTML += cellHTML;
    }

    document.querySelectorAll('#calendar-grid .task-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const taskId = e.target.getAttribute('data-task-id');
            const task = TASKS_DATA.find(t => t.id === taskId);
            if (task) openEditModal(task);
        });
    });
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar(currentCalendarDate);
}


// ------------------------------------------------
// 活動ログ機能 (Firestore連携)
// ------------------------------------------------

function createLogEntry(log) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.setAttribute('data-log-id', log.id);

    const date = log.timestamp ? log.timestamp.toDate() : new Date();
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
    const filterElement = document.getElementById('logFilterMember');
    const filterAuthorId = filterElement ? filterElement.value : 'すべて';
    const logList = document.getElementById('log-list');
    
    if (!logList) return;

    logList.innerHTML = ''; 
    
    const filteredLogs = ACTIVITY_LOGS_DATA.filter(log => 
        filterAuthorId === 'すべて' || log.authorId === filterAuthorId
    );

    filteredLogs.forEach(log => {
        logList.appendChild(createLogEntry(log));
    });

    if (filteredLogs.length === 0) {
        logList.innerHTML = '<p style="text-align: center; color: #6b7280; margin-top: 50px;">該当する活動ログがありません。</p>';
    }
}

function handleAddLog(event) {
    event.preventDefault();
    
    if (!db) {
        alert("Firestoreが初期化されていないため、ログを投稿できません。");
        return;
    }
    
    const content = document.getElementById('logContent').value.trim();
    const authorId = document.getElementById('logAuthor').value; 

    if (!content || !authorId) {
        alert('内容と投稿者名は必須です。');
        return;
    }

    db.collection(LOGS_COLLECTION).add({
        content: content,
        authorId: authorId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        document.getElementById('addLogForm').reset();
    })
    .catch(error => {
        console.error("ログ追加エラー:", error);
        alert("ログの投稿に失敗しました。");
    });
}

function handleDeleteLog(event) {
    if (!db) {
        alert("Firestoreが初期化されていないため、削除できません。");
        return;
    }
    
    if (!confirm('本当にこのログを削除しますか？')) return;
    
    const logId = event.target.getAttribute('data-log-id');
    
    db.collection(LOGS_COLLECTION).doc(logId).delete()
    .catch(error => {
        console.error("ログ削除エラー:", error);
        alert("ログの削除に失敗しました。");
    });
}

// ------------------------------------------------
// URL同期機能
// ------------------------------------------------

function updateURL(viewName) {
    history.pushState({ view: viewName }, '', `#${viewName}`);
}

/**
 * メインビューを切り替える関数 (ボード、カレンダー、ログ)
 * @param {string} viewName - 切り替えたいビューの名前 ('board', 'calendar', 'log')
 */
function switchToView(viewName) {
    const boardView = document.getElementById('board-view');
    const calendarView = document.getElementById('calendar-view');
    const logView = document.getElementById('log-view');
    const tabs = document.querySelectorAll('#view-tabs button'); // タブボタンのセレクタ

    let targetView = 'board';
    if (viewName === 'calendar') targetView = 'calendar';
    if (viewName === 'log') targetView = 'log';

    // 1. アクティブなタブの見た目切り替え
    tabs.forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('data-view') === targetView) {
            b.classList.add('active');
        }
    });

    // 2. 全てのビューを非表示に
    if (boardView) boardView.style.display = 'none';
    if (calendarView) calendarView.style.display = 'none';
    if (logView) logView.style.display = 'none';

    // 3. ターゲットビューを表示し、描画関数を呼び出す
    if (targetView === 'board' && boardView) {
        boardView.style.display = 'block';
        renderTasks();
    } else if (targetView === 'calendar' && calendarView) {
        calendarView.style.display = 'block';
        renderCalendar(currentCalendarDate);
    } else if (targetView === 'log' && logView) {
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
    ].filter(el => el !== null); // DOM要素が見つからなかった場合は除外

    MEMBER_LIST.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        
        selects.forEach(select => {
            // フィルター用 (すべてオプションを追加)
            if ((select.id === 'filterMember' || select.id === 'logFilterMember') && select.options.length === 0) {
                const allOption = document.createElement('option');
                allOption.value = 'すべて';
                allOption.textContent = 'すべて';
                select.appendChild(allOption);
            }

            const memberOption = option.cloneNode(true);
            select.appendChild(memberOption);
        });
    });
}


function setupViewSwitching() {
    const tabs = document.querySelectorAll('#view-tabs button'); // HTMLのタブ要素のセレクタを確認してください
    
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            switchToView(view); 
        });
    });
    
    const prevMonthBtn = document.getElementById('prevMonth');
    if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    
    const nextMonthBtn = document.getElementById('nextMonth');
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => changeMonth(1));

    const initialView = window.location.hash.slice(1) || 'board';
    switchToView(initialView);
}


document.addEventListener('DOMContentLoaded', () => {
    // 1. メンバードロップダウンの準備
    populateMemberSelects();
    
    // 2. リアルタイムリスナーのセットアップ（データ同期開始）
    setupRealtimeListeners();
    
    // 3. イベントリスナー設定
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) addTaskForm.addEventListener('submit', handleAddTask);
    
    const addLogForm = document.getElementById('addLogForm');
    if (addLogForm) addLogForm.addEventListener('submit', handleAddLog);

    // フィルターイベント
    const filterPriority = document.getElementById('filterPriority');
    if (filterPriority) filterPriority.addEventListener('change', renderTasks);
    
    const filterMember = document.getElementById('filterMember');
    if (filterMember) filterMember.addEventListener('change', renderTasks);
    
    const logFilterMember = document.getElementById('logFilterMember');
    if (logFilterMember) logFilterMember.addEventListener('change', renderLogs);
    
    // D&Dイベント
    document.querySelectorAll('.task-column').forEach(column => {
        addColumnDragListeners(column);
    });
    
    // 4. 初期描画とタブ設定
    setupViewSwitching();
});
