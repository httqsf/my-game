/*************************************************
 *  ゲーム用データ（問題情報など）
 *************************************************/
const questions = [
  {
    stage: 1,
    text: "'宝石'はなんと読むでしょう？",
    image: "assets/images/jewel.jpg", // 画像がない場合は "" とする
    // 複数答えのうち、いずれかに完全一致すれば正解とする
    answers: ["ほうせき", "宝石", "Jewel"]
  },
  {
    stage: 2,
    text: "これは何色ですか？",
    image: "assets/images/color.png",
    answers: ["あか", "赤"]
  },
  {
    stage: 3,
    text: "次の文字列を英語でなんと言う？『こんにちは』",
    image: "",
    answers: ["hello", "Hello", "HELLO"]
  }
];

/*************************************************
 *  変数・定数
 *************************************************/
// 現在の問題番号（0 ～ questions.length-1）
let currentQuestionIndex = 0;

// タイマー用
let timeLeft = 900; // 15分（900秒）
let timerId = null;

/*************************************************
 *  初期化処理
 *************************************************/
window.addEventListener("DOMContentLoaded", () => {
  // スタートボタン押下時の処理
  document.getElementById("start-button").addEventListener("click", () => {
    // ゲーム画面を表示
    showGameScreen();
    // タイマー開始
    startTimer();
    // 最初の問題をセット
    currentQuestionIndex = 0;
    loadQuestion(currentQuestionIndex);
  });

  // 答え送信ボタン押下時の処理
  document.getElementById("submit-answer").addEventListener("click", () => {
    checkAnswer();
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
  timeLeft = 900; // 15分
  document.getElementById("timer").textContent = formatTime(timeLeft);

  // 既にタイマーが動いていた場合はクリア
  if (timerId) {
    clearInterval(timerId);
  }

  // 1秒ごとに残り時間を更新
  timerId = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = formatTime(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timerId);
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
  const q = questions[index];
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
}

function checkAnswer() {
  const userAnswer = document.getElementById("user-answer").value.trim();
  const correctAnswers = questions[currentQuestionIndex].answers;

  // 完全一致（配列のいずれかと一致すれば正解）
  // 大文字・小文字を区別しない場合は、toLowerCase()を使って比較してください
  const isCorrect = correctAnswers.includes(userAnswer);

  if (isCorrect) {
    // 正解 → 次の問題へ
    currentQuestionIndex++;
    // 全問正解したか確認
    if (currentQuestionIndex >= questions.length) {
      // 全問正解 → ゲームクリア
      clearInterval(timerId); // タイマー停止
      showResultScreen(true);
    } else {
      // 次の問題を読み込む
      loadQuestion(currentQuestionIndex);
    }
  } else {
    // 不正解時の処理（演出のみ）
    alert("不正解です。もう一度挑戦してください。");
  }
}
