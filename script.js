/*************************************************
 *  変数・定数
 *************************************************/
// 現在の問題番号（0 ～ questions.length-1）
let currentQuestionIndex = 0;

// 現在表示中のヒントのインデックス
let currentHintIndex = 0;

// タイマー用
let timeLeft = GAME_CONFIG.TIME_LIMIT; // 15分（900秒）を外部設定から取得
let timerId = null;

// オーディオオブジェクトを追加
const correctSound = new Audio("assets/sounds/correct.mp3");
const incorrectSound = new Audio("assets/sounds/incorrect.mp3");
const timeupSound = new Audio("assets/sounds/timeup.mp3");  // タイムオーバー用
const warningSound = new Audio("assets/sounds/warning.mp3");  // 残り1分警告用

/*************************************************
 *  初期化処理
 *************************************************/
window.addEventListener("DOMContentLoaded", () => {
  // 保存された状態があれば復元
  if (!loadGameState()) {
    // 保存された状態がなければスタート画面を表示
    showStartScreen();
  }

  // スタートボタン押下時の処理
  document.getElementById("start-button").addEventListener("click", () => {
    // ゲーム画面を表示
    showGameScreen();
    // タイマー開始
    startTimer();
    // 最初の問題をセット
    currentQuestionIndex = 0;
    loadQuestion(currentQuestionIndex);
    // 状態を保存
    saveGameState();
  });

  // 答え送信ボタン押下時の処理
  document.getElementById("submit-answer").addEventListener("click", () => {
    checkAnswer();
  });
  
  // リセットボタン押下時の処理
  document.getElementById("reset-button").addEventListener("click", () => {
    resetGame();
  });

  // ヒントリンク押下時の処理
  document.getElementById("hint-link").addEventListener("click", (e) => {
    e.preventDefault(); // デフォルトのリンク動作を防止
    currentHintIndex = 0; // ヒントインデックスをリセット
    showHintModal();
  });
  
  // 次のヒントボタン押下時の処理
  document.getElementById("next-hint").addEventListener("click", () => {
    showNextHint();
  });
  
  // モーダルの閉じるボタン
  document.getElementById("close-hint").addEventListener("click", () => {
    hideHintModal();
  });
  
  // ×ボタンでも閉じられるように
  document.querySelector(".close-button").addEventListener("click", () => {
    hideHintModal();
  });
  
  // モーダル外クリックでも閉じられるように
  window.addEventListener("click", (e) => {
    if (e.target === document.getElementById("hint-modal")) {
      hideHintModal();
    }
  });
});

/*************************************************
 *  画面切り替え関連
 *************************************************/
// スタート画面表示
function showStartScreen() {
  document.getElementById("start-screen").style.display = "block";
  document.getElementById("game-screen").style.display = "none";
  document.getElementById("result-screen").style.display = "none";
}

// ゲーム画面表示
function showGameScreen() {
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
  document.getElementById("result-screen").style.display = "none";
}

// リザルト画面表示
// isClear が true ならクリア、false ならゲームオーバー
function showResultScreen(isClear) {
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "none";
  document.getElementById("result-screen").style.display = "block";

  const resultMessage = document.getElementById("result-message");
  const resultImage = document.getElementById("result-image");

  if (isClear) {
    resultMessage.textContent = "クリアおめでとう！";
    // クリア用の画像があれば設定（なければ空にするかそのまま）
    resultImage.src = "assets/images/clear.png"; 
  } else {
    resultMessage.textContent = "ゲームオーバー…";
    // ゲームオーバー用の画像があれば設定
    resultImage.src = "assets/images/gameover.png";
  }
}

/*************************************************
 *  タイマー制御
 *************************************************/
function startTimer() {
  // 初期化
  if (timeLeft === undefined || timeLeft === null) {
    timeLeft = GAME_CONFIG.TIME_LIMIT; // 外部設定から初期時間を取得
  }
  document.getElementById("timer").textContent = formatTime(timeLeft);
  
  // 警告クラスを初期状態で削除
  document.querySelector("h2").classList.remove("warning");

  // 既にタイマーが動いていた場合はクリア
  if (timerId) {
    clearInterval(timerId);
  }

  // 1秒ごとに残り時間を更新
  timerId = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = formatTime(timeLeft);
    // 状態を保存
    saveGameState();

    // 残り60秒（1分）になったら警告を表示
    if (timeLeft === 60) {
      // 警告音を再生
      warningSound.play();
      // タイマーのh2要素に警告クラスを追加
      document.querySelector("h2").classList.add("warning");
    }

    if (timeLeft <= 0) {
      clearInterval(timerId);
      // タイムアップ効果音を再生
      timeupSound.play();
      // タイムアップ → ゲームオーバー画面へ
      showResultScreen(false);
    }
  }, 1000);
}

// 秒数を mm:ss 表示に整形
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/*************************************************
 *  問題読み込み・答え判定
 *************************************************/
function loadQuestion(index) {
  const q = GAME_QUESTIONS[index];
  // ステージ番号
  document.getElementById("stage-number").textContent = `ステージ ${q.stage}`;
  // 問題文
  document.getElementById("question-text").textContent = q.text;

  // 画像表示
  const img = document.getElementById("question-image");
  if (q.image) {
    img.src = q.image;
    img.style.display = "block";
  } else {
    img.src = "";
    img.style.display = "none";
  }

  // 入力欄をクリア
  document.getElementById("user-answer").value = "";

  // ヒントリンクの表示制御（ヒントがある場合のみ表示）
  const hintLink = document.getElementById("hint-link");
  if (q.hints && q.hints.length > 0) {
    hintLink.style.display = "inline";
  } else {
    hintLink.style.display = "none";
  }
}

function checkAnswer() {
  const userAnswer = document.getElementById("user-answer").value.trim();
  const correctAnswers = GAME_QUESTIONS[currentQuestionIndex].answers;

  const isCorrect = correctAnswers.includes(userAnswer);

  if (isCorrect) {
    // 正解音を再生
    correctSound.play();
    
    // 正解 → 次の問題へ
    currentQuestionIndex++;
    // 全問正解したか確認
    if (currentQuestionIndex >= GAME_QUESTIONS.length) {
      // 全問正解 → ゲームクリア
      clearInterval(timerId); // タイマー停止
      showResultScreen(true);
      saveGameState(); // 状態を保存
    } else {
      // 次の問題を読み込む
      loadQuestion(currentQuestionIndex);
      saveGameState(); // 状態を保存
    }
  } else {
    // 不正解音を再生
    incorrectSound.play();
    
    // ペナルティ処理
    const penalty = GAME_CONFIG.PENALTY_TIME;
    timeLeft = Math.max(0, timeLeft - penalty);
    document.getElementById("timer").textContent = formatTime(timeLeft);
    
    // 残り時間が60秒以下になったら警告表示
    if (timeLeft <= 60 && timeLeft > 0) {
      // 警告音を再生（1回だけ）
      warningSound.play();
      // タイマーのh2要素に警告クラスを追加
      document.querySelector("h2").classList.add("warning");
    }
    
    if (timeLeft <= 0) {
      clearInterval(timerId);
      // タイムアップ効果音を再生
      timeupSound.play();
      showResultScreen(false);
      saveGameState(); // 状態を保存
      return;
    }
    
    alert(`不正解です。ペナルティとして${penalty}秒減ります。`);
    saveGameState(); // 状態を保存
  }
}

/*************************************************
 *  状態保存と復元
 *************************************************/
// 状態を保存する関数
function saveGameState() {
  localStorage.setItem('gameState', JSON.stringify({
    currentQuestionIndex,
    timeLeft,
    isGameStarted: document.getElementById("game-screen").style.display === "block",
    isGameOver: document.getElementById("result-screen").style.display === "block",
    isClear: document.getElementById("result-message").textContent === "クリアおめでとう！"
  }));
}

// 状態を読み込む関数
function loadGameState() {
  const savedState = localStorage.getItem('gameState');
  if (!savedState) return false;
  
  const state = JSON.parse(savedState);
  currentQuestionIndex = state.currentQuestionIndex;
  timeLeft = state.timeLeft;
  
  if (state.isGameStarted && !state.isGameOver) {
    showGameScreen();
    loadQuestion(currentQuestionIndex);
    startTimer();
    return true;
  } else if (state.isGameOver) {
    showResultScreen(state.isClear);
    return true;
  }
  
  return false;
}

// 状態をリセットする関数
function resetGameState() {
  localStorage.removeItem('gameState');
}

// ゲームをリセットして初期画面に戻る関数
function resetGame() {
  // タイマーを停止
  if (timerId) {
    clearInterval(timerId);
  }
  
  // 状態をリセット
  currentQuestionIndex = 0;
  timeLeft = GAME_CONFIG.TIME_LIMIT;
  
  // タイマー表示をリセット
  document.getElementById("timer").textContent = formatTime(timeLeft);
  document.querySelector("h2").classList.remove("warning");
  document.getElementById("timer").style.visibility = "visible";
  
  // 入力欄をクリア
  document.getElementById("user-answer").value = "";
  
  // スタート画面を表示
  showStartScreen();
}

// ヒントモーダルを表示する関数
function showHintModal() {
  const currentQuestion = GAME_QUESTIONS[currentQuestionIndex];
  
  if (currentQuestion.hints && currentQuestion.hints.length > 0) {
    // ヒントをモーダルに設定
    document.getElementById("hint-text").textContent = currentQuestion.hints[currentHintIndex];
    
    // ヒント番号を表示
    updateHintCounter();
    
    // 次へボタンの表示制御
    updateNextButtonVisibility();
    
    // モーダルを表示
    document.getElementById("hint-modal").style.display = "block";
  } else {
    // ヒントがない場合のメッセージ
    document.getElementById("hint-text").textContent = "このステージにはヒントがありません。";
    document.getElementById("hint-number").style.display = "none";
    document.getElementById("next-hint").style.display = "none";
    document.getElementById("hint-modal").style.display = "block";
  }
}

// 次のヒントを表示する関数
function showNextHint() {
  const currentQuestion = GAME_QUESTIONS[currentQuestionIndex];
  
  if (currentQuestion.hints && currentHintIndex < currentQuestion.hints.length - 1) {
    currentHintIndex++;
    document.getElementById("hint-text").textContent = currentQuestion.hints[currentHintIndex];
    
    // ヒント番号を更新
    updateHintCounter();
    
    // 次へボタンの表示制御
    updateNextButtonVisibility();
  }
}

// ヒントカウンターを更新する関数
function updateHintCounter() {
  const currentQuestion = GAME_QUESTIONS[currentQuestionIndex];
  const hintCounter = document.getElementById("hint-number");
  
  if (currentQuestion.hints && currentQuestion.hints.length > 0) {
    hintCounter.textContent = `ヒント ${currentHintIndex + 1}/${currentQuestion.hints.length}`;
    hintCounter.style.display = "block";
  } else {
    hintCounter.style.display = "none";
  }
}

// 次へボタンの表示/非表示を切り替える関数
function updateNextButtonVisibility() {
  const currentQuestion = GAME_QUESTIONS[currentQuestionIndex];
  const nextButton = document.getElementById("next-hint");
  
  if (currentQuestion.hints && currentHintIndex < currentQuestion.hints.length - 1) {
    nextButton.style.display = "block";
  } else {
    nextButton.style.display = "none";
  }
}

// ヒントモーダルを閉じる関数
function hideHintModal() {
  document.getElementById("hint-modal").style.display = "none";
}
