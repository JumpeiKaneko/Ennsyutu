// script.js (修正指示に基づく再構成された全文)

// 🔥 最終チェック：Firebase設定
// !!! この部分をあなたのFirebaseプロジェクトの実際のキーとIDに置き換えてください !!!
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", 
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID", // <- 特にここ
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebaseの初期化とサービスの取得
let db;
try {
    const app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (e) {
    console.error("Firebaseの初期化に失敗しました。apiKeyなどが正しいか確認してください。", e);
    alert("データ同期に失敗しました。開発者ツール(F12)のコンソールを確認してください。");
}


// =======================================================
// --- 核心となるデータ同期とロジック（あなたの既存コード） ---
// =======================================================

// メンバーリストの静的データ (例として、あなたの元のリストを使用してください)
const MEMBERS = [
    { id: 'member1', name: 'メンバーA' },
    { id: 'member2', name: 'メンバーB' },
    // ... 他のメンバー ...
];

// あなたの元の populateMemberSelects 関数
function populateMemberSelects() {
    // メンバーリストをドロップダウンに表示するロジックをここに記述
    // (例: 'filterMember', 'logFilterMember' などの select 要素に option を追加)
    console.log("populateMemberSelects: メンバーのドロップダウンを準備しました。");
}

// あなたの元の setupRealtimeListeners 関数
function setupRealtimeListeners() {
    // Firestoreのデータ変更をリアルタイムで監視し、renderTasks/renderLogsを呼び出すロジックをここに記述
    console.log("setupRealtimeListeners: Firebaseのリアルタイムリスナーを設定しました。");
}

// あなたの元の handleAddTask 関数
function handleAddTask(event) {
    event.preventDefault();
    // タスクを追加するロジックをここに記述
    console.log("handleAddTask: タスク追加ロジックを実行しました。");
}

// あなたの元の handleAddLog 関数
function handleAddLog(event) {
    event.preventDefault();
    // 活動ログを追加するロジックをここに記述
    console.log("handleAddLog: ログ追加ロジックを実行しました。");
}

// あなたの元の renderTasks 関数
function renderTasks() {
    // タスクボード（board-view）にタスクを描画するロジックをここに記述
    console.log("renderTasks: タスクを描画しました。");
}

// あなたの元の renderLogs 関数
function renderLogs() {
    // 活動ログビュー（log-view）にログを描画するロジックをここに記述
    console.log("renderLogs: 活動ログを描画しました。");
}

// あなたの元の renderCalendar 関数
let currentCalendarDate = new Date(); // カレンダーの現在の日付を保持する変数
function renderCalendar(date) {
    // スケジュールビュー（calendar-view）にカレンダーを描画するロジックをここに記述
    console.log("renderCalendar: カレンダーを描画しました。", date);
}

// あなたの元の addColumnDragListeners 関数
function addColumnDragListeners(column) {
    // D&Dイベントリスナーを設定するロジックをここに記述
    console.log("addColumnDragListeners: D&Dリスナーを設定しました。");
}

// あなたの元の updateURL 関数
function updateURL(viewName) {
    // URLのハッシュを変更するロジックをここに記述
    console.log("updateURL: URLを更新しました。", viewName);
}


// =======================================================
// --- タブ切り替えロジック（修正点） ---
// =======================================================

/**
 * ビューを切り替え、アクティブなタブの見た目を変更し、URLを更新します。
 * @param {string} viewName - 切り替えたいビューの名前 ('board', 'calendar', 'log')
 */
function switchToView(viewName) {
    const boardView = document.getElementById('board-view');
    const calendarView = document.getElementById('calendar-view');
    const logView = document.getElementById('log-view'); // ログビュー要素の取得
    
    const tabs = document.querySelectorAll('.nav-link');
    const targetView = viewName.toLowerCase();

    // アクティブタブの見た目切り替え
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.view === targetView) {
            tab.classList.add('active');
        }
    });

    // 全てのビューを非表示にする
    if (boardView) boardView.style.display = 'none';
    if (calendarView) calendarView.style.display = 'none';
    if (logView) logView.style.display = 'none'; // これが重要

    // ターゲットビューを表示し、描画関数を呼び出す
    if (targetView === 'board' && boardView) {
        boardView.style.display = 'block';
        renderTasks();
    } else if (targetView === 'calendar' && calendarView) {
        calendarView.style.display = 'block';
        renderCalendar(currentCalendarDate);
    } else if (targetView === 'log' && logView) {
        logView.style.display = 'block'; // ログビューを表示
        renderLogs();
    }
    
    updateURL(targetView);
}

/**
 * URLのハッシュに基づいて初期ビューを設定し、タブのイベントリスナーを設定します。
 */
function setupViewSwitching() {
    // タブボタンにイベントリスナーを設定
    document.querySelectorAll('.nav-link[data-view]').forEach(button => {
        button.addEventListener('click', (e) => {
            const viewName = e.currentTarget.dataset.view;
            switchToView(viewName);
        });
    });

    // URLハッシュに基づいて初期ビューを決定
    const hash = window.location.hash.replace('#', '');
    let initialView = 'board'; // デフォルトビュー

    if (hash === 'calendar' || hash === 'log') {
        initialView = hash;
    }
    
    switchToView(initialView);
}


// =======================================================
// --- 初期化（DOMContentLoaded内の修正点） ---
// =======================================================

// script.js (DOMContentLoaded内の初期化部分)
document.addEventListener('DOMContentLoaded', () => {
    // 1. メンバードロップダウンの準備
    populateMemberSelects();
    
    // 2. リアルタイムリスナーのセットアップ（データ同期開始）
    // NOTE: Firebaseの初期化とリスナーは通常、ここで実行される
    try {
        if (db) { // Firebaseが初期化されているか確認
            setupRealtimeListeners();
        } else {
            // dbがnullの場合（初期化失敗時）はエラーをコンソールに出力済み
            alert("データ同期に失敗しました。開発者ツール(F12)のコンソールを確認してください。");
        }
    } catch (e) {
        console.error("setupRealtimeListenersの実行中にエラーが発生しました。", e);
    }
    
    // 3. イベントリスナー設定
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', handleAddTask);
    }

    const addLogForm = document.getElementById('addLogForm');
    if (addLogForm) {
        addLogForm.addEventListener('submit', handleAddLog);
    }

    // フィルターイベント
    const filterPriority = document.getElementById('filterPriority');
    if (filterPriority) {
        filterPriority.addEventListener('change', renderTasks);
    }
    const filterMember = document.getElementById('filterMember');
    if (filterMember) {
        filterMember.addEventListener('change', renderTasks);
    }
    const logFilterMember = document.getElementById('logFilterMember');
    if (logFilterMember) {
        logFilterMember.addEventListener('change', renderLogs);
    }
    
    // D&Dイベント
    document.querySelectorAll('.task-column').forEach(column => {
        addColumnDragListeners(column);
    });
    
    // 4. 初期描画とURL同期を開始 (タブ切り替えロジック)
    setupViewSwitching(); 
});

// ここから下に、上記の関数定義に含まれていない、
// あなたのアプリ固有のその他のヘルパー関数やロジックを全て追加してください。
