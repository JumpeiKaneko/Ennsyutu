<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2025放送ステージメンバー共有用</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js"></script>
</head>
<body>

    <div class="app-container">
        <header>
            <h1 class="app-title">📋 2025放送ステージメンバー共有用</h1>
            <p class="subtitle">リアルタイム共同作業ボード (Firebase同期)</p>
        </header>

        <div id="view-tabs" class="tabs">
            <button id="show-board" data-view="board" class="active">タスクボード</button>
            <button id="show-calendar" data-view="calendar">スケジュール</button>
            <button id="show-log" data-view="log">活動ログ</button> 
        </div>

        <main>
            <div id="board-view" class="view-content">
                <div id="board-controls">
                    <form id="addTaskForm" class="add-form" style="align-items: flex-start;">
                        <input type="text" id="taskDesc" placeholder="新規タスクの内容を入力" required style="flex-grow: 2;">
                        <select id="taskPriority" required>
                            <option value="" disabled selected>優先度</option>
                            <option value="高">高</option>
                            <option value="中">中</option>
                            <option value="低">低</option>
                        </select>
                        <select id="taskAssignedTo" multiple required size="5" style="width: 120px;">
                            </select>
                        <button type="submit" class="btn-primary" style="align-self: center;">タスク追加</button>
                    </form>
                    
                    <div id="filter-controls">
                        <label for="filterPriority">優先度フィルター:</label>
                        <select id="filterPriority">
                            <option value="すべて">すべて</option>
                            <option value="高">高</option>
                            <option value="中">中</option>
                            <option value="低">低</option>
                        </select>

                        <label for="filterMember">担当者フィルター:</label>
                        <select id="filterMember">
                            <option value="すべて">すべて</option>
                        </select>
                    </div>
                </div>

                <div id="kanban-board">
                    <section id="column-todo" class="task-column" data-status="要対応">
                        <h2>要対応</h2>
                    </section>
                    <section id="column-new" class="task-column" data-status="未着手">
                        <h2>未着手 / 要確認</h2>
                    </section>
                    <section id="column-inprogress" class="task-column" data-status="進行中">
                        <h2>進行中</h2>
                    </section>
                    <section id="column-done" class="task-column" data-status="完了">
                        <h2>完了</h2>
                    </section>
                </div>
            </div>
            
            <div id="calendar-view" class="view-content" style="display: none;">
                <div id="calendar-controls">
                    <button id="prevMonth" class="btn-secondary">‹ 前の月</button>
                    <h2 id="currentMonthYear"></h2>
                    <button id="nextMonth" class="btn-secondary">次の月 ›</button>
                </div>
                <div id="calendar-grid" class="calendar-grid">
                    </div>
            </div>

            <div id="log-view" class="view-content" style="display: none;">
                <h2 class="section-title">今日の活動ログ</h2>
                <div id="log-controls" class="add-form" style="display: flex; justify-content: flex-end;">
                    <label for="logFilterMember" style="margin-right: 10px;">投稿者フィルター:</label>
                    <select id="logFilterMember">
                        <option value="すべて">すべて</option>
                    </select>
                </div>

                <form id="addLogForm" class="add-form log-form">
                    <textarea id="logContent" placeholder="今日やったこと、気付いたこと、共有事項などを入力" rows="3" required></textarea>
                    <select id="logAuthor" required>
                        <option value="" disabled selected>投稿者名</option>
                    </select>
                    <button type="submit" class="btn-primary">ログを投稿</button>
                </form>

                <div id="log-list" class="log-list">
                    </div>
            </div>
            </main>
    </div>

    <script src="script.js"></script>
</body>
</html>
